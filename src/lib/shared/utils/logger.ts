import { env } from '$env/dynamic/public';

export interface Logger {
  debug(message: string, data?: any, context?: string): void;
  info(message: string, data?: any, context?: string): void;
  warn(message: string, data?: any, context?: string): void;
  error(message: string, data?: any, context?: string): void;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

class ConsoleLogger implements Logger {
  private logLevel: LogLevel;
  
  constructor() {
    // Set log level based on environment
    const level = env.LOG_LEVEL || 'info';
    
    switch (level.toLowerCase()) {
      case 'debug':
        this.logLevel = LogLevel.DEBUG;
        break;
      case 'warn':
        this.logLevel = LogLevel.WARN;
        break;
      case 'error':
        this.logLevel = LogLevel.ERROR;
        break;
      case 'silent':
        this.logLevel = LogLevel.SILENT;
        break;
      default:
        this.logLevel = LogLevel.INFO;
    }
  }

  private formatMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}]` : '';
    return `${timestamp} ${level} ${ctx} ${message}`;
  }

  private log(level: LogLevel, levelName: string, message: string, data?: any, context?: string) {
    if (level < this.logLevel) {
      return;
    }

    const formattedMessage = this.formatMessage(levelName, message, context);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data || '');
        break;
    }
  }

  debug(message: string, data?: any, context?: string) {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data, context);
  }

  info(message: string, data?: any, context?: string) {
    this.log(LogLevel.INFO, 'INFO', message, data, context);
  }

  warn(message: string, data?: any, context?: string) {
    this.log(LogLevel.WARN, 'WARN', message, data, context);
  }

  error(message: string, data?: any, context?: string) {
    this.log(LogLevel.ERROR, 'ERROR', message, data, context);
  }

  // Domain-specific loggers
  api(message: string, data?: any) {
    this.log(LogLevel.INFO, 'API', message, data);
  }

  domain(message: string, data?: any) {
    this.log(LogLevel.DEBUG, 'DOMAIN', message, data);
  }

  infrastructure(message: string, data?: any) {
    this.log(LogLevel.DEBUG, 'INFRA', message, data);
  }
}

export const logger = new ConsoleLogger();
export { ConsoleLogger };