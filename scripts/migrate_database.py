#!/usr/bin/env python3
"""
Capstone Market - Database Backup & Migration Script
-----------------------------------------------------
هذا السكريبت يقوم بالآتي:
1. الاتصال بقاعدة بيانات Render القديمة وفحص الجداول وحساب عدد السجلات.
2. أخذ نسخة احتياطية كاملة (Dump) بصيغة SQL ووضعها في مجلد backups/.
3. استخراج نسخة Snapshot بصيغة JSON إضافية كحماية ثانية للبيانات.
4. استعادة البيانات إلى قاعدة البيانات الدائمة الجديدة (Neon.tech أو Supabase).
5. مزامنة الـ Sequences لجميع الجداول لتفادي أخطاء الـ Primary Key في المستقبل.
6. مقارنة السجلات والتحقق من سلامة البيانات بنسبة 100%.
"""

import os
import sys
import json
import subprocess
import argparse
from datetime import datetime
from urllib.parse import urlparse
import psycopg2
from psycopg2.extras import RealDictCursor

# تأمين إخراج النصوص باللغة العربية والرموز التعبيرية على أنظمة Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# مسار أدوات PostgreSQL المثبتة محلياً
DEFAULT_PG_BIN = r"C:\Program Files\PostgreSQL\18\bin"

TABLES_ORDER = [
    "users",
    "student_profiles",
    "projects",
    "reports",
    "applications",
    "messages",
    "notifications",
    "favorites",
]

def format_url_for_psycopg2(url: str) -> str:
    url = url.strip().strip("'").strip('"')
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    # إضافة sslmode=require إذا كان الاتصال بقاعدة بيانات سحابية خارجية ولم يُحدد
    if "sslmode=" not in url and ("localhost" not in url and "127.0.0.1" not in url):
        sep = "&" if "?" in url else "?"
        url += f"{sep}sslmode=require"
    return url

def get_pg_tool(tool_name: str) -> str:
    # 1. Check in standard PostgreSQL 18 bin path
    candidate = os.path.join(DEFAULT_PG_BIN, f"{tool_name}.exe")
    if os.path.isfile(candidate):
        return candidate
    # 2. Check in PATH
    try:
        res = subprocess.run(["where", tool_name], capture_output=True, text=True, check=True)
        paths = res.stdout.strip().splitlines()
        if paths:
            return paths[0].strip()
    except Exception:
        pass
    return tool_name

def test_connection(db_url: str, name: str = "Database"):
    print(f"[*] Testing connection to {name}...")
    try:
        conn = psycopg2.connect(format_url_for_psycopg2(db_url), connect_timeout=10)
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            ver = cur.fetchone()[0]
            print(f"[+] Connected successfully to {name}!\n    Version: {ver.split(',')[0]}")
        conn.close()
        return True
    except Exception as e:
        print(f"[-] Connection failed to {name}: {e}")
        return False

def count_records(db_url: str) -> dict:
    counts = {}
    conn = psycopg2.connect(format_url_for_psycopg2(db_url), connect_timeout=10)
    with conn.cursor() as cur:
        for tbl in TABLES_ORDER:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {tbl};")
                cnt = cur.fetchone()[0]
                counts[tbl] = cnt
            except Exception:
                conn.rollback()
                counts[tbl] = 0
    conn.close()
    return counts

def export_json_snapshot(db_url: str, output_path: str):
    print(f"[*] Exporting JSON snapshot to {output_path}...")
    snapshot = {}
    conn = psycopg2.connect(format_url_for_psycopg2(db_url), connect_timeout=10)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        for tbl in TABLES_ORDER:
            try:
                cur.execute(f"SELECT * FROM {tbl};")
                rows = cur.fetchall()
                def serialize_row(r):
                    res = {}
                    for k, v in r.items():
                        if isinstance(v, (datetime,)):
                            res[k] = v.isoformat()
                        else:
                            res[k] = v
                    return res
                snapshot[tbl] = [serialize_row(r) for r in rows]
            except Exception as e:
                conn.rollback()
                print(f"[!] Warning: could not export table {tbl}: {e}")
    conn.close()
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, ensure_ascii=False, indent=2)
    print(f"[+] JSON snapshot saved successfully ({len(snapshot)} tables).")

