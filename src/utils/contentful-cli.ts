import { spawn } from 'cross-spawn';
import * as path from 'path';
import * as fs from 'fs';

export class ContentfulCLI {
  /**
   * Universal helper to execute Contentful CLI commands.
   * Note: Legacy authentication methods (getAuthUrl, checkAuthStatus, etc.) were removed 
   * because tokens are now managed per-user in the database, making global CLI auth obsolete.
   */
  private static async executeCLI(
    args: string[],
    token: string,
    onLog?: (message: string) => void
  ): Promise<{ code: number | null; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      // Ensure PATH is preserved and token is set
      const env = { ...process.env, CONTENTFUL_MANAGEMENT_TOKEN: token };

      const scrubbedArgs = args.map(a => (a === token ? '***' : a));
      onLog?.(`[CLI] Running: npx ${scrubbedArgs.join(' ')}`);

      // Do not use shell: true so cross-spawn correctly resolves npx.cmd on Windows
      const cp = spawn('npx', args, { env });
      let stdout = '';
      let stderr = '';

      cp.on('error', (err) => {
        onLog?.(`[CLI Error] Failed to start process: ${err.message}`);
        resolve({ code: -1, stdout: '', stderr: err.message });
      });

      cp.stdout?.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        onLog?.(text); // Preserve raw output for UI formatting
      });

      cp.stderr?.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        onLog?.(text); // Preserve raw output for UI formatting
      });

      cp.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
    });
  }

  /**
   * Executes `contentful space export` CLI command to create a JSON backup of a given environment.
   * Can optionally download assets and include drafts/archived entries.
   *
   * @param spaceId - Target Contentful Space ID
   * @param environmentId - Target Environment ID (e.g., 'master')
   * @param spaceName - Human-readable space name used for generating the filename
   * @param token - Contentful Management Token (CMA)
   * @param onLog - Optional callback to stream CLI stdout/stderr logs
   * @param includeAssets - If true, passes `--download-assets` flag
   * @param includeDrafts - If true, includes unpublished entries
   * @param includeArchived - If true, includes archived entries
   * @returns Object containing success status, generated backup filename, and optional assets path
   */
  static async createBackup(
    spaceId: string,
    environmentId: string,
    spaceName: string,
    token: string,
    onLog?: (message: string) => void,
    includeAssets: boolean = false,
    includeDrafts: boolean = true,
    includeArchived: boolean = true
  ): Promise<{ success: boolean; backupFile?: string; assetsPath?: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', spaceId);
    const backupFile = path.join(backupDir, `${spaceName}-${environmentId}-${timestamp}.json`);

    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    onLog?.(`[CLI] Starting export for space: ${spaceId} (${environmentId})`);

    const args = [
      'contentful', 'space', 'export',
      '--space-id', spaceId,
      '--environment-id', environmentId,
      '--content-file', backupFile,
      '--skip-roles',
      '--skip-webhooks',
      '--management-token', token
    ];

    if (includeAssets) args.push('--download-assets');
    if (includeDrafts) args.push('--include-drafts');
    if (includeArchived) args.push('--include-archived');

    const { code } = await this.executeCLI(args, token, onLog);

    if (code === 0) {
      onLog?.('[CLI] Export completed successfully.');
      return {
        success: true,
        backupFile: path.basename(backupFile),
        assetsPath: includeAssets ? path.join(backupDir, 'assets') : undefined
      };
    }

    onLog?.(`[CLI] Export failed with code ${code}`);
    return { success: false };
  }

  /**
   * Executes `contentful space import` CLI command to restore a JSON backup to a target environment.
   * Supports skipping publishing and custom asset directories.
   *
   * @param spaceId - Target Contentful Space ID
   * @param fileName - Name of the JSON backup file (must exist in `backups/[spaceId]`)
   * @param environmentId - Target Environment ID to restore into
   * @param token - Contentful Management Token (CMA)
   * @param onLog - Optional callback to stream CLI stdout/stderr logs
   * @param skipPublishing - If true, passes `--skip-content-publishing` flag (leaves imported entries in Draft state)
   * @param assetsDir - Optional absolute path to a folder containing assets to restore
   * @throws Error if the import fails or completes with unresolvable data validation errors
   */
  static async restoreBackup(
    spaceId: string,
    fileName: string,
    environmentId: string,
    token: string,
    onLog?: (message: string) => void,
    skipPublishing: boolean = false,
    assetsDir?: string
  ): Promise<void> {
    const backupFilePath = path.join(process.cwd(), 'backups', spaceId, fileName);

    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Backup file not found: ${backupFilePath}`);
    }

    const logDir = path.join(process.cwd(), 'backups', 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logFilePath = path.join(logDir, `contentful-import-error-log-${spaceId}-${Date.now()}.json`);

    onLog?.(`[CLI] Starting import to ${spaceId} (${environmentId})`);

    const args = [
      'contentful', 'space', 'import',
      '--space-id', spaceId,
      '--environment-id', environmentId,
      '--content-file', backupFilePath,
      '--skip-roles',
      '--skip-webhooks',
      '--error-log-file', logFilePath,
      '--management-token', token
    ];

    if (assetsDir) args.push('--assets-directory', assetsDir);
    if (skipPublishing) args.push('--skip-content-publishing');

    const { code, stdout, stderr } = await this.executeCLI(args, token, onLog);

    // Look for the CLI's error summary: "The following X errors and Y warnings occurred"
    const errorMatch = stdout.match(/The following ([1-9]\d*) errors?/i) || stdout.match(/(\d+) errors? occurred/i);
    const hasDataErrors = errorMatch && parseInt(errorMatch[1]) > 0;

    const isSuccess = code === 0 && !hasDataErrors;
    const hasCriticalError = stderr.includes('Error:') && !stderr.includes('Warning') &&
      (stderr.includes('Unauthorized') || stderr.includes('Access denied') || stderr.includes('not found'));

    if (isSuccess && !hasCriticalError && !hasDataErrors) {
      onLog?.('[CLI] Import completed successfully.');
    } else {
      console.error(`[RESTORE CLI DEBUG] Import failed. Code: ${code}. Errors: ${hasDataErrors ? errorMatch[1] : 0}. Stdout: ${stdout.substring(0, 500)}... Stderr: ${stderr}`);

      let errorReason = `Import failed with code ${code}.`;
      if (hasDataErrors) {
        errorReason = `Import completed with ${errorMatch[1]} data errors (e.g. validation or content model conflicts). Check the Contentful error log for details.`;
      } else if (stderr) {
        errorReason = `Import failed. Details: ${stderr}`;
      }

      throw new Error(errorReason);
    }
  }
}
