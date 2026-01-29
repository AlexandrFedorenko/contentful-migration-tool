export interface Environment {
  id: string;
  name: string;
  createdAt?: string;
}
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
  loadingRename: boolean;
  isModified?: boolean;
  hasNewContent?: boolean;
  newContentCount?: number;
}

export type LoadingKeys = keyof LoadingState;