export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  data?: any;
}

export interface Logger {
  debug(message: string, context?: LogContext, data?: any): void;
  info(message: string, context?: LogContext, data?: any): void;
  warn(message: string, context?: LogContext, data?: any): void;
  error(message: string, error?: Error, context?: LogContext, data?: any): void;
  fatal(message: string, error?: Error, context?: LogContext, data?: any): void;
}

export class AppLogger implements Logger {
  private static instance: AppLogger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logEntries: LogEntry[] = [];
  private maxEntries: number = 1000;

  private constructor() {
    // Set log level based on environment
    if (typeof window !== 'undefined') {
      // Browser environment
      this.logLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN;
    } else {
      // Server environment
      this.logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, error?: Error, context?: LogContext, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  fatal(message: string, error?: Error, context?: LogContext, data?: any): void {
    this.log(LogLevel.FATAL, message, context, data, error);
  }

  private log(level: LogLevel, message: string, context?: LogContext, data?: any, error?: Error): void {
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data,
      error
    };

    // Store log entry
    this.logEntries.push(logEntry);
    if (this.logEntries.length > this.maxEntries) {
      this.logEntries.shift(); // Remove oldest entry
    }

    // Output to console
    this.outputToConsole(logEntry);

    // Send to monitoring service in production
    if (level >= LogLevel.ERROR && typeof window !== 'undefined') {
      this.sendToMonitoring(logEntry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    
    let logMessage = `[${timestamp}] ${levelName}: ${entry.message}`;
    
    if (entry.context) {
      logMessage += ` | Context: ${JSON.stringify(entry.context)}`;
    }

    const logMethod = this.getConsoleMethod(entry.level);
    
    if (entry.error) {
      logMethod(logMessage, entry.error);
    } else if (entry.data) {
      logMethod(logMessage, entry.data);
    } else {
      logMethod(logMessage);
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    try {
      // In a real application, send to monitoring service like Sentry, DataDog, etc.
      // For now, we'll just store in localStorage for debugging
      if (typeof window !== 'undefined' && window.localStorage) {
        const errorLogs = JSON.parse(localStorage.getItem('error-logs') || '[]');
        errorLogs.push({
          timestamp: entry.timestamp.toISOString(),
          level: LogLevel[entry.level],
          message: entry.message,
          context: entry.context,
          error: entry.error ? {
            name: entry.error.name,
            message: entry.error.message,
            stack: entry.error.stack
          } : undefined,
          data: entry.data
        });

        // Keep only last 50 error logs
        if (errorLogs.length > 50) {
          errorLogs.splice(0, errorLogs.length - 50);
        }

        localStorage.setItem('error-logs', JSON.stringify(errorLogs));
      }
    } catch (error) {
      console.error('Failed to send log to monitoring:', error);
    }
  }

  // Utility methods
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logEntries.filter(entry => entry.level >= level);
    }
    return [...this.logEntries];
  }

  clearLogs(): void {
    this.logEntries = [];
  }

  // Performance logging
  timeStart(label: string, context?: LogContext): void {
    if (typeof performance !== 'undefined') {
      const startTime = performance.now();
      this.debug(`Timer started: ${label}`, { ...context, startTime });
    }
  }

  timeEnd(label: string, context?: LogContext): void {
    if (typeof performance !== 'undefined') {
      const endTime = performance.now();
      this.debug(`Timer ended: ${label}`, { ...context, endTime });
    }
  }

  // Create child logger with context
  createChildLogger(defaultContext: LogContext): Logger {
    return {
      debug: (message: string, context?: LogContext, data?: any) => 
        this.debug(message, { ...defaultContext, ...context }, data),
      info: (message: string, context?: LogContext, data?: any) => 
        this.info(message, { ...defaultContext, ...context }, data),
      warn: (message: string, context?: LogContext, data?: any) => 
        this.warn(message, { ...defaultContext, ...context }, data),
      error: (message: string, error?: Error, context?: LogContext, data?: any) => 
        this.error(message, error, { ...defaultContext, ...context }, data),
      fatal: (message: string, error?: Error, context?: LogContext, data?: any) => 
        this.fatal(message, error, { ...defaultContext, ...context }, data)
    };
  }
}

// Global logger instance
export const logger = AppLogger.getInstance();