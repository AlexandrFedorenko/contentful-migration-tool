export interface ContentType {
  id: string;
  name: string;
  isNew: boolean;
  isModified: boolean;
  hasNewContent?: boolean;
  newContentCount?: number;
  modifiedContentCount?: number;
  newEntries?: Array<{ id: string; title?: string }>;
  modifiedEntries?: Array<{ id: string; title?: string }>;
}

