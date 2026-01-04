/**
 * Système de logging centralisé
 * Gestion uniforme des logs avec niveaux et contexte
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
}

class Logger {
  private config: LoggerConfig;
  private entries: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: false,
      maxStorageEntries: 1000,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const context = entry.context ? ` [${JSON.stringify(entry.context)}]` : '';
    return `[${timestamp}] ${levelName}: ${entry.message}${context}`;
  }

  private addEntry(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    // Ajouter à la liste des entrées
    if (this.config.enableStorage) {
      this.entries.push(entry);
      
      // Limiter le nombre d'entrées stockées
      if (this.entries.length > this.config.maxStorageEntries) {
        this.entries = this.entries.slice(-this.config.maxStorageEntries);
      }
    }

    // Log vers la console
    if (this.config.enableConsole) {
      const message = this.formatMessage(entry);
      
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(message, entry.context);
          break;
        case LogLevel.INFO:
          console.info(message, entry.context);
          break;
        case LogLevel.WARN:
          console.warn(message, entry.context, entry.error);
          break;
        case LogLevel.ERROR:
          console.error(message, entry.context, entry.error);
          break;
      }
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.addEntry({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date(),
      context,
    });
  }

  info(message: string, context?: Record<string, any>): void {
    this.addEntry({
      level: LogLevel.INFO,
      message,
      timestamp: new Date(),
      context,
    });
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    this.addEntry({
      level: LogLevel.WARN,
      message,
      timestamp: new Date(),
      context,
      error,
    });
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.addEntry({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      context,
      error,
    });
  }

  // Méthodes utilitaires
  getEntries(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.entries.filter(entry => entry.level === level);
    }
    return [...this.entries];
  }

  clearEntries(): void {
    this.entries = [];
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  exportLogs(): string {
    return this.entries
      .map(entry => this.formatMessage(entry))
      .join('\n');
  }
}

// Instance globale du logger
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
});
