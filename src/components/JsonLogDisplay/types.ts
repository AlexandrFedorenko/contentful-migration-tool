export interface LogError {
  type: string;
  message: string;
  details?: unknown;
  timestamp?: string;
}

export interface FormattedError {
  title: string;
  description: string;
  steps: string[];
}

export interface LogData {
  errors?: LogError[];
  warnings?: LogError[];
  importedEntities?: {
    contentTypes?: number;
    entries?: number;
    assets?: number;
    locales?: number;
  };
}

