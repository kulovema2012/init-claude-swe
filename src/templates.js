'use strict';

const BASE =
  'https://raw.githubusercontent.com/kulovema2012/init-claude-swe/main/templates';

const TEMPLATES = {
  default:   `${BASE}/default/CLAUDE.md`,
  ml:        `${BASE}/ml/CLAUDE.md`,
  ai:        `${BASE}/ai/CLAUDE.md`,
  backend:   `${BASE}/backend/CLAUDE.md`,
  devsecops: `${BASE}/devsecops/CLAUDE.md`,
  mlsecops:  `${BASE}/mlsecops/CLAUDE.md`,
  fullstack:  `${BASE}/fullstack/CLAUDE.md`,
};

module.exports = { TEMPLATES };
