import openai
import anthropic
import os
import json
from typing import List, Dict, Any
import asyncio

class LLMAnalyzer:
    def __init__(self):
        openai_key = os.getenv("OPENAI_API_KEY")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        
        # Handle missing API keys gracefully for development
        if not openai_key or openai_key == "dummy_key_for_testing":
            self.openai_client = None
        else:
            try:
                openai.api_key = openai_key
                self.openai_client = openai
            except Exception as e:
                print(f"Error initializing OpenAI client: {e}")
                self.openai_client = None
            
        if not anthropic_key or anthropic_key == "dummy_key_for_testing":
            self.anthropic_client = None
        else:
            try:
                self.anthropic_client = anthropic.Anthropic(api_key=anthropic_key)
            except Exception as e:
                print(f"Error initializing Anthropic client: {e}")
                self.anthropic_client = None
    
    async def analyze_patterns(self, commits: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze commit patterns using LLM"""
        # Limit commits for faster processing
        limited_commits = commits[:200]  # Only analyze first 200 commits for speed
        
        # Skip LLM categorization for development speed, use simple heuristics
        categorized_commits = self._fast_categorize_commits(limited_commits)
        
        # Only analyze architectural patterns for most important commits
        arch_commits = [c for c in categorized_commits if c.get("category") in ["architecture", "refactor"]][:20]
        architectural_patterns = await self._detect_architectural_patterns(arch_commits) if arch_commits else []
        
        # Identify major milestones using fast heuristics
        milestones = self._identify_milestones(categorized_commits)
        
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
                if not self.openai_client:
                    # Fallback for development without API key
                    analysis = [{"category": "unknown", "scope": "unknown", "impact": "medium", "description": commit["message"][:100]} for commit in batch]
                else:
                    response = await openai.ChatCompletion.acreate(
                        model="gpt-3.5-turbo",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3
                    )
                    
                    content = response.choices[0].message.content
                    if not content or content.strip() == "":
                        raise ValueError("Empty response from OpenAI API")
                    
                    try:
                        analysis = json.loads(content)
                    except json.JSONDecodeError:
                        # Fallback if JSON parsing fails
                        analysis = [{"category": "unknown", "scope": "unknown", "impact": "medium", "description": commit["message"][:100]} for commit in batch]
                
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
    
    def _fast_categorize_commits(self, commits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Fast commit categorization using keyword heuristics"""
        categorized = []
        
        for commit in commits:
            message = commit["message"].lower()
            files = commit.get("files", [])
            
            # Simple keyword-based categorization
            category = "unknown"
            scope = "unknown"
            impact = "medium"
            
            # Categorization heuristics
            if any(word in message for word in ["fix", "bug", "error", "issue", "patch"]):
                category = "bugfix"
            elif any(word in message for word in ["feat", "add", "new", "implement", "create"]):
                category = "feature"
            elif any(word in message for word in ["refactor", "restructure", "reorganize", "cleanup"]):
                category = "refactor"
            elif any(word in message for word in ["doc", "readme", "comment", "documentation"]):
                category = "documentation"
            elif any(word in message for word in ["test", "spec", "coverage"]):
                category = "test"
            elif any(word in message for word in ["style", "format", "lint", "prettier"]):
                category = "style"
            elif any(word in message for word in ["perf", "optimize", "performance", "speed"]):
                category = "performance"
            elif any(word in message for word in ["security", "auth", "permission", "vulnerability"]):
                category = "security"
            elif any(word in message for word in ["architecture", "design", "pattern", "structure"]):
                category = "architecture"
            elif any(word in message for word in ["build", "config", "setup", "deploy", "ci", "cd"]):
                category = "build"
            
            # Scope detection
            if any(".js" in f or ".ts" in f or ".jsx" in f or ".tsx" in f for f in files):
                scope = "frontend"
            elif any(".py" in f or ".java" in f or ".go" in f or ".rb" in f for f in files):
                scope = "backend"
            elif any("test" in f.lower() or "spec" in f.lower() for f in files):
                scope = "test"
            elif any("doc" in f.lower() or "readme" in f.lower() for f in files):
                scope = "documentation"
            elif any("config" in f.lower() or "dockerfile" in f.lower() or ".yml" in f or ".yaml" in f for f in files):
                scope = "infrastructure"
            
            # Impact based on files changed and stats
            files_changed = commit["stats"].get("files_changed", 0)
            lines_changed = commit["stats"].get("insertions", 0) + commit["stats"].get("deletions", 0)
            
            if files_changed > 10 or lines_changed > 500:
                impact = "high"
            elif files_changed > 3 or lines_changed > 100:
                impact = "medium"
            else:
                impact = "low"
            
            enhanced_commit = commit.copy()
            enhanced_commit.update({
                "category": category,
                "scope": scope,
                "impact": impact,
                "description": commit["message"][:100]
            })
            categorized.append(enhanced_commit)
        
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
            if not self.anthropic_client:
                # Fallback for development without API key
                return []
            
            response = await self.anthropic_client.acompletion(
                model="claude-instant-1",
                max_tokens_to_sample=1000,
                prompt=f"\n\nHuman: {prompt}\n\nAssistant:"
            )
            
            content = response.completion
            if not content or content.strip() == "":
                return []
            
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # Return empty array if JSON parsing fails
                return []
        
        except Exception as e:
            print(f"Error detecting architectural patterns: {e}")
            return []
    
    def _identify_milestones(self, commits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
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
        # Use only the most relevant commits for faster processing
        relevant_commits = self._filter_relevant_commits(query, commits[:50])  # Limit to 50 most recent
        
        # Prepare context from analysis
        context = {
            "total_commits": len(commits),
            "categories": {},
            "recent_commits": relevant_commits[:5],  # Even fewer for context
            "patterns": patterns.get("architectural_patterns", [])[:3],  # Limit patterns
            "milestones": patterns.get("milestones", [])[:5]  # Limit milestones
        }
        
        # Count categories from limited set
        for commit in relevant_commits:
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
            if not self.openai_client:
                # Fallback for development without API key
                return {
                    "answer": f"Based on the repository analysis, there are {context['total_commits']} commits. This is a development environment response.",
                    "evidence": [{"commit": "demo", "description": "Demo evidence for development"}],
                    "timeline": [{"date": "2024", "event": "Demo timeline for development"}],
                    "insights": ["This is a demo response for development environment"]
                }
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            if not content or content.strip() == "":
                raise ValueError("Empty response from OpenAI API")
            
            try:
                return json.loads(content)
            except json.JSONDecodeError as e:
                # Try to extract JSON from markdown code blocks
                import re
                json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
                if json_match:
                    try:
                        return json.loads(json_match.group(1))
                    except json.JSONDecodeError:
                        pass
                
                # If JSON parsing fails, return the raw content in a structured format
                return {
                    "answer": content,
                    "evidence": [],
                    "timeline": [],
                    "insights": ["Raw response - JSON parsing failed"]
                }
        
        except Exception as e:
            return {
                "answer": f"Error processing query: {str(e)}",
                "evidence": [],
                "timeline": [],
                "insights": []
            }
    
    def _filter_relevant_commits(self, query: str, commits: List[Dict]) -> List[Dict]:
        """Filter commits that might be relevant to the query"""
        query_words = query.lower().split()
        relevant_commits = []
        
        for commit in commits:
            message = commit.get("message", "").lower()
            category = commit.get("category", "").lower()
            files = " ".join(commit.get("files", [])).lower()
            
            # Simple relevance scoring
            relevance_score = 0
            for word in query_words:
                if word in message:
                    relevance_score += 3
                if word in category:
                    relevance_score += 2
                if word in files:
                    relevance_score += 1
            
            if relevance_score > 0 or commit.get("impact") == "high":
                relevant_commits.append((commit, relevance_score))
        
        # Sort by relevance and return top commits
        relevant_commits.sort(key=lambda x: x[1], reverse=True)
        return [commit for commit, score in relevant_commits[:20]]