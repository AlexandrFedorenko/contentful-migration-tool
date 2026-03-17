export interface ErrorInstruction {
  title: string;
  description: string;
  steps: string[];
  severity: 'warning' | 'error' | 'info';
}

export function parseError(errorMessage: string): ErrorInstruction {
  const lowerError = errorMessage.toLowerCase();

  // 1. Specific Conflict: Field Deletion (requires Omit first)
  if (lowerError.includes('omit a field before deleting it')) {
    const contentTypeMatch = errorMessage.match(/ContentType\s+([^(]+)\s*\(([^)]+)\)/);
    const contentTypeName = contentTypeMatch ? contentTypeMatch[1].trim() : 'unknown Content Type';
    return {
      title: 'Field Cannot Be Deleted',
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

  // 2. Rate Limiting
  if (lowerError.includes('rate limit')) {
    return {
      title: 'Rate Limit Exceeded',
      description: 'Contentful has temporarily limited the number of requests. This is normal for large backups.',
      steps: [
        '1. Wait a few minutes - the system will automatically retry',
        '2. If the problem persists, try restoring during off-peak hours',
        '3. This is not a critical error - restoration will continue automatically'
      ],
      severity: 'info'
    };
  }

  // 3. Content Type Conflict
  if (lowerError.includes('already exists') || lowerError.includes('duplicate')) {
    const entityMatch = errorMessage.match(/(content type|entry|asset) ['"`]([^'"`]+)['"`]/i);
    const entityType = entityMatch ? entityMatch[1] : 'item';
    const entityName = entityMatch ? entityMatch[2] : 'unknown';

    return {
      title: lowerError.includes('content type') ? 'Content Type Conflict' : 'Duplicate Content Detected',
      description: `A ${entityType} "${entityName}" already exists in the target environment with a different structure.`,
      steps: [
        '1. Go to Contentful App',
        `2. Find the ${entityType} "${entityName}"`,
        '3. Either delete it or ensure its structure matches the source',
        '4. Try the restore operation again'
      ],
      severity: lowerError.includes('content type') ? 'error' : 'warning'
    };
  }

  // 4. Validation / Missing Parameters
  if (lowerError.includes('required') || lowerError.includes('missing')) {
    return {
      title: 'Missing Required Parameters',
      description: 'Some required parameters are missing for the restore operation.',
      steps: [
        '1. Ensure Space ID and Target Environment are selected',
        '2. Verify a backup file is selected',
        '3. Try the restore operation again'
      ],
      severity: 'warning'
    };
  }

  // 5. Locale Configuration
  if (lowerError.includes('locale') || lowerError.includes('localization')) {
    return {
      title: 'Locale Configuration Issue',
      description: 'There is a conflict with locale settings between the backup and target environment.',
      steps: [
        '1. Go to Contentful App → Settings → Locales',
        '2. Verify required locales exist in target environment',
        '3. Ensure default locale matches between environments',
        '4. Try the restore operation again'
      ],
      severity: 'warning'
    };
  }

  // 6. Assets / Media
  if (lowerError.includes('asset') || lowerError.includes('image')) {
    return {
      title: 'Asset Import Issue',
      description: 'There was a problem importing assets from the backup.',
      steps: [
        '1. Go to Contentful App → Media',
        '2. Check for corrupted or missing assets',
        '3. Verify you have sufficient storage space',
        '4. Try the restore operation again'
      ],
      severity: 'warning'
    };
  }

  // 7. Cannot be Deleted (Entries attached)
  if (lowerError.includes('cannot be deleted because it has entries')) {
    const match = errorMessage.match(/content type ["']([^"']+)["']/i);
    const ctId = match ? match[1] : 'this Content Type';
    return {
      title: 'Content Type In Use',
      description: `The Content Type "${ctId}" cannot be deleted because it contains active entries.`,
      steps: [
        '1. Find and delete all entries of this type first',
        '2. Or use the Contentful UI to delete the type (it will handle entries)',
        '3. Try the migration again'
      ],
      severity: 'error'
    };
  }

  // 8. Type Mismatch
  if (lowerError.includes('type of') && lowerError.includes('incorrect')) {
    return {
      title: 'Type Mismatch Detected',
      description: 'The data type for a field does not match Contentful requirements (e.g. string instead of number).',
      steps: [
        '1. Check quotes for numbers or boolean values',
        '2. Verify that field values match the expected Content Model type',
        '3. Re-run the migration'
      ],
      severity: 'error'
    };
  }

  // 9. Missing Parameters (Link/Array)
  if (lowerError.includes('linktype') || lowerError.includes('items')) {
    return {
      title: 'Field Configuration Error',
      description: 'A Link or Array field is missing required configuration (linkType or items).',
      steps: [
        '1. Ensure Link fields have a target type (Entry/Asset)',
        '2. Ensure Array fields have an item type specified',
        '3. Check the migration JSON/Builder steps'
      ],
      severity: 'error'
    };
  }

  // 10. Authorization / Permissions
  if (lowerError.includes('permission denied') || lowerError.includes('unauthorized') || lowerError.includes('invalid token')) {
    return {
      title: 'Authentication Error',
      description: 'Your Contentful token does not have sufficient permissions or has expired.',
      steps: [
        '1. Check your Personnel Access Token (PAT)',
        '2. Ensure you have "Admin" or "Developer" role in the target space',
        '3. Try to reset authentication in the Settings page'
      ],
      severity: 'error'
    };
  }

  // 11. Generic Fallback
  return {
    title: 'Operation Error',
    description: `An unexpected error occurred:\n\n${errorMessage}`,
    steps: [
      '1. Check the error details in the message above',
      '2. Verify permissions in the target environment',
      '3. Try again or contact support if the problem persists'
    ],
    severity: 'error'
  };
}

export function instructionToString(instruction: ErrorInstruction): string {
  const icon = instruction.severity === 'error' ? '❌' : instruction.severity === 'warning' ? '⚠️' : 'ℹ️';
  let output = `${icon} ${instruction.title}\n\n${instruction.description}`;

  if (instruction.steps.length > 0) {
    output += `\n\n💡 Solution:\n${instruction.steps.map(s => `- ${s}`).join('\n')}`;
  }

  return output;
}
