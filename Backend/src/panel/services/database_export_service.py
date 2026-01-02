import io
import gzip
import subprocess
import os
import json
from datetime import datetime
from django.db import connections
from django.conf import settings
from django.core.management import call_command


def export_database_to_sql():
    """
    Export complete production database with smart Silk exclusion
    Automatically excludes Silk tables if they exist (dev only)
    
    Returns:
        BytesIO buffer containing gzipped SQL dump
    """
    try:
        db_conn = connections['default']
        db_config = db_conn.settings_dict
        
        if 'postgresql' not in db_config['ENGINE']:
            raise Exception("Database export is only supported for PostgreSQL")
        
        # 🧠 چک کردن وجود Silk به صورت هوشمند
        silk_tables_exist = _check_silk_tables_exist(db_conn)
        
        # 🚀 استفاده از pg_dump
        try:
            return _export_with_pg_dump_gzip(db_config, exclude_silk=silk_tables_exist)
        except (FileNotFoundError, subprocess.CalledProcessError) as e:
            # 🔄 Fallback به Django export
            print(f"pg_dump failed, using Django export: {str(e)}")
            return _export_with_django_to_sql_gzip(db_config, exclude_silk=silk_tables_exist)
        
    except Exception as e:
        raise Exception(f"Error exporting database: {str(e)}")


def _check_silk_tables_exist(db_conn):
    """
    چک کردن هوشمند وجود جداول Silk
    برمی‌گرداند True اگر حداقل یک جدول Silk وجود داشته باشد
    """
    try:
        with db_conn.cursor() as cursor:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name LIKE 'silk_%'
                    LIMIT 1
                )
            """)
            result = cursor.fetchone()
            return result[0] if result else False
    except Exception:
        # اگر خطا بود، فرض می‌کنیم Silk نیست
        return False


def _export_with_pg_dump_gzip(db_config, exclude_silk=False):
    """Export production database (excluding Silk) with gzip compression"""
    db_name = db_config['NAME']
    db_user = db_config.get('USER', '')
    db_host = db_config.get('HOST', 'localhost')
    db_port = db_config.get('PORT', '5432')
    db_password = db_config.get('PASSWORD', '')
    
    # 🚀 Plain SQL format برای سازگاری کامل
    pg_dump_args = [
        'pg_dump',
        '--no-owner',
        '--no-privileges',
        '--clean',
        '--if-exists',
        '--format=plain',  # Plain SQL
        '--encoding=UTF8',
        '--dbname', db_name,
        '--host', db_host,
        '--port', str(db_port),
        '--username', db_user,
    ]
    
    # 🧠 فقط اگر Silk وجود داشت باشد، exclude می‌کنیم
    if exclude_silk:
        pg_dump_args.extend([
            '--exclude-table=silk_request',
            '--exclude-table=silk_response',
            '--exclude-table=silk_sqlquery',
            '--exclude-table=silk_profile',
        ])
    
    env = os.environ.copy()
    if db_password:
        env['PGPASSWORD'] = db_password
    
    process = subprocess.Popen(
        pg_dump_args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
        text=False
    )
    
    stdout, stderr = process.communicate()
    
    if process.returncode != 0:
        error_msg = stderr.decode('utf-8', errors='ignore') if stderr else 'Unknown error'
        raise subprocess.CalledProcessError(process.returncode, pg_dump_args, error_msg)
    
    # 🗜️ فشرده‌سازی با gzip (بهترین نسبت فشرده‌سازی)
    compressed_data = gzip.compress(stdout, compresslevel=6)
    buffer = io.BytesIO(compressed_data)
    buffer.seek(0)
    return buffer
    
    env = os.environ.copy()
    if db_password:
        env['PGPASSWORD'] = db_password
    
    process = subprocess.Popen(
        pg_dump_args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
        text=False
    )
    
    stdout, stderr = process.communicate()
    
    if process.returncode != 0:
        error_msg = stderr.decode('utf-8', errors='ignore') if stderr else 'Unknown error'
        raise subprocess.CalledProcessError(process.returncode, pg_dump_args, error_msg)
    
    buffer = io.BytesIO(stdout)
    buffer.seek(0)
    return buffer


def _export_with_django_to_sql_gzip(db_config, exclude_silk=False):
    """Export database with smart Silk exclusion using psycopg (fallback)"""
    try:
        import psycopg
        from psycopg.rows import dict_row
    except ImportError:
        raise Exception("psycopg (psycopg3) is required for database export. Please install it: pip install 'psycopg[binary]'")
    
    # 🧠 فقط اگر Silk وجود داشت باشد، exclude می‌کنیم
    EXCLUDED_TABLES = {'silk_request', 'silk_response', 'silk_sqlquery', 'silk_profile'} if exclude_silk else set()
    
    # ابتدا SQL را در یک buffer بسازیم
    sql_lines = []
    
    db_name = db_config['NAME']
    db_user = db_config.get('USER', '')
    db_host = db_config.get('HOST', 'localhost')
    db_port = db_config.get('PORT', '5432')
    db_password = db_config.get('PASSWORD', '')
    
    conn = None
    cur = None
    
    try:
        conn = psycopg.connect(
            dbname=db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        cur = conn.cursor(row_factory=dict_row)
        
        sql_lines.append("-- PostgreSQL database dump")
        sql_lines.append(f"-- Generated by Django export")
        sql_lines.append(f"-- Database: {db_name}")
        sql_lines.append("")
        sql_lines.append("SET statement_timeout = 0;")
        sql_lines.append("SET lock_timeout = 0;")
        sql_lines.append("SET idle_in_transaction_session_timeout = 0;")
        sql_lines.append("SET client_encoding = 'UTF8';")
        sql_lines.append("SET standard_conforming_strings = on;")
        sql_lines.append("SELECT pg_catalog.set_config('search_path', '', false);")
        sql_lines.append("SET check_function_bodies = false;")
        sql_lines.append("SET xmloption = content;")
        sql_lines.append("SET client_min_messages = warning;")
        sql_lines.append("SET row_security = off;")
        sql_lines.append("")
        
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        tables = cur.fetchall()
        
        for table_row in tables:
            table_name = table_row['table_name']
            
            # 🧠 فقط اگر در لیست exclude بود، skip می‌کنیم
            if table_name in EXCLUDED_TABLES:
                continue
            
            cur.execute(f"""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position
            """, (table_name,))
            columns = cur.fetchall()
            
            if not columns:
                continue
            
            column_names = [col['column_name'] for col in columns]
            
            cur.execute(f'SELECT * FROM "{table_name}"')
            rows = cur.fetchall()
            
            if rows:
                for row in rows:
                    values = []
                    for col_name in column_names:
                        value = row[col_name]
                        if value is None:
                            values.append('NULL')
                        elif isinstance(value, bool):
                            values.append('TRUE' if value else 'FALSE')
                        elif isinstance(value, (int, float)):
                            values.append(str(value))
                        elif isinstance(value, (list, dict)):
                            json_value = json.dumps(value, ensure_ascii=False)
                            escaped = json_value.replace("'", "''")
                            values.append(f"'{escaped}'")
                        else:
                            escaped = str(value).replace("'", "''").replace('\\', '\\\\')
                            values.append(f"'{escaped}'")
                    
                    columns_str = ', '.join(f'"{col}"' for col in column_names)
                    values_str = ', '.join(values)
                    sql_lines.append(f'INSERT INTO "{table_name}" ({columns_str}) VALUES ({values_str});')
        
        sql_lines.append("")
        sql_lines.append("-- End of database dump")
        
        cur.close()
        conn.close()
        
        # تبدیل به string و فشرده‌سازی با gzip
        sql_content = '\n'.join(sql_lines)
        compressed_data = gzip.compress(sql_content.encode('utf-8'), compresslevel=6)
        
        buffer = io.BytesIO(compressed_data)
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        error_str = str(e)
        raise Exception(f"Database error: {error_str}")


def get_database_export_filename():
    """Generate filename for gzipped SQL backup"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    return f'database_backup_{timestamp}.sql.gz'  # .sql.gz for gzipped SQL


