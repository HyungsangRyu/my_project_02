/**
 * Simple logger utility
 */
export class Logger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.prefix = options.prefix || '';
  }

  info(message, ...args) {
    console.log(`${this.prefix}${message}`, ...args);
  }

  success(message, ...args) {
    console.log(`✓ ${this.prefix}${message}`, ...args);
  }

  error(message, ...args) {
    console.error(`✗ ${this.prefix}${message}`, ...args);
  }

  warn(message, ...args) {
    console.warn(`⚠ ${this.prefix}${message}`, ...args);
  }

  debug(message, ...args) {
    if (this.verbose) {
      console.log(`[DEBUG] ${this.prefix}${message}`, ...args);
    }
  }

  group(title) {
    console.group(title);
  }

  groupEnd() {
    console.groupEnd();
  }
}

export default Logger;
