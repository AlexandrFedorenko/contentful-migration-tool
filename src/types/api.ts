export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BackupResponse extends ApiResponse {
  backupFile?: string;
}

export interface SpacesResponse extends ApiResponse {
  spaces?: Array<{
    id: string;
    name: string;
  }>;
}

export interface EnvironmentsResponse extends ApiResponse {
  environments?: Array<{
    id: string;
    name: string;
    createdAt: string;
  }>;
}

export interface MigrationResponse {
  success: boolean;
  error?: string;
  sourceBackupFile?: string;
  targetBackupFile?: string;
}

export interface RestoreResponse extends ApiResponse {
  restoredEnvironment?: string;
  timestamp?: string;
}

export interface CustomRestoreResponse {
  success: boolean;
  error?: string;
  backupFile?: string;
}

export interface AnalyzeContentTypesResponse {
  success: boolean;
  error?: string;
  contentTypes?: Array<{
    id: string;
    name: string;
    isNew: boolean;
    isModified: boolean;
  }>;
  sourceBackupFile?: string;
  targetBackupFile?: string;
}

export interface CustomMigrateResponse {
  success: boolean;
  error?: string;
  sourceBackupFile?: string;
  targetBackupFile?: string;
} 