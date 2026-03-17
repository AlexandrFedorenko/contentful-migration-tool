export interface Backup {
  name: string;
  path: string;
  time: number;
  id?: string;
  hasZip?: boolean;
}

export interface BackupContentType {
  sys: { id: string };
  name: string;
  description?: string;
  displayField?: string;
  fields: { id: string }[];
  [key: string]: unknown;
}

export interface BackupEntry {
  sys: {
    type?: string;
    id: string;
    contentType: { sys: { type?: string; linkType?: string; id: string } };
    version?: number;
    publishedVersion?: number;
    archivedVersion?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  fields?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BackupAsset {
  sys: {
    type?: string;
    id: string;
    version?: number;
    publishedVersion?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  fields?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BackupLocale {
  sys?: {
    type?: string;
    id: string;
    version?: number;
  };
  code: string;
  name: string;
  default?: boolean;
  fallbackCode?: string | null;
}

export interface BackupData {
  sys?: {
    type: string;
    id: string;
    [key: string]: unknown;
  };
  contentTypes?: BackupContentType[];
  entries?: BackupEntry[];
  assets?: BackupAsset[];
  locales?: BackupLocale[];
  editorInterfaces?: unknown[];
}