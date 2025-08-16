'use client';

import { useState } from 'react';
import { RepositoryInput } from '@/components/RepositoryInput';
import { RepositoryExamples } from '@/components/RepositoryExamples';
import { AnalysisResults } from '@/components/AnalysisResults';
import { QueryInterface } from '@/components/QueryInterface';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AnalysisState {
  repoId: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  data?: any;
  error?: string;
  repoTitle?: string;
}

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisState>({
    repoId: '',
    status: 'idle'
  });

  const handleAnalysisStart = (repoId: string, repoTitle?: string) => {
    setAnalysis({
      repoId,
      status: 'processing',
      repoTitle
    });
  };

  const handleAnalysisComplete = (data: any) => {
    setAnalysis(prev => ({
      ...prev,
      status: 'completed',
      data
    }));
  };

  const handleAnalysisError = (error: string) => {
    setAnalysis(prev => ({
      ...prev,
      status: 'error',
      error
    }));
  };

  const handleExampleAnalysis = async (url: string, title: string) => {
    try {
      handleAnalysisStart('', title);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: url,
          max_commits: 200
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }

      const result = await response.json();
      handleAnalysisStart(result.repo_id, title);

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/analysis/${result.repo_id}`);
          const statusData = await statusResponse.json();

          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            handleAnalysisComplete(statusData);
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            handleAnalysisError(statusData.error_message || 'Analysis failed');
          }
        } catch (error) {
          clearInterval(pollInterval);
          handleAnalysisError('Failed to check analysis status');
        }
      }, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (analysis.status === 'processing') {
          handleAnalysisError('Analysis timed out');
        }
      }, 300000);

    } catch (error) {
      handleAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CodeTime Navigator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Analyze git repositories to reveal code evolution patterns and architectural decisions 
            through semantic understanding of commit history.
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          {analysis.status === 'idle' && (
            <>
              <RepositoryExamples 
                onAnalyzeRepo={handleExampleAnalysis}
                isAnalyzing={false}
              />
              
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-500">
                    Or analyze your own repository
                  </span>
                </div>
              </div>

              <RepositoryInput 
                onAnalysisStart={handleAnalysisStart}
                onAnalysisComplete={handleAnalysisComplete}
                onAnalysisError={handleAnalysisError}
              />
            </>
          )}

          {analysis.status === 'processing' && (
            <div className="text-center py-12">
              <LoadingSpinner />
              <h3 className="text-xl font-semibold text-gray-700 mt-4">
                {analysis.repoTitle ? `Analyzing ${analysis.repoTitle}...` : 'Analyzing Repository...'}
              </h3>
              <p className="text-gray-500 mt-2">
                This may take a few minutes for larger repositories
              </p>
              <button 
                onClick={() => setAnalysis({ repoId: '', status: 'idle' })}
                className="mt-4 text-gray-500 hover:text-gray-700 text-sm underline"
              >
                Cancel Analysis
              </button>
            </div>
          )}

          {analysis.status === 'completed' && analysis.data && (
            <div className="space-y-8">
              <AnalysisResults data={analysis.data} />
              <QueryInterface 
                repoId={analysis.repoId} 
                repoTitle={analysis.repoTitle}
              />
            </div>
          )}

          {analysis.status === 'error' && (
            <div className="text-center py-12">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
                <h3 className="font-semibold">Analysis Failed</h3>
                <p className="mt-2">{analysis.error}</p>
                <button 
                  onClick={() => setAnalysis({ repoId: '', status: 'idle' })}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="text-center mt-16 text-gray-500">
          <p>
            Built with Next.js, FastAPI, and AI-powered semantic analysis
          </p>
        </footer>
      </div>
    </div>
  );
}
