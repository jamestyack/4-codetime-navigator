export interface RepositoryExample {
  id: string;
  title: string;
  url: string;
  description: string;
  interestingPoints: string[];
  sampleQueries: string[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export const repositoryExamples: RepositoryExample[] = [
  {
    id: 'express',
    title: 'Web Framework Evolution',
    url: 'https://github.com/expressjs/express',
    description: 'See how middleware patterns emerged and became the Node.js standard. Track security features, performance optimizations, and API design decisions that influenced countless other frameworks.',
    interestingPoints: [
      'Middleware architecture emergence',
      'Security feature additions over time',
      'Performance optimization commits',
      'Breaking change management'
    ],
    sampleQueries: [
      'How did middleware patterns emerge?',
      'When were security features added?',
      'Show me the evolution of routing',
      'What were the major breaking changes?'
    ],
    estimatedTime: '60-90 seconds',
    difficulty: 'intermediate',
    tags: ['web-framework', 'middleware', 'node.js', 'api-design']
  },
  {
    id: 'prettier',
    title: 'Opinionated Tool Design',
    url: 'https://github.com/prettier/prettier',
    description: 'Explore how an opinionated code formatter made controversial design decisions and stuck to them. Watch the evolution from simple formatter to ecosystem standard.',
    interestingPoints: [
      'Philosophy vs. flexibility debates in commits',
      'Language support expansion',
      'Performance optimization patterns',
      'Community feedback integration'
    ],
    sampleQueries: [
      'Show me debates about formatting decisions',
      'How did language support expand?',
      'What were the most controversial changes?',
      'How did performance improve over time?'
    ],
    estimatedTime: '45-75 seconds',
    difficulty: 'beginner',
    tags: ['code-formatting', 'tooling', 'philosophy', 'community']
  },
  {
    id: 'lodash',
    title: 'Utility Library Optimization',
    url: 'https://github.com/lodash/lodash',
    description: 'Track how a utility library evolved for performance and bundle size. See tree-shaking support, modularization decisions, and the shift toward functional programming patterns.',
    interestingPoints: [
      'Performance micro-optimizations',
      'Bundle size reduction efforts',
      'Modularization architecture changes',
      'Functional programming adoption'
    ],
    sampleQueries: [
      'Track performance optimization commits',
      'When did tree-shaking support appear?',
      'How did modularization evolve?',
      'Show bundle size reduction efforts'
    ],
    estimatedTime: '75-120 seconds',
    difficulty: 'advanced',
    tags: ['utilities', 'performance', 'modularization', 'functional-programming']
  },
  {
    id: 'passport',
    title: 'Authentication Strategy Pattern',
    url: 'https://github.com/jaredhanson/passport',
    description: 'Watch the strategy pattern evolve for authentication. See how a simple idea became the foundation for hundreds of authentication methods across the Node.js ecosystem.',
    interestingPoints: [
      'Strategy pattern implementation',
      'OAuth evolution support',
      'Security vulnerability fixes',
      'Community strategy contributions'
    ],
    sampleQueries: [
      'How did the strategy pattern evolve?',
      'Show OAuth implementation timeline',
      'What security vulnerabilities were fixed?',
      'How do community strategies work?'
    ],
    estimatedTime: '30-60 seconds',
    difficulty: 'intermediate',
    tags: ['authentication', 'strategy-pattern', 'oauth', 'security']
  },
  {
    id: 'joi',
    title: 'Schema Validation API Design',
    url: 'https://github.com/sideway/joi',
    description: 'Explore how a validation library balanced developer experience with powerful features. Track API design decisions, TypeScript adoption, and performance improvements.',
    interestingPoints: [
      'Fluent API design evolution',
      'TypeScript integration',
      'Performance vs. features trade-offs',
      'Breaking change migration strategies'
    ],
    sampleQueries: [
      'How did the fluent API develop?',
      'When was TypeScript support added?',
      'Show performance vs features decisions',
      'What were the breaking change strategies?'
    ],
    estimatedTime: '45-75 seconds',
    difficulty: 'intermediate',
    tags: ['validation', 'api-design', 'typescript', 'developer-experience']
  },
  {
    id: 'moment',
    title: 'Design Decisions & Regrets',
    url: 'https://github.com/moment/moment',
    description: 'A masterclass in software evolution and technical debt. See how early design decisions created long-term challenges, leading to the creation of immutable alternatives like Day.js.',
    interestingPoints: [
      'Mutability vs. immutability decisions',
      'Bundle size concerns emergence',
      'Internationalization complexity',
      'Deprecation and migration planning'
    ],
    sampleQueries: [
      'What were the early design decisions?',
      'How did bundle size become a problem?',
      'Show internationalization evolution',
      'Why was the library deprecated?'
    ],
    estimatedTime: '90-150 seconds',
    difficulty: 'advanced',
    tags: ['date-time', 'technical-debt', 'immutability', 'deprecation']
  }
];

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'advanced':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};