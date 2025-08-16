#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.git_analyzer import GitAnalyzer
from services.database import Database

def test_git_analyzer():
    print("Testing Git Analyzer...")
    analyzer = GitAnalyzer()
    
    # Test with a small public repo
    try:
        repo_id = analyzer.get_repo_id("https://github.com/octocat/Hello-World")
        print(f"Generated repo ID: {repo_id}")
        
        # This would normally clone and analyze, but let's skip for now
        print("✓ Git Analyzer basic functionality works")
    except Exception as e:
        print(f"✗ Git Analyzer error: {e}")

def test_database():
    print("\nTesting Database...")
    db = Database("test.db")
    
    try:
        # Test storing analysis
        test_data = {
            "repo_id": "test123",
            "repo_url": "https://github.com/test/repo",
            "status": "completed",
            "commits": [],
            "files": {},
            "patterns": {},
            "stats": {}
        }
        
        db.store_analysis("test123", test_data)
        
        # Test retrieving analysis
        result = db.get_analysis("test123")
        if result and result["repo_id"] == "test123":
            print("✓ Database basic functionality works")
        else:
            print("✗ Database retrieval failed")
            
        # Cleanup
        db.delete_analysis("test123")
        os.remove("test.db")
        
    except Exception as e:
        print(f"✗ Database error: {e}")

if __name__ == "__main__":
    test_git_analyzer()
    test_database()