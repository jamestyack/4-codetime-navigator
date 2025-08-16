'use client';

import { useState } from 'react';
import { GitBranch, Search } from 'lucide-react';
import axios from 'axios';

interface RepositoryInputProps {
  onAnalysisStart: (repoId: string) => void;
  onAnalysisComplete: (data: any) => void;
  onAnalysisError: (error: string) => void;
}

export function RepositoryInput({ 
  onAnalysisStart, 
  onAnalysisComplete, 
  onAnalysisError 
}: RepositoryInputProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      onAnalysisError('Please enter a repository URL');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/api/analyze', {
        repo_url: repoUrl,
        max_commits: 1000
      });

      const { repo_id, status } = response.data;
      onAnalysisStart(repo_id);

      if (status === 'completed') {
        const analysisResponse = await axios.get(`/api/analysis/${repo_id}`);
        onAnalysisComplete(analysisResponse.data);
      } else {
        pollForCompletion(repo_id);
      }
    } catch (error: any) {
      onAnalysisError(error.response?.data?.detail || 'Failed to analyze repository');
    } finally {
      setIsLoading(false);
    }
  };

  const pollForCompletion = async (repoId: string) => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`/api/analysis/${repoId}`);
        const { status } = response.data;

        if (status === 'completed') {
          onAnalysisComplete(response.data);
        } else if (status === 'failed') {
          onAnalysisError(response.data.error_message || 'Analysis failed');
        } else {
          setTimeout(checkStatus, 3000);
        }
      } catch (error: any) {
        onAnalysisError('Failed to check analysis status');
      }
    };

    setTimeout(checkStatus, 3000);
  };

  const exampleRepos = [
    'https://github.com/facebook/react',
    'https://github.com/vercel/next.js',
    'https://github.com/microsoft/vscode',
    'https://github.com/nodejs/node'
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <GitBranch className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analyze Repository
          </h2>
          <p className="text-gray-600">
            Enter a GitHub repository URL to begin semantic analysis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="repo-url" className="block text-sm font-medium text-gray-700 mb-2">
              Repository URL
            </label>
            <div className="relative">
              <input
                id="repo-url"
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <GitBranch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !repoUrl.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Starting Analysis...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Analyze Repository
              </>
            )}
          </button>
        </form>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Try these examples:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {exampleRepos.map((url) => (
              <button
                key={url}
                onClick={() => setRepoUrl(url)}
                className="text-left text-sm text-blue-600 hover:text-blue-800 p-2 rounded border border-gray-200 hover:border-blue-300 transition-colors"
                disabled={isLoading}
              >
                {url.replace('https://github.com/', '')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}