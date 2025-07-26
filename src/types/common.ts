export interface Environment {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Space {
  id: string;
  name: string;
}

export interface Backup {
  name: string;
  time: number;
}

export interface LoadingState {
  loadingSpaces: boolean;
  loadingBackups: boolean;
  loadingBackup: boolean;
  loadingRestore: boolean;
  loadingDelete: boolean;
  loadingMigrate: boolean;
  loadingMigration: boolean;
  loadingAuth: boolean;
  loadingAnalyze: boolean;
  loadingCustomMigrate: boolean;
  loadingCustomRestore: boolean;
}

export type LoadingKeys = keyof LoadingState; 