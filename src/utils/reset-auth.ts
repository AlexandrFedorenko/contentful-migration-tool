import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { authCache } from './auth-cache';

export const resetContentfulAuth = async (): Promise<boolean> => {
  try {
    // Clear global Contentful CLI config
    const configPath = path.join(os.homedir(), '.contentfulrc.json');
    fs.rmSync(configPath, { force: true });

    // Clear local auth cache
    authCache.reset();

    return true;
  } catch {
    return false;
  }
};