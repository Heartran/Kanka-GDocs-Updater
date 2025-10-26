#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'logs',
  'node_modules',
  '.clasp',
  '.github',
  'scripts'
]);

function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      files.push(...listFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

function collectLoggerStatements(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  const statements = [];
  lines.forEach((line, index) => {
    if (line.includes('Logger.log')) {
      const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
      statements.push(`${relativePath}:${index + 1}: ${line.trim()}`);
    }
  });

  return statements;
}

function formatLogFile(filePath, statements) {
  if (!statements.length) {
    return '';
  }

  const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
  const header = `# Logger.log statements extracted from ${relativePath}`;
  return `${header}\n${statements.join('\n')}\n`;
}

function main() {
  ensureLogsDir();

  const jsFiles = listFiles(PROJECT_ROOT);
  const createdLogFiles = new Set();

  jsFiles.forEach(filePath => {
    const statements = collectLoggerStatements(filePath);
    const logFileName = `${path.basename(filePath, path.extname(filePath))}.log`;
    const logFilePath = path.join(LOGS_DIR, logFileName);

    if (!statements.length) {
      if (fs.existsSync(logFilePath)) {
        fs.unlinkSync(logFilePath);
      }
      return;
    }

    const content = formatLogFile(filePath, statements);
    fs.writeFileSync(logFilePath, content, 'utf8');
    createdLogFiles.add(logFilePath);
  });

  // Remove stale .log files that no longer map to any source file
  const existingLogFiles = fs.readdirSync(LOGS_DIR)
    .filter(file => file.endsWith('.log'))
    .map(file => path.join(LOGS_DIR, file));

  existingLogFiles.forEach(logFilePath => {
    if (!createdLogFiles.has(logFilePath)) {
      fs.unlinkSync(logFilePath);
    }
  });
}

if (require.main === module) {
  try {
    main();
    console.log('Logger log files updated successfully.');
  } catch (error) {
    console.error('Unable to update logger log files:', error);
    process.exit(1);
  }
}
