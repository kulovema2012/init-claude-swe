#!/usr/bin/env node
'use strict';

const { run } = require('../src/cli');
run().catch((err) => {
  process.stderr.write((err && err.message ? err.message : String(err)) + '\n');
  process.exit(1);
});
