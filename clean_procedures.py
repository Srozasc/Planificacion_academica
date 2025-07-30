#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import os

def clean_sql_file(file_path):
    """Remove sp_LoadTeachers and sp_LoadTeachers_Debug procedures from SQL file"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False
    
    try:
        # Read file with different encodings
        content = None
        for encoding in ['utf-8', 'utf-8-sig', 'latin1', 'cp1252']:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                print(f"Successfully read {file_path} with {encoding} encoding")
                break
            except UnicodeDecodeError:
                continue
        
        if content is None:
            print(f"Could not read {file_path} with any encoding")
            return False
        
        # Remove null characters
        content = content.replace('\x00', '')
        
        original_size = len(content)
        
        # Pattern to match the complete procedure blocks
        # This pattern matches from DROP PROCEDURE to the END;; DELIMITER ; sequence
        pattern1 = r'/\*!50003 DROP PROCEDURE IF EXISTS `sp_LoadTeachers`[^/]*\*/;.*?END\s*;;\s*DELIMITER\s*;'
        pattern2 = r'/\*!50003 DROP PROCEDURE IF EXISTS `sp_LoadTeachers_Debug`[^/]*\*/;.*?END\s*;;\s*DELIMITER\s*;'
        
        # Remove both procedures
        content = re.sub(pattern1, '', content, flags=re.DOTALL)
        content = re.sub(pattern2, '', content, flags=re.DOTALL)
        
        # Also try alternative patterns
        alt_pattern1 = r'DROP PROCEDURE IF EXISTS.*?sp_LoadTeachers.*?;.*?CREATE.*?PROCEDURE.*?sp_LoadTeachers.*?END\s*;;'
        alt_pattern2 = r'DROP PROCEDURE IF EXISTS.*?sp_LoadTeachers_Debug.*?;.*?CREATE.*?PROCEDURE.*?sp_LoadTeachers_Debug.*?END\s*;;'
        
        content = re.sub(alt_pattern1, '', content, flags=re.DOTALL)
        content = re.sub(alt_pattern2, '', content, flags=re.DOTALL)
        
        new_size = len(content)
        
        # Write back the cleaned content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Cleaned {file_path}: {original_size} -> {new_size} characters")
        return True
        
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return False

def main():
    files_to_clean = [
        'estructura_bd.sql',
        'modelo_planificacion_academica.sql',
        'database/estructura_planificacion_academica.sql',
        'Documentacion/estructura_planificacion_academica.sql'
    ]
    
    for file_path in files_to_clean:
        print(f"\nProcessing {file_path}...")
        clean_sql_file(file_path)
    
    print("\nDone!")

if __name__ == '__main__':
    main()