'use client';

import { useState } from 'react';
import { repositoryExamples, getDifficultyColor, type RepositoryExample } from '@/data/repositoryExamples';

interface RepositoryExamplesProps {
  onAnalyzeRepo: (url: string, title: string) => void;
  isAnalyzing: boolean;
}

export function RepositoryExamples({ onAnalyzeRepo, isAnalyzing }: RepositoryExamplesProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          📚 Curated Repository Examples
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Explore these hand-picked repositories that showcase different architectural patterns, 
          design decisions, and evolution stories. Perfect for learning how great software evolves.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {repositoryExamples.map((repo) => (
          <RepositoryCard
            key={repo.id}
            repo={repo}
            isExpanded={expandedCard === repo.id}
            onToggleExpanded={() => toggleExpanded(repo.id)}
            onAnalyze={() => onAnalyzeRepo(repo.url, repo.title)}
            isAnalyzing={isAnalyzing}
          />
        ))}
      </div>

      <div className="text-center mt-8">
        <div className="inline-flex items-center space-x-4 text-sm text-gray-500 bg-white px-6 py-3 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Beginner</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Intermediate</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Advanced</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RepositoryCardProps {
  repo: RepositoryExample;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

function RepositoryCard({ repo, isExpanded, onToggleExpanded, onAnalyze, isAnalyzing }: RepositoryCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {repo.title}
            </h3>
            <a 
              href={repo.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              {repo.url.split('/').slice(-2).join('/')}
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(repo.difficulty)}`}>
            {repo.difficulty}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {repo.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {repo.tags.slice(0, 3).map((tag) => (
            <span 
              key={tag}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
            >
              {tag}
            </span>
          ))}
          {repo.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
              +{repo.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : (
              'Analyze Now'
            )}
          </button>
          
          <button
            onClick={onToggleExpanded}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center"
          >
            Why This Repo?
            <svg 
              className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="space-y-4">
              {/* Interesting Points */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🔍 What Makes It Interesting</h4>
                <ul className="space-y-1">
                  {repo.interestingPoints.map((point, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sample Queries */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">💭 Try These Questions</h4>
                <div className="space-y-1">
                  {repo.sampleQueries.slice(0, 2).map((query, index) => (
                    <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded italic">
                      &quot;{query}&quot;
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimated Time */}
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Analysis time: {repo.estimatedTime}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}