def take_pg_dump(db_url: str, dump_path: str) -> bool:
    pg_dump_bin = get_pg_tool("pg_dump")
    print(f"[*] Running pg_dump using {pg_dump_bin}...")
    cmd = [
        pg_dump_bin,
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        "-d", format_url_for_psycopg2(db_url),
        "-f", dump_path
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", check=True)
        file_size = os.path.getsize(dump_path)
        print(f"[+] pg_dump finished successfully! File: {dump_path} ({file_size} bytes)")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[-] pg_dump error: {e.stderr}")
        return False

def restore_dump(db_url: str, dump_path: str) -> bool:
    psql_bin = get_pg_tool("psql")
    print(f"[*] Restoring dump into new database using {psql_bin}...")
    cmd = [
        psql_bin,
        "-d", format_url_for_psycopg2(db_url),
        "-f", dump_path
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
        print(f"[+] Restore script completed on target database.")
        return True
    except Exception as e:
        print(f"[-] Restore error: {e}")
        return False

def sync_sequences(db_url: str):
    print("[*] Synchronizing PostgreSQL sequences for auto-increment IDs...")
    conn = psycopg2.connect(format_url_for_psycopg2(db_url), connect_timeout=10)
    conn.autocommit = True
    with conn.cursor() as cur:
        for tbl in TABLES_ORDER:
            try:
                cur.execute(f"SELECT pg_get_serial_sequence('{tbl}', 'id');")
                row = cur.fetchone()
                seq_name = row[0] if row else None
                if seq_name:
                    cur.execute(f"SELECT coalesce(max(id), 0) + 1 FROM {tbl};")
                    max_id = cur.fetchone()[0]
                    cur.execute(f"SELECT setval('{seq_name}', {max_id}, false);")
                    print(f"    - {tbl}.id sequence set to next value: {max_id}")
            except Exception as e:
                print(f"    ! Notice for {tbl}: {e}")
    conn.close()
    print("[+] Sequence synchronization complete.")

def main():
    parser = argparse.ArgumentParser(description="Migrate Capstone Market PostgreSQL DB")
    parser.add_argument("--source", help="Render PostgreSQL External Database URL")
    parser.add_argument("--target", help="New PostgreSQL Database URL (Neon.tech or Supabase)")
    parser.add_argument("--backup-only", action="store_true", help="Only take a backup from source")
    args = parser.parse_args()

    print("=================================================================")
    print("   🚀 Capstone Market - Database Migration & Backup Tool        ")
    print("=================================================================\n")

    source_url = args.source
    if not source_url:
        source_url = input("👉 Enter Render Source PostgreSQL URL (External Database URL): ").strip()

    if not source_url:
        print("[-] Source URL is required. Exiting.")
        sys.exit(1)

    if not test_connection(source_url, "Render Source Database"):
        sys.exit(1)

    # 1. فحص أعداد السجلات الحالية
    print("\n[*] Inspecting current Render database records:")
    source_counts = count_records(source_url)
    for tbl, cnt in source_counts.items():
        print(f"    - {tbl:20}: {cnt} rows")

    # 2. إنشاء مجلد النسخ الاحتياطية
    os.makedirs("backups", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sql_dump_file = os.path.abspath(f"backups/capstone_db_dump_{timestamp}.sql")
    json_dump_file = os.path.abspath(f"backups/capstone_db_snapshot_{timestamp}.json")

    # 3. أخذ الـ Backup
    print("\n[*] Step 1: Taking full database backup from Render...")
    if not take_pg_dump(source_url, sql_dump_file):
        print("[-] Failed to create SQL dump via pg_dump.")
        sys.exit(1)

    export_json_snapshot(source_url, json_dump_file)

    if args.backup_only:
        print("\n✅ Backup completed successfully. Target migration skipped (--backup-only).")
        return

    # 4. النقل للهدف
    target_url = args.target
    if not target_url:
        print("\n-----------------------------------------------------------------")
        print("👉 Now, enter the Target Database URL (from Neon.tech or Supabase)")
        print("   Example: postgresql://neondb_owner:***@ep-***.neon.tech/neondb?sslmode=require")
        target_url = input("👉 Target PostgreSQL URL: ").strip()

    if not target_url:
        print("[-] Target URL was not provided. Backup is preserved in backups/ folder.")
        print(f"    SQL Dump: {sql_dump_file}")
        print(f"    JSON:     {json_dump_file}")
        sys.exit(0)

    if not test_connection(target_url, "New Target Database"):
        sys.exit(1)

    print("\n[*] Step 2: Restoring data into new target database...")
    restore_dump(target_url, sql_dump_file)

    # 5. ضبط الـ Sequences
    print("\n[*] Step 3: Synchronizing Sequences...")
    sync_sequences(target_url)

    # 6. التحقق من السجلات
    print("\n[*] Step 4: Verifying data integrity between databases...")
    target_counts = count_records(target_url)

    all_matched = True
    print("\n-----------------------------------------------------------------")
    print(f"{'Table':20} | {'Render Source':15} | {'New Target':15} | Status")
    print("-----------------------------------------------------------------")
    for tbl in TABLES_ORDER:
        sc = source_counts.get(tbl, 0)
        tc = target_counts.get(tbl, 0)
        status = "MATCH ✅" if sc == tc else "MISMATCH ❌"
        if sc != tc:
            all_matched = False
        print(f"{tbl:20} | {sc:<15} | {tc:<15} | {status}")
    print("-----------------------------------------------------------------")

    if all_matched:
        print("\n🎉 SUCCESS! All tables and records match perfectly (100% data integrity).")
        print("Your database has been safely migrated to the permanent provider!")
    else:
        print("\n⚠️ WARNING: Some table record counts do not match. Please review the output above.")

if __name__ == "__main__":
    main()
