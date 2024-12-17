#!/usr/bin/env python3
from typing import Dict, Any
import json
import polib
import os
from pathlib import Path
import subprocess
from collections import defaultdict

def get_git_root() -> Path:
    """Gitリポジトリのルートディレクトリを取得する
    
    Returns:
        Gitリポジトリのルートパス
        
    Raises:
        subprocess.CalledProcessError: gitコマンドが失敗した場合
        FileNotFoundError: gitコマンドが見つからない場合
    """
    try:
        git_root = subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], 
                                         universal_newlines=True).strip()
        return Path(git_root)
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Error: Unable to find git root: {e}")
        print("Please run this script from within the git repository")
        raise

def load_po_file(po_path: str | Path) -> Dict[str, Dict[str, str]]:
    """POファイルを読み込んでDict形式に変換する
    
    Args:
        po_path: POファイルのパス
        
    Returns:
        {file_id: {msgid: msgstr}} の形式の辞書
    """
    po = polib.pofile(str(po_path))
    translations: Dict[str, Dict[str, str]] = defaultdict(dict)
    for entry in po:
        if entry.msgstr and entry.msgctxt:  # 翻訳が存在し、msgctxtがある場合のみ
            translations[entry.msgctxt][entry.msgid] = entry.msgstr
    return dict(translations)  # defaultdictからdictに変換して返す

def update_json_file(json_path: str | Path, translations: Dict[str, str]) -> None:
    """JSONファイルを翻訳で更新する
    
    Args:
        json_path: 更新するJSONファイルのパス
        translations: 翻訳データ
    """
    # 既存のJSONを読み込む
    with open(json_path, 'r', encoding='utf-8') as f:
        json_data: Dict[str, str] = json.load(f)
    
    # 翻訳を適用
    for key, value in translations.items():
        if key in json_data:
            json_data[key] = value
    
    # 更新したJSONを保存
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
        f.write('\n')  # 最後に改行を追加

def main() -> None:
    """メイン処理"""
    # Gitリポジトリのルートを取得
    repo_root = get_git_root()
    l10n_dir = repo_root / 'l10n'
    
    # POファイルを処理
    for po_file in l10n_dir.glob('messages.*.po'):
        # 言語コードを取得（例: messages.ja.po から ja を取得）
        lang_code = po_file.stem.split('.')[-1]
        
        # POファイルから翻訳を読み込む
        translations_by_file = load_po_file(po_file)
        
        # bundle.l10n.*.json の更新
        if 'bundle.l10n.json' in translations_by_file:
            json_path = l10n_dir / f'bundle.l10n.{lang_code}.json'
            if json_path.exists():
                update_json_file(json_path, translations_by_file['bundle.l10n.json'])
                print(f"Updated {json_path}")
        
        # package.nls.*.json の更新
        if 'package.nls.json' in translations_by_file:
            json_path = repo_root / f'package.nls.{lang_code}.json'
            if json_path.exists():
                update_json_file(json_path, translations_by_file['package.nls.json'])
                print(f"Updated {json_path}")

if __name__ == '__main__':
    main() 