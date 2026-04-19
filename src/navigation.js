'use strict';

const BASE_URL =
  'https://raw.githubusercontent.com/kulovema2012/init-claude-swe/main/templates';

/**
 * Navigation tree. Each node: { label, slug, children? }
 * children: undefined = leaf node (goes straight to scope selection)
 */
const TREE = [
  {
    label: 'Web Development', slug: 'web',
    children: [
      {
        label: 'Frontend Only', slug: 'frontend',
        children: [
          { label: 'React / Next.js', slug: 'react-nextjs' },
          { label: 'Vue / Nuxt', slug: 'vue-nuxt' },
          { label: 'Svelte / SvelteKit', slug: 'svelte-sveltekit' },
        ],
      },
      {
        label: 'Full-Stack', slug: 'fullstack',
        children: [
          { label: 'Next.js (App Router)', slug: 'nextjs-app-router' },
          { label: 'Remix', slug: 'remix' },
          { label: 'T3 Stack', slug: 't3-stack' },
        ],
      },
      { label: 'Static / Jamstack', slug: 'static-jamstack' },
    ],
  },
  {
    label: 'Mobile Development', slug: 'mobile',
    children: [
      { label: 'React Native', slug: 'react-native' },
      { label: 'Flutter', slug: 'flutter' },
      { label: 'Native (iOS / Android)', slug: 'native' },
    ],
  },
  {
    label: 'Backend / API', slug: 'backend',
    children: [
      { label: 'Node.js / Bun', slug: 'nodejs-bun' },
      {
        label: 'Python', slug: 'python',
        children: [
          { label: 'FastAPI', slug: 'fastapi' },
          { label: 'Django', slug: 'django' },
        ],
      },
      { label: 'Go', slug: 'go' },
      { label: 'GraphQL', slug: 'graphql' },
    ],
  },
  {
    label: 'Data Science', slug: 'data-science',
    children: [
      { label: 'Python (Notebooks / EDA)', slug: 'python-notebooks' },
      { label: 'SQL / Analytics', slug: 'sql-analytics' },
      { label: 'Data Engineering (Pipelines)', slug: 'data-engineering' },
    ],
  },
  {
    label: 'AI / ML Engineering', slug: 'ai-ml',
    children: [
      { label: 'LLM / Agent Development', slug: 'llm-agents' },
      { label: 'Model Training / MLOps', slug: 'model-training' },
      { label: 'Computer Vision', slug: 'computer-vision' },
    ],
  },
  {
    label: 'DevSecOps / Infrastructure', slug: 'devsecops',
    children: [
      { label: 'CI/CD Pipelines', slug: 'cicd-pipelines' },
      { label: 'Kubernetes / Cloud', slug: 'kubernetes-cloud' },
      { label: 'Security Auditing', slug: 'security-auditing' },
    ],
  },
  { label: 'General Purpose', slug: 'general' },
];

module.exports = { TREE, BASE_URL };
