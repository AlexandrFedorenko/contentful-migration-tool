export interface ErrorInstruction {
  title: string;
  description: string;
  steps: string[];
  severity: 'warning' | 'error' | 'info';
}

function parseContentTypeError(errorMessage: string): ErrorInstruction {
    const contentTypeMatch = errorMessage.match(/content type ['"`]([^'"`]+)['"`]/i);
    const contentType = contentTypeMatch ? contentTypeMatch[1] : 'unknown';
    
    return {
      title: 'Content Type Conflict',
      description: `The content type "${contentType}" already exists in the target environment with a different structure.`,
      steps: [
        'Go to Contentful App → Content Model',
        `Find the content type "${contentType}"`,
        'Either delete it completely or update its structure to match the backup',
        'If you delete it, make sure to also delete any entries using this content type',
        'Try the restore operation again'
      ],
      severity: 'error'
    };
  }
  
function parseDuplicateError(errorMessage: string): ErrorInstruction {
    const entityMatch = errorMessage.match(/(content type|entry|asset) ['"`]([^'"`]+)['"`]/i);
    const entityType = entityMatch ? entityMatch[1] : 'item';
    const entityName = entityMatch ? entityMatch[2] : 'unknown';
    
    return {
      title: 'Duplicate Content Detected',
      description: `A ${entityType} "${entityName}" already exists in the target environment.`,
      steps: [
        'Go to Contentful App → Content',
        `Find the ${entityType} "${entityName}"`,
        'Delete it from the target environment',
        'Make sure to also delete any references to this item',
        'Try the restore operation again'
      ],
      severity: 'warning'
    };
  }
  
function parseLocaleError(errorMessage: string): ErrorInstruction {
    return {
      title: 'Locale Configuration Issue',
      description: 'There is a conflict with locale settings between the backup and target environment.',
      steps: [
        'Go to Contentful App → Settings → Locales',
        'Check if the required locales exist in the target environment',
        'Make sure the default locale matches between environments',
        'If needed, add missing locales to the target environment',
        'Try the restore operation again'
      ],
      severity: 'warning'
    };
  }
  
function parseAssetError(errorMessage: string): ErrorInstruction {
    return {
      title: 'Asset Import Issue',
      description: 'There was a problem importing assets from the backup.',
      steps: [
        'Go to Contentful App → Media',
        'Check if there are any corrupted or missing assets',
        'Delete any problematic assets from the target environment',
        'Make sure you have sufficient storage space',
        'Try the restore operation again'
      ],
      severity: 'warning'
    };
  }
  
function parseEntryError(errorMessage: string): ErrorInstruction {
    return {
      title: 'Entry Import Issue',
      description: 'There was a problem importing content entries from the backup.',
      steps: [
        'Go to Contentful App → Content',
        'Check if there are any entries with missing required fields',
        'Verify that all referenced content types exist',
        'Delete any problematic entries from the target environment',
        'Try the restore operation again'
      ],
      severity: 'warning'
    };
  }
  
function parseValidationError(errorMessage: string): ErrorInstruction {
    return {
      title: 'Missing Required Parameters',
      description: 'Some required parameters are missing for the restore operation.',
      steps: [
        'Make sure you have selected a space',
        'Select a target environment for restore',
        'Choose a backup file to restore from',
        'Verify that all selections are properly made',
        'Try the restore operation again'
      ],
      severity: 'warning'
    };
  }
  
function parseFieldDeletionError(errorMessage: string): ErrorInstruction {
    const contentTypeMatch = errorMessage.match(/ContentType\s+([^(]+)\s*\(([^)]+)\)/);
    const contentTypeName = contentTypeMatch ? contentTypeMatch[1].trim() : 'unknown Content Type';
    
    return {
      title: 'Field Cannot Be Deleted',
      description: `The content type "${contentTypeName}" has a field that cannot be deleted directly. Contentful requires making the field optional first.`,
      steps: [
        `1. Open Contentful: https://app.contentful.com/spaces/[YOUR_SPACE_ID]/content_types`,
        `2. Find the content type "${contentTypeName}"`,
        `3. Find the field that needs to be deleted`,
        `4. First, set the field as "optional"`,
        `5. Save the content type`,
        `6. Then delete the field completely`,
        `7. Try restoring the backup again`
      ],
      severity: 'error'
    };
  }
  
function parseRateLimitError(errorMessage: string): ErrorInstruction {
    return {
      title: 'Rate Limit Exceeded',
      description: 'Contentful has temporarily limited the number of requests. This is normal for large backups.',
      steps: [
        '1. Wait a few minutes - the system will automatically retry',
        '2. If the problem persists, try restoring during off-peak hours',
        '3. For large backups, the process may take longer',
        '4. This is not a critical error - restoration will continue automatically'
      ],
      severity: 'info'
    };
  }
  
function parseGenericError(errorMessage: string): ErrorInstruction {
    return {
      title: 'Restore Error',
      description: 'An unexpected error occurred while restoring the backup.',
      steps: [
        '1. Check the error details in the message',
        '2. Make sure you have permissions in the target environment',
        '3. Verify that the backup file is not corrupted',
        '4. Try creating a new backup and restoring again',
        '5. Contact support if the problem persists'
      ],
      severity: 'error'
    };
  }

export function parseSuccessWithWarnings(logMessage: string): ErrorInstruction | null {
    const lowerLog = logMessage.toLowerCase();
    
    if (lowerLog.includes('errors and') && lowerLog.includes('warnings occurred')) {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      const lines = logMessage.split('\n');
      for (const line of lines) {
        if (line.includes('BadRequest:') || line.includes('Error:')) {
          errors.push(line.trim());
        } else if (line.includes('Rate limit error') || line.includes('Warning:')) {
          warnings.push(line.trim());
        }
      }
      
      if (errors.length > 0) {
        const firstError = errors[0];
        
        if (firstError.toLowerCase().includes('omit a field before deleting it')) {
          return parseFieldDeletionError(firstError);
        }
        
        const lines = logMessage.split('\n');
        for (const line of lines) {
          if (line.includes('✖ BadRequest:') || line.includes('✖ Error:')) {
            const specificError = parseSpecificError(line);
            if (specificError) {
              return specificError;
            }
          }
        }
        
        return parseGenericError(firstError);
      } else if (warnings.length > 0) {
        return {
          title: 'Restore Completed with Warnings',
          description: `Restore completed successfully, but ${warnings.length} warnings were detected.`,
          steps: [
            '1. Verify that all data has been restored correctly',
            '2. Warnings are not critical, but worth attention',
            '3. Create a new backup after verification'
          ],
          severity: 'info'
        };
      }
    }
    
    return null;
  }

function parseSpecificError(errorLine: string): ErrorInstruction | null {
    if (errorLine.includes('You need to omit a field before deleting it')) {
      const contentTypeMatch = errorLine.match(/ContentType\s+([^(]+)\s*\(([^)]+)\)/);
      const contentTypeName = contentTypeMatch ? contentTypeMatch[1].trim() : 'unknown Content Type';
      
      return {
        title: `Error in Content Type: ${contentTypeName}`,
        description: `The content type "${contentTypeName}" has a field that cannot be deleted directly. Contentful requires making the field optional first.`,
        steps: [
          `1. Open Contentful and navigate to content type "${contentTypeName}"`,
          '2. Find the field that needs to be deleted',
          '3. First, set the field as "optional"',
          '4. Save the content type',
          '5. Then delete the field completely',
          '6. Try restoring the backup again'
        ],
        severity: 'error'
      };
    }
    
    if (errorLine.includes('Rate limit error')) {
      return {
        title: 'Rate Limit Exceeded',
        description: 'Contentful has temporarily limited the number of requests. This is normal for large backups.',
        steps: [
          '1. Wait a few minutes - the system will automatically retry',
          '2. If the problem persists, try restoring during off-peak hours',
          '3. For large backups, the process may take longer',
          '4. This is not a critical error - restoration will continue automatically'
        ],
        severity: 'info'
      };
    }
    
    return null;
  }

export function parseDetailedLog(logMessage: string): ErrorInstruction[] {
  const instructions: ErrorInstruction[] = [];
  const lines = logMessage.split('\n');
  
  for (const line of lines) {
    if (line.includes('✖ BadRequest:') || line.includes('✖ Error:')) {
      const instruction = parseSpecificError(line);
      if (instruction) {
        instructions.push(instruction);
      }
    }
    
    if (line.includes('⚠ Rate limit error')) {
      const instruction = parseSpecificError(line);
      if (instruction) {
        instructions.push(instruction);
      }
    }
  }
  
  return instructions;
}

export function extractEntityNames(errorMessage: string): string[] {
  const matches = errorMessage.match(/['"`]([^'"`]+)['"`]/g);
  if (!matches) return [];
  
  return matches.map(match => match.replace(/['"`]/g, ''));
}

export function isCriticalError(errorMessage: string): boolean {
  const criticalKeywords = [
    'permission denied',
    'unauthorized',
    'invalid token',
    'space not found',
    'environment not found'
  ];
  
  const lowerError = errorMessage.toLowerCase();
  return criticalKeywords.some(keyword => lowerError.includes(keyword));
}

export function parseError(errorMessage: string): ErrorInstruction | null {
  const lowerError = errorMessage.toLowerCase();
  
  if (lowerError.includes('required') || lowerError.includes('missing')) {
    return parseValidationError(errorMessage);
  }
  
  if (lowerError.includes('omit a field before deleting it')) {
    return parseFieldDeletionError(errorMessage);
  }
  
  if (lowerError.includes('rate limit')) {
    return parseRateLimitError(errorMessage);
  }
  
  if (lowerError.includes('content type') && lowerError.includes('not found')) {
    return parseContentTypeError(errorMessage);
  }
  
  if (lowerError.includes('already exists') || lowerError.includes('duplicate')) {
    return parseDuplicateError(errorMessage);
  }
  
  if (lowerError.includes('locale') || lowerError.includes('localization')) {
    return parseLocaleError(errorMessage);
  }
  
  if (lowerError.includes('asset') || lowerError.includes('image')) {
    return parseAssetError(errorMessage);
  }
  
  if (lowerError.includes('entry') || lowerError.includes('content')) {
    return parseEntryError(errorMessage);
  }
  
  return parseGenericError(errorMessage);
} 