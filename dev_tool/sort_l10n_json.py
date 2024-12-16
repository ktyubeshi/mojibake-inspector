#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from pathlib import Path


def sort_json_keys(json_data):
    """JSONオブジェクトのキーを再帰的にソートする"""
    if isinstance(json_data, dict):
        # 辞書の場合、キーでソートして新しい辞書を作成
        return {k: sort_json_keys(v) for k, v in sorted(json_data.items())}
    elif isinstance(json_data, list):
        # リストの場合、各要素に対して再帰的に処理
        return [sort_json_keys(item) for item in json_data]
    else:
        # その他の型はそのまま返す
        return json_data


def process_json_file(file_path):
    """JSONファイルを読み込み、ソートして保存する"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # キーをソート
        sorted_data = sort_json_keys(data)
        
        # 整形して保存（インデント2スペース）
        with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(sorted_data, f, ensure_ascii=False, indent=2)
            f.write('\n')  # 最後に改行を追加
        
        print(f"✓ Processed: {file_path}")
    except Exception as e:
        print(f"✗ Error processing {file_path}: {str(e)}")


def main():
    """メイン処理"""
    # スクリプトの場所を基準にしてl10nディレクトリを探す
    script_dir = Path(__file__).resolve().parent
    l10n_dir = script_dir.parent / 'l10n'
    
    # l10nディレクトリが存在することを確認
    if not l10n_dir.exists():
        print(f"Error: Directory not found: {l10n_dir}")
        return
    
    # JSONファイルを処理
    json_files = list(l10n_dir.glob('*.json'))
    if not json_files:
        print("No JSON files found in l10n directory")
        return
    
    print(f"Found {len(json_files)} JSON file(s)")
    for json_file in json_files:
        process_json_file(json_file)


if __name__ == '__main__':
    main() 