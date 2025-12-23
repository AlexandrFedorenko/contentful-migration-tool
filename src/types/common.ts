export interface Environment {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Space {
  id: string;
  name: string;
}

export interface LoadingState {
  loadingSpaces: boolean;
  loadingEnvironments: boolean;
  loadingBackups: boolean;
  loadingBackup: boolean;
  loadingRestore: boolean;
  loadingMigration: boolean;
  loadingDelete: boolean;
  loadingAuth: boolean;
  loadingAnalyze: boolean;
  loadingCustomMigrate: boolean;
  loadingCustomRestore: boolean;
}

export interface ContentType {
  id: string;
  name: string;
  isNew: boolean;
  isModified: boolean;
  hasNewContent?: boolean;
  newContentCount?: number;
}

export type LoadingKeys = keyof LoadingState; 