/* Tiny timestamped logger with color, no dependencies. */
const c = {
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

function stamp() {
  return c.gray(new Date().toISOString().replace('T', ' ').replace('Z', ''));
}

module.exports = {
  info: (m) => console.log(`${stamp()} ${c.cyan('INFO')}  ${m}`),
  warn: (m) => console.log(`${stamp()} ${c.yellow('WARN')}  ${m}`),
  error: (m) => console.log(`${stamp()} ${c.red('ERROR')} ${m}`),
  success: (m) => console.log(`${stamp()} ${c.green('OK')}    ${m}`),
};
