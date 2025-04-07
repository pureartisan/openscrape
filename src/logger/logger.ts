export type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private logLevel: LogLevel = "debug";

  constructor() {
    this.init();
  }

  init() {
    this.logLevel = (process.env.LOG_LEVEL || "debug") as LogLevel;
  }

  setLevel(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  log(...args: any[]) {
    console.info(...args);
  }

  error(...args: any[]) {
    console.error(...args);
  }

  warn(...args: any[]) {
    if (
      this.logLevel === "warn" ||
      this.logLevel === "info" ||
      this.logLevel === "debug"
    ) {
      console.warn(...args);
    }
  }

  info(...args: any[]) {
    if (this.logLevel === "info" || this.logLevel === "debug") {
      console.info(...args);
    }
  }

  debug(...args: any[]) {
    if (this.logLevel === "debug") {
      console.debug(...args);
    }
  }
}

const singleton = new Logger();
export { singleton as Logger };
