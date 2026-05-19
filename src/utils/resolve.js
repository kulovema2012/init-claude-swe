'use strict';

const { BASE_URL } = require('../navigation');

/**
 * Build GitHub raw URLs for base and leaf template directories.
 * @param {string[]} slugs - ordered slug path, e.g. ['web','fullstack','nextjs-app-router']
 * @returns {{ baseUrl: string, leafUrl: string }}
 */
function buildPaths(slugs) {
  const baseUrl = `${BASE_URL}/_base`;
  const leafUrl = `${BASE_URL}/${slugs.join('/')}`;
  return { baseUrl, leafUrl };
}

module.exports = { buildPaths };
