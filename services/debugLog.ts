/**
 * Debug log for tracing card add/save/load flow.
 * Logs are kept in memory, sent to Sentry as breadcrumbs, and can be copied from Settings.
 */
import * as Sentry from '@sentry/react-native';

const MAX_LOG_LINES = 200;

let logLines: string[] = [];

function timestamp(): string {
  return new Date().toISOString();
}

function append(line: string) {
  const entry = `[${timestamp()}] ${line}`;
  logLines.push(entry);
  if (logLines.length > MAX_LOG_LINES) {
    logLines = logLines.slice(-MAX_LOG_LINES);
  }
  // Console for Metro
  console.log(`[CardVault] ${line}`);
  // Sentry breadcrumb for remote tracing
  Sentry.addBreadcrumb({ category: 'card-vault', message: line, level: 'info' });
}

export function debugLog(...args: unknown[]) {
  const line = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  append(line);
}

export function debugLogError(label: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  append(`ERROR ${label}: ${msg}`);
  if (err instanceof Error && err.stack) {
    append(`  stack: ${err.stack.slice(0, 200)}`);
  }
  // Send to Sentry for remote debugging
  Sentry.captureException(err, { tags: { context: label } });
}

export function getDebugLogContent(): string {
  return logLines.join('\n');
}

export function clearDebugLog() {
  logLines = [];
}
