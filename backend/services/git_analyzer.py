import git
import os
import tempfile
import shutil
from datetime import datetime
import hashlib
from typing import Dict, List, Any

class GitAnalyzer:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
    
    def get_repo_id(self, repo_url: str) -> str:
        """Generate unique ID for repository"""
        return hashlib.md5(repo_url.encode()).hexdigest()
    
    def analyze_repository(self, repo_url: str, max_commits: int = 1000) -> Dict[str, Any]:
        """Clone and analyze git repository"""
        repo_path = os.path.join(self.temp_dir, self.get_repo_id(repo_url))
        
        try:
            # Clone repository
            if os.path.exists(repo_path):
                shutil.rmtree(repo_path)
            
            # Clone repository with optimizations for large repos
            repo = git.Repo.clone_from(
                repo_url, 
                repo_path,
                depth=min(max_commits + 100, 500),  # Very shallow clone based on needed commits
                single_branch=True,  # Only clone main/master branch
                progress=None  # Disable progress to avoid hanging
            )
            
            # Extract commit data
            commits = self._extract_commits(repo, max_commits)
            files = self._extract_file_stats(repo)
            stats = self._calculate_stats(commits, files)
            
            return {
                "commits": commits,
                "files": files,
                "stats": stats
            }
            
        except Exception as e:
            raise Exception(f"Failed to analyze repository: {str(e)}")
        finally:
            # Cleanup
            if os.path.exists(repo_path):
                shutil.rmtree(repo_path)
    
    def _extract_commits(self, repo: git.Repo, max_commits: int) -> List[Dict[str, Any]]:
        """Extract commit data from repository"""
        commits = []
        
        for i, commit in enumerate(repo.iter_commits()):
            if i >= max_commits:
                break
            
            # Get changed files
            changed_files = []
            if commit.parents:
                # Compare with first parent
                diffs = commit.parents[0].diff(commit)
                changed_files = [diff.a_path or diff.b_path for diff in diffs]
            
            commit_data = {
                "hash": commit.hexsha,
                "message": commit.message.strip(),
                "author": commit.author.name,
                "email": commit.author.email,
                "date": commit.committed_datetime.isoformat(),
                "files": changed_files,
                "stats": {
                    "insertions": commit.stats.total["insertions"],
                    "deletions": commit.stats.total["deletions"],
                    "files_changed": commit.stats.total["files"]
                }
            }
            
            commits.append(commit_data)
        
        return commits
    
    def _extract_file_stats(self, repo: git.Repo) -> Dict[str, Any]:
        """Extract file statistics from repository (optimized for speed)"""
        files = {}
        
        # Only get top-level files and important directories for speed
        try:
            file_count = 0
            for item in repo.head.commit.tree.traverse():
                if item.type == 'blob' and file_count < 100:  # Limit files processed
                    file_path = item.path
                    # Skip deep nested files or very large files
                    if file_path.count('/') > 3 or item.size > 1000000:  # Skip files deeper than 3 levels or > 1MB
                        continue
                        
                    files[file_path] = {
                        "size": item.size,
                        "type": self._get_file_type(file_path),
                        "last_modified": repo.head.commit.committed_datetime.isoformat()
                    }
                    file_count += 1
        except Exception as e:
            # If file traversal fails, return minimal data
            print(f"Error extracting file stats: {e}")
        
        return files
    
    def _get_file_type(self, file_path: str) -> str:
        """Determine file type based on extension"""
        ext = os.path.splitext(file_path)[1].lower()
        
        type_mapping = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'react',
            '.tsx': 'react',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
            '.md': 'markdown',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sql': 'sql'
        }
        
        return type_mapping.get(ext, 'other')
    
    def _calculate_stats(self, commits: List[Dict], files: Dict) -> Dict[str, Any]:
        """Calculate repository statistics"""
        if not commits:
            return {}
        
        # Time range
        dates = [datetime.fromisoformat(c["date"].replace('Z', '+00:00')) for c in commits]
        
        # File type distribution
        file_types = {}
        for file_info in files.values():
            file_type = file_info["type"]
            file_types[file_type] = file_types.get(file_type, 0) + 1
        
        # Author statistics
        authors = {}
        for commit in commits:
            author = commit["author"]
            if author not in authors:
                authors[author] = {"commits": 0, "insertions": 0, "deletions": 0}
            authors[author]["commits"] += 1
            authors[author]["insertions"] += commit["stats"]["insertions"]
            authors[author]["deletions"] += commit["stats"]["deletions"]
        
        return {
            "total_commits": len(commits),
            "total_files": len(files),
            "file_types": file_types,
            "authors": authors,
            "date_range": {
                "start": min(dates).isoformat(),
                "end": max(dates).isoformat()
            },
            "total_insertions": sum(c["stats"]["insertions"] for c in commits),
            "total_deletions": sum(c["stats"]["deletions"] for c in commits)
        }