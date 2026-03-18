'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const RAW_URL =
  'https://raw.githubusercontent.com/kulovema2012/init-claude-swe/master/CLAUDE.md';
const TIMEOUT_MS = 10000;

/**
 * @param {string} destPath
 * @returns {{ exists: boolean, isDir: boolean }}
 */
function checkDestination(destPath) {
  if (!fs.existsSync(destPath)) return { exists: false, isDir: false };
  const stat = fs.statSync(destPath);
  return { exists: true, isDir: stat.isDirectory() };
}

/**
 * @param {string} destPath
 * @param {string} content
 */
function writeFile(destPath, content) {
  fs.writeFileSync(destPath, content, 'utf8');
}

module.exports = { checkDestination, writeFile };