def get_database_size_info():
    try:
        db_conn = connections['default']
        with db_conn.cursor() as cursor:
            if 'postgresql' in db_conn.settings_dict['ENGINE']:
                cursor.execute("""
                    SELECT pg_size_pretty(pg_database_size(current_database())) as size,
                           (SELECT count(*) FROM information_schema.tables 
                            WHERE table_schema = 'public') as table_count
                """)
                result = cursor.fetchone()
                
                # Fetch top largest table to help user identify large data sources
                cursor.execute("""
                    SELECT
                        relname AS table_name,
                        pg_size_pretty(pg_total_relation_size(relid)) AS total_size
                    FROM pg_catalog.pg_statio_user_tables
                    ORDER BY pg_total_relation_size(relid) DESC
                    LIMIT 5;
                """)
                top_tables = cursor.fetchall()
                top_tables_data = [{'name': row[0], 'size': row[1]} for row in top_tables]

                return {
                    'size': result[0] if result else 'Unknown',
                    'table_count': result[1] if result else 0,
                    'top_tables': top_tables_data
                }
            elif 'sqlite' in db_conn.settings_dict['ENGINE']:
                cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
                table_count = cursor.fetchone()[0]
                return {
                    'size': 'Unknown',
                    'table_count': table_count,
                    'top_tables': []
                }
            else:
                return {
                    'size': 'Unknown',
                    'table_count': 0,
                    'top_tables': []
                }
    except Exception:
        return {
            'size': 'Unknown',
            'table_count': 0,
            'top_tables': []
        }
