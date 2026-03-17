export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}

export interface BackupData {
  backupFile: string;
  hasZip: boolean;
  backupId: string;
}

export interface BackupResponse extends ApiResponse<BackupData> { }

export interface SpacesData {
  spaces: Array<{
    id: string;
    name: string;
  }>;
  debug?: {
    tokenSource: string;
    tokenLength: number;
    tokenPrefix: string;
    tokenLast4: string;
    isCfpat: boolean;
    currentHost: string;
    rawSpaceCount?: number;
    cfUser?: {
      email: string;
      name: string;
    };
  };
}

export interface SpacesResponse extends ApiResponse<SpacesData> { }

export interface EnvironmentsData {
  environments: Array<{
    id: string;
    name: string;
    createdAt?: string;
  }>;
}

export interface EnvironmentsResponse extends ApiResponse<EnvironmentsData> { }

export interface MigrationData {
  sourceBackupFile?: string;
  targetBackupFile?: string;
}

export interface MigrationResponse extends ApiResponse<MigrationData> { }

export interface RestoreData {
  restoredEnvironment?: string;
  timestamp?: string;
}

export interface RestoreResponse extends ApiResponse<RestoreData> { }

export interface CustomRestoreData {
  backupFile: string;
}

export interface CustomRestoreResponse extends ApiResponse<CustomRestoreData> { }

export interface AnalyzeContentTypesData {
  contentTypes: Array<{
    id: string;
    name: string;
    isNew: boolean;
    isModified: boolean;
    hasNewContent?: boolean;
    newContentCount?: number;
    modifiedContentCount?: number;
    newEntries?: Array<{
      id: string;
      title?: string;
    }>;
    modifiedEntries?: Array<{
      id: string;
      title?: string;
    }>;
  }>;
  sourceBackupFile?: string;
  targetBackupFile?: string;
}

export interface AnalyzeContentTypesResponse extends ApiResponse<AnalyzeContentTypesData> { }

export interface CustomMigrateData {
  sourceBackupFile?: string;
  targetBackupFile?: string;
  previewData?: {
    entriesCount: number;
    assetsCount: number;
    contentTypesCount: number;
    localesCount: number;
    selectiveBackupFile: string;
  };
}

export interface CustomMigrateResponse extends ApiResponse<CustomMigrateData> { }