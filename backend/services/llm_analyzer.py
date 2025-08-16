import openai
import anthropic
import os
import json
from typing import List, Dict, Any
import asyncio

class LLMAnalyzer:
    def __init__(self):
        self.openai_client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.anthropic_client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    async def analyze_patterns(self, commits: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze commit patterns using LLM"""
        # Categorize commits in batches
        categorized_commits = await self._categorize_commits(commits)
        
        # Detect architectural patterns
        architectural_patterns = await self._detect_architectural_patterns(categorized_commits)
        
        # Identify major milestones
        milestones = await self._identify_milestones(categorized_commits)
        
        return {
            "categorized_commits": categorized_commits,
            "architectural_patterns": architectural_patterns,
            "milestones": milestones
        }
    
    async def _categorize_commits(self, commits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Categorize commits using GPT-4"""
        categorized = []
        batch_size = 20  # Process commits in batches
        
        for i in range(0, len(commits), batch_size):
            batch = commits[i:i + batch_size]
            
            # Prepare commit data for analysis
            commit_texts = []
            for commit in batch:
                text = f"Message: {commit['message']}\nFiles: {', '.join(commit['files'][:5])}\nStats: +{commit['stats']['insertions']} -{commit['stats']['deletions']}"
                commit_texts.append(text)
            
            prompt = f"""
            Analyze these git commits and categorize each one. For each commit, determine:
            1. Category: feature, bugfix, refactor, documentation, test, architecture, performance, security, style
            2. Scope: frontend, backend, database, infrastructure, build, deployment, api, ui, core
            3. Impact: low, medium, high (based on files changed and lines modified)
            4. Description: brief 1-sentence summary of what changed
            
            Commits to analyze:
            {chr(10).join(f"{i+1}. {text}" for i, text in enumerate(commit_texts))}
            
            Return a JSON array with objects containing: category, scope, impact, description for each commit.
            """
            
            try:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3
                )
                
                analysis = json.loads(response.choices[0].message.content)
                
                # Merge analysis with original commits
                for j, commit_analysis in enumerate(analysis):
                    if i + j < len(commits):
                        enhanced_commit = commits[i + j].copy()
                        enhanced_commit.update(commit_analysis)
                        categorized.append(enhanced_commit)
                
            except Exception as e:
                # Fallback: add original commits without categorization
                print(f"Error categorizing commits batch {i}: {e}")
                for commit in batch:
                    enhanced_commit = commit.copy()
                    enhanced_commit.update({
                        "category": "unknown",
                        "scope": "unknown", 
                        "impact": "medium",
                        "description": commit["message"][:100]
                    })
                    categorized.append(enhanced_commit)
            
            # Rate limiting
            await asyncio.sleep(0.5)
        
        return categorized
    
    async def _detect_architectural_patterns(self, commits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect architectural patterns and decisions"""
        # Filter architectural commits
        arch_commits = [c for c in commits if c.get("category") in ["architecture", "refactor"]]
        
        if not arch_commits:
            return []
        
        # Analyze architectural evolution
        commit_summary = "\n".join([
            f"- {c['date']}: {c['message']} (Files: {', '.join(c['files'][:3])})"
            for c in arch_commits[:20]  # Limit to most recent architectural changes
        ])
        
        prompt = f"""
        Analyze these architectural commits and identify key patterns and decisions:
        
        {commit_summary}
        
        Identify:
        1. Design patterns introduced (MVC, Observer, Factory, etc.)
        2. Architectural decisions (microservices, monolith, separation of concerns)
        3. Technology migrations (framework changes, database changes)
        4. Code organization improvements (refactoring, modularization)
        
        Return a JSON array of patterns with: type, description, impact, commits_involved.
        """
        
        try:
            response = await self.anthropic_client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            return json.loads(response.content[0].text)
        
        except Exception as e:
            print(f"Error detecting architectural patterns: {e}")
            return []
    
    async def _identify_milestones(self, commits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify major project milestones"""
        # Filter high-impact commits
        milestones = []
        
        for commit in commits:
            if (commit.get("impact") == "high" or 
                commit.get("category") in ["architecture", "feature"] or
                commit["stats"]["files_changed"] > 10 or
                any(keyword in commit["message"].lower() 
                    for keyword in ["release", "version", "launch", "initial", "migration", "major"])):
                
                milestones.append({
                    "date": commit["date"],
                    "title": commit["message"][:100],
                    "description": commit.get("description", commit["message"]),
                    "category": commit.get("category", "unknown"),
                    "impact": commit.get("impact", "medium"),
                    "author": commit["author"],
                    "files_changed": commit["stats"]["files_changed"]
                })
        
        # Sort by date and return top milestones
        milestones.sort(key=lambda x: x["date"], reverse=True)
        return milestones[:20]
    
    async def process_query(self, query: str, commits: List[Dict], patterns: Dict) -> Dict[str, Any]:
        """Process natural language query about the repository"""
        # Prepare context from analysis
        context = {
            "total_commits": len(commits),
            "categories": {},
            "recent_commits": commits[:10],
            "patterns": patterns.get("architectural_patterns", []),
            "milestones": patterns.get("milestones", [])
        }
        
        # Count categories
        for commit in commits:
            category = commit.get("category", "unknown")
            context["categories"][category] = context["categories"].get(category, 0) + 1
        
        prompt = f"""
        You are analyzing a git repository. Answer this question based on the commit history and patterns:
        
        Question: {query}
        
        Repository Context:
        - Total commits: {context['total_commits']}
        - Commit categories: {context['categories']}
        - Recent commits: {json.dumps(context['recent_commits'][:5], indent=2)}
        - Architectural patterns: {json.dumps(context['patterns'][:3], indent=2)}
        - Key milestones: {json.dumps(context['milestones'][:5], indent=2)}
        
        Provide a comprehensive answer with:
        1. Direct answer to the question
        2. Supporting evidence from commits
        3. Timeline of relevant changes
        4. Key insights or patterns
        
        Format as JSON with: answer, evidence, timeline, insights.
        """
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            return json.loads(response.choices[0].message.content)
        
        except Exception as e:
            return {
                "answer": f"Error processing query: {str(e)}",
                "evidence": [],
                "timeline": [],
                "insights": []
            }