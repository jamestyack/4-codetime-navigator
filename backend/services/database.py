import sqlite3
import json
import os
from typing import Dict, Any, Optional, List
from datetime import datetime

class Database:
    def __init__(self, db_path: str = "analysis_cache.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize SQLite database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create analysis table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                repo_id TEXT PRIMARY KEY,
                repo_url TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                data TEXT,
                error_message TEXT
            )
        """)
        
        conn.commit()
        conn.close()
    
    def store_analysis(self, repo_id: str, analysis_data: Dict[str, Any]):
        """Store complete analysis results"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT OR REPLACE INTO analyses 
            (repo_id, repo_url, status, created_at, updated_at, data, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            repo_id,
            analysis_data["repo_url"],
            analysis_data["status"],
            now,
            now,
            json.dumps(analysis_data),
            None
        ))
        
        conn.commit()
        conn.close()
    
    def get_analysis(self, repo_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve analysis by repository ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT data, status, error_message, updated_at 
            FROM analyses 
            WHERE repo_id = ?
        """, (repo_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            data, status, error_message, updated_at = result
            if data:
                analysis = json.loads(data)
                analysis["updated_at"] = updated_at
                return analysis
            else:
                return {
                    "repo_id": repo_id,
                    "status": status,
                    "error_message": error_message,
                    "updated_at": updated_at
                }
        
        return None
    
    def update_analysis_status(self, repo_id: str, status: str, error_message: str = None):
        """Update analysis status"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        # Check if record exists
        cursor.execute("SELECT repo_id FROM analyses WHERE repo_id = ?", (repo_id,))
        exists = cursor.fetchone()
        
        if exists:
            cursor.execute("""
                UPDATE analyses 
                SET status = ?, updated_at = ?, error_message = ?
                WHERE repo_id = ?
            """, (status, now, error_message, repo_id))
        else:
            cursor.execute("""
                INSERT INTO analyses 
                (repo_id, repo_url, status, created_at, updated_at, error_message)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (repo_id, "", status, now, now, error_message))
        
        conn.commit()
        conn.close()
    
    def list_analyses(self) -> List[Dict[str, Any]]:
        """List all stored analyses"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT repo_id, repo_url, status, created_at, updated_at 
            FROM analyses 
            ORDER BY updated_at DESC
        """)
        
        results = []
        for row in cursor.fetchall():
            repo_id, repo_url, status, created_at, updated_at = row
            results.append({
                "repo_id": repo_id,
                "repo_url": repo_url,
                "status": status,
                "created_at": created_at,
                "updated_at": updated_at
            })
        
        conn.close()
        return results
    
    def delete_analysis(self, repo_id: str):
        """Delete analysis by repository ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM analyses WHERE repo_id = ?", (repo_id,))
        
        conn.commit()
        conn.close()
    
    def cleanup_old_analyses(self, days: int = 7):
        """Remove analyses older than specified days"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cutoff_date = datetime.now().timestamp() - (days * 24 * 60 * 60)
        cutoff_iso = datetime.fromtimestamp(cutoff_date).isoformat()
        
        cursor.execute("""
            DELETE FROM analyses 
            WHERE updated_at < ?
        """, (cutoff_iso,))
        
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        return deleted_count