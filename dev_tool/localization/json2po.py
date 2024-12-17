#!/usr/bin/env python3
from typing import Dict, Any, List, Tuple
import json
import polib
import os
import glob
from datetime import datetime
from pathlib import Path
import subprocess

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

def load_json_file(file_path: str | Path) -> Dict[str, str]:
    """JSONファイルを読み込む
    
    Args:
        file_path: JSONファイルのパス
        
    Returns:
        読み込んだJSONデータ
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_all_source_files(repo_root: Path) -> List[Tuple[str, Dict[str, str]]]:
    """すべてのソースJSONファイルを読み込む
    
    Args:
        repo_root: リポジトリのルートパス
        
    Returns:
        (ファイル識別子, JSONデータ) のリスト
    """
    sources: List[Tuple[str, Dict[str, str]]] = []
    
    # l10n/bundle.l10n.json
    bundle_path = repo_root / 'l10n' / 'bundle.l10n.json'
    if bundle_path.exists():
        sources.append(('bundle.l10n.json', load_json_file(bundle_path)))
    
    # package.nls.json
    nls_path = repo_root / 'package.nls.json'
    if nls_path.exists():
        sources.append(('package.nls.json', load_json_file(nls_path)))
    
    return sources

def create_pot_file(sources: List[Tuple[str, Dict[str, str]]], output_path: str | Path) -> None:
    """POTファイルを作成する
    
    Args:
        sources: (ファイル識別子, JSONデータ) のリスト
        output_path: 出力先のパス
    """
    pot = polib.POFile()
    pot.metadata = {
        'Project-Id-Version': 'mojibake-inspector 1.0.0',
        'Report-Msgid-Bugs-To': 'https://github.com/ktyubeshi/mojibake-inspector/issues',
        'POT-Creation-Date': datetime.now().strftime('%Y-%m-%d %H:%M%z'),
        'PO-Revision-Date': 'YEAR-MO-DA HO:MI+ZONE',
        'Last-Translator': 'yubeshi<kt.yubeshi@gmail.com>',
        'MIME-Version': '1.0',
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding': '8bit',
    }

    for file_id, json_data in sources:
        for msgid, _ in json_data.items():
            entry = polib.POEntry(
                msgctxt=file_id,  # ファイル識別子をmsgctxtとして使用
                msgid=msgid,
                msgstr='',
                occurrences=[(file_id, '')]
            )
            pot.append(entry)

    pot.save(str(output_path))

def create_po_file(
    pot_file: str | Path,
    sources: List[Tuple[str, Dict[str, str]]],
    output_path: str | Path,
    lang_code: str
) -> None:
    """POファイルを作成する
    
    Args:
        pot_file: POTファイルのパス
        sources: (ファイル識別子, JSONデータ) のリスト
        output_path: 出力先のパス
        lang_code: 言語コード（例: 'ja'）
    """
    po = polib.pofile(str(pot_file))
    po.metadata['Language'] = lang_code
    po.metadata['PO-Revision-Date'] = datetime.now().strftime('%Y-%m-%d %H:%M%z')

    # 翻訳データを辞書に変換
    translations = {}
    for file_id, json_data in sources:
        translations[file_id] = json_data

    for entry in po:
        file_id = entry.msgctxt
        if file_id in translations and entry.msgid in translations[file_id]:
            entry.msgstr = translations[file_id][entry.msgid]

    po.save(str(output_path))

def main() -> None:
    """メイン処理"""
    # Gitリポジトリのルートを取得
    repo_root = get_git_root()
    l10n_dir = repo_root / 'l10n'
    
    # すべてのソースファイルを読み込む
    sources = load_all_source_files(repo_root)
    
    # POTファイルを作成
    create_pot_file(sources, l10n_dir / 'messages.pot')

    # 翻訳ファイルを処理
    translated_sources: List[Tuple[str, Dict[str, str]]] = []
    
    # l10n/bundle.l10n.*.json の処理
    for json_file in l10n_dir.glob('bundle.l10n.*.json'):
        if json_file.stem == 'bundle.l10n':  # 基準ファイルはスキップ
            continue
        lang_code = json_file.stem.split('.')[-1]
        translated_sources.append(('bundle.l10n.json', load_json_file(json_file)))
        
        # package.nls.*.json の処理
        nls_file = repo_root / f'package.nls.{lang_code}.json'
        if nls_file.exists():
            translated_sources.append(('package.nls.json', load_json_file(nls_file)))
        
        create_po_file(
            l10n_dir / 'messages.pot',
            translated_sources,
            l10n_dir / f'messages.{lang_code}.po',
            lang_code
        )
        translated_sources.clear()

if __name__ == '__main__':
    main() 