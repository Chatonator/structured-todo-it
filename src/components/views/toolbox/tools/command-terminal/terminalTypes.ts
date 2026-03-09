export type LogLevel = 'info' | 'success' | 'error';

export interface ExecutionLog {
  lineNumber: number;
  level: LogLevel;
  message: string;
}

export interface StoredScript {
  name: string;
  script: string;
  updatedAt: string;
}
