'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Users, FileText, TrendingUp } from 'lucide-react';

interface AnalysisResultsProps {
  data: any;
}

export function AnalysisResults({ data }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = data.stats || {};
  const commits = data.commits || [];
  const patterns = data.patterns || {};

  const prepareFileTypeData = () => {
    const fileTypes = stats.file_types || {};
    return Object.entries(fileTypes).map(([type, count]) => ({
      name: type,
      value: count as number
    }));
  };

  const prepareCommitTimelineData = () => {
    const monthlyCommits: { [key: string]: number } = {};
    
    commits.forEach((commit: any) => {
      const date = new Date(commit.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyCommits[monthKey] = (monthlyCommits[monthKey] || 0) + 1;
    });

    return Object.entries(monthlyCommits)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, commits: count }));
  };

  const prepareAuthorData = () => {
    const authors = stats.authors || {};
    return Object.entries(authors)
      .map(([name, data]: [string, any]) => ({
        name,
        commits: data.commits,
        insertions: data.insertions,
        deletions: data.deletions
      }))
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 10);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'contributors', label: 'Contributors', icon: Users },
    { id: 'patterns', label: 'Patterns', icon: FileText }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total_commits}</div>
                <div className="text-sm text-gray-600">Total Commits</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.total_files}</div>
                <div className="text-sm text-gray-600">Total Files</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.authors || {}).length}</div>
                <div className="text-sm text-gray-600">Contributors</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.total_insertions}</div>
                <div className="text-sm text-gray-600">Lines Added</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">File Types Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareFileTypeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareFileTypeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Milestones</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(patterns.milestones || []).slice(0, 5).map((milestone: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="font-medium text-gray-900">{milestone.title}</div>
                      <div className="text-sm text-gray-600">{milestone.author} • {new Date(milestone.date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500 mt-1">{milestone.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Commit Activity Timeline</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={prepareCommitTimelineData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="commits" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'contributors' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Top Contributors</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={prepareAuthorData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="commits" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Architectural Patterns</h3>
            <div className="space-y-4">
              {(patterns.architectural_patterns || []).map((pattern: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{pattern.type}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pattern.impact === 'high' ? 'bg-red-100 text-red-800' :
                      pattern.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {pattern.impact} impact
                    </span>
                  </div>
                  <p className="text-gray-600">{pattern.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}