from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from services.git_analyzer import GitAnalyzer
from services.llm_analyzer import LLMAnalyzer
from services.database import Database
import json

load_dotenv()

app = FastAPI(title="CodeTime Navigator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

git_analyzer = GitAnalyzer()
llm_analyzer = LLMAnalyzer()
db = Database()

class AnalyzeRequest(BaseModel):
    repo_url: str
    max_commits: int = 1000

class QueryRequest(BaseModel):
    repo_id: str
    query: str

@app.get("/")
async def root():
    return {"message": "CodeTime Navigator API"}

@app.post("/analyze")
async def analyze_repository(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    try:
        repo_id = git_analyzer.get_repo_id(request.repo_url)
        
        # Check if already analyzed
        existing_analysis = db.get_analysis(repo_id)
        if existing_analysis:
            return {"repo_id": repo_id, "status": "completed", "cached": True}
        
        # Start background analysis
        background_tasks.add_task(
            analyze_repo_background, 
            repo_id, 
            request.repo_url, 
            request.max_commits
        )
        
        return {"repo_id": repo_id, "status": "processing", "cached": False}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/analysis/{repo_id}")
async def get_analysis_status(repo_id: str):
    analysis = db.get_analysis(repo_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@app.post("/query")
async def query_repository(request: QueryRequest):
    try:
        analysis = db.get_analysis(request.repo_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Repository not analyzed")
        
        if analysis["status"] != "completed":
            raise HTTPException(status_code=400, detail="Analysis still in progress")
        
        # Process query with LLM
        result = await llm_analyzer.process_query(
            request.query,
            analysis["commits"],
            analysis["patterns"]
        )
        
        return {"query": request.query, "result": result}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/visualize/{repo_id}")
async def get_visualization_data(repo_id: str):
    try:
        analysis = db.get_analysis(repo_id)
        if not analysis or analysis["status"] != "completed":
            raise HTTPException(status_code=404, detail="Analysis not found or incomplete")
        
        # Generate visualization data
        viz_data = {
            "timeline": generate_timeline_data(analysis["commits"]),
            "heatmap": generate_heatmap_data(analysis["commits"]),
            "ownership": generate_ownership_data(analysis["commits"])
        }
        
        return viz_data
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def analyze_repo_background(repo_id: str, repo_url: str, max_commits: int):
    try:
        # Update status to processing
        db.update_analysis_status(repo_id, "processing")
        
        # Clone and analyze repository
        repo_data = git_analyzer.analyze_repository(repo_url, max_commits)
        
        # Perform semantic analysis
        patterns = await llm_analyzer.analyze_patterns(repo_data["commits"])
        
        # Store complete analysis
        analysis_data = {
            "repo_id": repo_id,
            "repo_url": repo_url,
            "status": "completed",
            "commits": repo_data["commits"],
            "files": repo_data["files"],
            "patterns": patterns,
            "stats": repo_data["stats"]
        }
        
        db.store_analysis(repo_id, analysis_data)
        
    except Exception as e:
        db.update_analysis_status(repo_id, "failed", str(e))

def generate_timeline_data(commits):
    """Generate timeline visualization data"""
    timeline = []
    for commit in commits:
        if commit.get("category") in ["architecture", "major_feature"]:
            timeline.append({
                "date": commit["date"],
                "message": commit["message"],
                "author": commit["author"],
                "category": commit["category"],
                "files_changed": len(commit["files"])
            })
    return timeline

def generate_heatmap_data(commits):
    """Generate file change heatmap data"""
    file_changes = {}
    for commit in commits:
        for file_path in commit["files"]:
            if file_path not in file_changes:
                file_changes[file_path] = 0
            file_changes[file_path] += 1
    
    # Convert to heatmap format
    heatmap = [
        {"file": file, "changes": count}
        for file, count in sorted(file_changes.items(), key=lambda x: x[1], reverse=True)[:50]
    ]
    return heatmap

def generate_ownership_data(commits):
    """Generate code ownership data"""
    author_stats = {}
    for commit in commits:
        author = commit["author"]
        if author not in author_stats:
            author_stats[author] = {"commits": 0, "files": set()}
        author_stats[author]["commits"] += 1
        author_stats[author]["files"].update(commit["files"])
    
    ownership = [
        {
            "author": author,
            "commits": stats["commits"],
            "files_touched": len(stats["files"])
        }
        for author, stats in author_stats.items()
    ]
    return sorted(ownership, key=lambda x: x["commits"], reverse=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)