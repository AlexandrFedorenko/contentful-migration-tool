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

export interface MigrationResponse extends ApiResponse {
  diffSize?: number;
  statistics?: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
}

export interface RestoreResponse extends ApiResponse {
  restoredEnvironment?: string;
  timestamp?: string;
} 