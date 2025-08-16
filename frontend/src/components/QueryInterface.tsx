'use client';

import { useState } from 'react';
import { MessageCircle, Send, Lightbulb } from 'lucide-react';
import axios from 'axios';

interface QueryInterfaceProps {
  repoId: string;
  repoTitle?: string;
}

interface QueryResult {
  query: string;
  result: {
    answer: string;
    evidence: any[];
    timeline: any[];
    insights: string[];
  };
}

export function QueryInterface({ repoId, repoTitle }: QueryInterfaceProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    setIsLoading(true);
    const currentQuery = query;
    setQuery('');

    try {
      const response = await axios.post('/api/query', {
        repo_id: repoId,
        query: currentQuery
      });

      // Debug log to see the structure
      console.log('Query response:', response.data);
      setResults(prev => [response.data, ...prev]);
    } catch (error: any) {
      console.error('Query failed:', error);
      setResults(prev => [{
        query: currentQuery,
        result: {
          answer: 'Sorry, I encountered an error processing your question. Please try again.',
          evidence: [],
          timeline: [],
          insights: []
        }
      }, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get repo-specific queries or fallback to generic ones
  const getRepoSpecificQueries = () => {
    if (!repoTitle) return null;
    
    // Import at runtime to avoid build issues
    const { repositoryExamples } = require('@/data/repositoryExamples');
    const repo = repositoryExamples.find((r: any) => 
      repoTitle.toLowerCase().includes(r.title.toLowerCase()) ||
      r.title.toLowerCase().includes(repoTitle.toLowerCase())
    );
    
    return repo?.sampleQueries || null;
  };

  const suggestionQueries = getRepoSpecificQueries() || [
    "How did the authentication system evolve?",
    "What major architectural changes happened?",
    "Why was this framework chosen?",
    "How did the testing strategy develop?",
    "What performance optimizations were made?",
    "How did the API design change over time?"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Ask Questions</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Ask natural language questions about the repository's evolution
        </p>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., How did authentication evolve in this project?"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="h-5 w-5" />
              )}
              Ask
            </button>
          </div>
        </form>

        {results.length === 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Try these questions:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestionQueries.map((suggestion: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left text-sm text-blue-600 hover:text-blue-800 p-3 rounded border border-gray-200 hover:border-blue-300 transition-colors"
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-3">
                  <div className="font-medium text-gray-900 mb-2">
                    Q: {typeof result.query === 'object' ? JSON.stringify(result.query) : result.query}
                  </div>
                  <div className="text-gray-700">
                    {typeof result.result.answer === 'object' ? 
                      JSON.stringify(result.result.answer, null, 2) : 
                      String(result.result.answer)}
                  </div>
                </div>

                {result.result.evidence && result.result.evidence.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-medium text-gray-900 mb-2">Evidence:</h5>
                    <div className="space-y-2">
                      {result.result.evidence.slice(0, 3).map((evidence: any, i: number) => (
                        <div key={i} className="bg-gray-50 p-3 rounded text-sm">
                          {typeof evidence === 'object' && evidence !== null ? (
                            <>
                              <div className="font-medium">
                                {/* Handle nested commit object */}
                                {evidence.commit && typeof evidence.commit === 'object' ? 
                                  (evidence.commit.hash ? 
                                    `Commit: ${evidence.commit.hash.substring(0, 8)}` : 
                                    evidence.commit.message || 'Commit') :
                                  (evidence.commit_hash ? 
                                    `Commit: ${evidence.commit_hash.substring(0, 8)}` : 
                                    evidence.hash ? 
                                      `Commit: ${evidence.hash.substring(0, 8)}` :
                                      evidence.message || 'Commit')}
                              </div>
                              <div className="text-gray-600">
                                {evidence.description || 
                                 (evidence.commit && typeof evidence.commit === 'object' ? 
                                   evidence.commit.message : 
                                   evidence.message) || 
                                 (evidence.files_changed ? 
                                   `${evidence.files_changed} ${typeof evidence.files_changed === 'number' ? 'files' : ''} changed` : 
                                   '')}
                                {/* Show author if available */}
                                {(evidence.author || (evidence.commit && evidence.commit.author)) && (
                                  <div className="text-xs text-gray-500">
                                    by {typeof (evidence.author || evidence.commit.author) === 'object' ? 
                                      JSON.stringify(evidence.author || evidence.commit.author) : 
                                      String(evidence.author || evidence.commit.author)}
                                  </div>
                                )}
                              </div>
                              {(evidence.date || (evidence.commit && evidence.commit.date)) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(evidence.date || evidence.commit.date).toLocaleDateString()}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-gray-600">{String(evidence)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.result.timeline && result.result.timeline.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-medium text-gray-900 mb-2">Timeline:</h5>
                    <div className="space-y-2">
                      {result.result.timeline.slice(0, 5).map((event: any, i: number) => (
                        <div key={i} className="flex items-start space-x-3 text-sm">
                          <div className="text-blue-500 mt-1">•</div>
                          <div>
                            <div className="text-gray-700">
                              {typeof event === 'object' && event !== null ? 
                                (event.event || event.description || event.message || 'Event') :
                                String(event)}
                            </div>
                            {event.date && (
                              <div className="text-xs text-gray-500">
                                {new Date(event.date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.result.insights && result.result.insights.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Key Insights:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {result.result.insights.map((insight: string, i: number) => (
                        <li key={i}>{String(insight)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}