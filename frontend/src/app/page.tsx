'use client';

import { useState } from 'react';
import { RepositoryInput } from '@/components/RepositoryInput';
import { AnalysisResults } from '@/components/AnalysisResults';
import { QueryInterface } from '@/components/QueryInterface';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AnalysisState {
  repoId: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  data?: any;
  error?: string;
}

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisState>({
    repoId: '',
    status: 'idle'
  });

  const handleAnalysisStart = (repoId: string) => {
    setAnalysis({
      repoId,
      status: 'processing'
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
            <RepositoryInput 
              onAnalysisStart={handleAnalysisStart}
              onAnalysisComplete={handleAnalysisComplete}
              onAnalysisError={handleAnalysisError}
            />
          )}

          {analysis.status === 'processing' && (
            <div className="text-center py-12">
              <LoadingSpinner />
              <h3 className="text-xl font-semibold text-gray-700 mt-4">
                Analyzing Repository...
              </h3>
              <p className="text-gray-500 mt-2">
                This may take a few minutes for larger repositories
              </p>
            </div>
          )}

          {analysis.status === 'completed' && analysis.data && (
            <div className="space-y-8">
              <AnalysisResults data={analysis.data} />
              <QueryInterface repoId={analysis.repoId} />
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
