/**
 * Утилита для парсинга ошибок Contentful и генерации инструкций
 */

export interface ErrorInstruction {
  title: string;
  description: string;
  steps: string[];
  severity: 'warning' | 'error' | 'info';
}

export class ErrorParser {
  /**
   * Парсит ошибку и возвращает инструкции для пользователя
   */
  static parseError(errorMessage: string): ErrorInstruction | null {
    const lowerError = errorMessage.toLowerCase();
    
    // Ошибки валидации параметров
    if (lowerError.includes('required') || lowerError.includes('missing')) {
      return this.parseValidationError(errorMessage);
    }
    
    // Ошибки Contentful CLI - поле нужно удалить перед добавлением
    if (lowerError.includes('omit a field before deleting it')) {
      return this.parseFieldDeletionError(errorMessage);
    }
    
    // Ошибки rate limit
    if (lowerError.includes('rate limit')) {
      return this.parseRateLimitError(errorMessage);
    }
    
    // Ошибки связанные с типами контента
    if (lowerError.includes('content type') && lowerError.includes('not found')) {
      return this.parseContentTypeError(errorMessage);
    }
    
    // Ошибки связанные с дублированием контента
    if (lowerError.includes('already exists') || lowerError.includes('duplicate')) {
      return this.parseDuplicateError(errorMessage);
    }
    
    // Ошибки связанные с локалями
    if (lowerError.includes('locale') || lowerError.includes('localization')) {
      return this.parseLocaleError(errorMessage);
    }
    
    // Ошибки связанные с ассетами
    if (lowerError.includes('asset') || lowerError.includes('image')) {
      return this.parseAssetError(errorMessage);
    }
    
    // Ошибки связанные с записями
    if (lowerError.includes('entry') || lowerError.includes('content')) {
      return this.parseEntryError(errorMessage);
    }
    
    // Общие ошибки
    return this.parseGenericError(errorMessage);
  }
  
  /**
   * Парсит ошибки типов контента
   */
  private static parseContentTypeError(errorMessage: string): ErrorInstruction {
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
  
  /**
   * Парсит ошибки дублирования
   */
  private static parseDuplicateError(errorMessage: string): ErrorInstruction {
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
  
  /**
   * Парсит ошибки локалей
   */
  private static parseLocaleError(errorMessage: string): ErrorInstruction {
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
  
  /**
   * Парсит ошибки ассетов
   */
  private static parseAssetError(errorMessage: string): ErrorInstruction {
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
  
  /**
   * Парсит ошибки записей
   */
  private static parseEntryError(errorMessage: string): ErrorInstruction {
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
  
  /**
   * Парсит ошибки валидации параметров
   */
  private static parseValidationError(errorMessage: string): ErrorInstruction {
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
  
  /**
   * Парсит ошибки удаления полей в Contentful
   */
  private static parseFieldDeletionError(errorMessage: string): ErrorInstruction {
    // Извлекаем информацию о конкретном content type из лога
    const contentTypeMatch = errorMessage.match(/ContentType\s+([^(]+)\s*\(([^)]+)\)/);
    const contentTypeName = contentTypeMatch ? contentTypeMatch[1].trim() : 'неизвестный Content Type';
    const contentTypeId = contentTypeMatch ? contentTypeMatch[2] : 'неизвестный ID';
    
    return {
      title: 'Поле не может быть удалено',
      description: `В content type "${contentTypeName}" есть поле, которое нельзя удалить напрямую. Contentful требует сначала сделать поле необязательным.`,
      steps: [
        `1. Откройте Contentful: https://app.contentful.com/spaces/[YOUR_SPACE_ID]/content_types`,
        `2. Найдите content type "${contentTypeName}"`,
        `3. Найдите поле, которое нужно удалить`,
        `4. Сначала установите поле как "необязательное" (optional)`,
        `5. Сохраните content type`,
        `6. Затем удалите поле полностью`,
        `7. Попробуйте восстановить бэкап снова`
      ],
      severity: 'error'
    };
  }
  
  /**
   * Парсит ошибки rate limit
   */
  private static parseRateLimitError(errorMessage: string): ErrorInstruction {
    return {
      title: 'Превышен лимит запросов',
      description: 'Contentful временно ограничил количество запросов. Это нормально для больших бэкапов.',
      steps: [
        '1. Подождите несколько минут - система автоматически повторит попытку',
        '2. Если проблема повторяется, попробуйте восстановить в нерабочее время',
        '3. Для больших бэкапов процесс может занять больше времени',
        '4. Это не критическая ошибка - восстановление продолжится автоматически'
      ],
      severity: 'info'
    };
  }
  
  /**
   * Парсит общие ошибки
   */
  private static parseGenericError(errorMessage: string): ErrorInstruction {
    return {
      title: 'Ошибка восстановления',
      description: 'Произошла неожиданная ошибка при восстановлении бэкапа.',
      steps: [
        '1. Проверьте детали ошибки в сообщении',
        '2. Убедитесь, что у вас есть права в целевой среде',
        '3. Проверьте, что файл бэкапа не поврежден',
        '4. Попробуйте создать новый бэкап и восстановить снова',
        '5. Обратитесь в поддержку, если проблема повторяется'
      ],
      severity: 'error'
    };
  }

  /**
   * Парсит успешные операции с предупреждениями
   */
  static parseSuccessWithWarnings(logMessage: string): ErrorInstruction | null {
    const lowerLog = logMessage.toLowerCase();
    
    // Проверяем, есть ли ошибки и предупреждения в успешном логе
    if (lowerLog.includes('errors and') && lowerLog.includes('warnings occurred')) {
      const errors = [];
      const warnings = [];
      
      // Извлекаем ошибки и предупреждения из лога
      const lines = logMessage.split('\n');
      for (const line of lines) {
        if (line.includes('BadRequest:') || line.includes('Error:')) {
          errors.push(line.trim());
        } else if (line.includes('Rate limit error') || line.includes('Warning:')) {
          warnings.push(line.trim());
        }
      }
      
      if (errors.length > 0) {
        // Парсим первую ошибку для детального отображения
        const firstError = errors[0];
        
        // Ищем конкретную информацию об ошибке в логе
        const lines = logMessage.split('\n');
        let contentTypeName = 'неизвестный Content Type';
        
        // Ищем строку с ошибкой и информацию о content type
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('✖ BadRequest:') && line.includes('omit a field before deleting it')) {
            // Сначала проверяем саму строку с ошибкой
            const currentLineMatch = line.match(/ContentType\s+([^(]+)\s*\(([^)]+)\)/);
            if (currentLineMatch) {
              contentTypeName = currentLineMatch[1].trim();
              break;
            }
            
            // Ищем в соседних строках информацию о content type
            for (let j = Math.max(0, i - 3); j < Math.min(i + 10, lines.length); j++) {
              const searchLine = lines[j];
              const match = searchLine.match(/ContentType\s+([^(]+)\s*\(([^)]+)\)/);
              if (match) {
                contentTypeName = match[1].trim();
                break;
              }
            }
            break;
          }
        }
        
        return {
          title: `Ошибка в Content Type: ${contentTypeName}`,
          description: `В content type "${contentTypeName}" есть поле, которое нельзя удалить напрямую. Contentful требует сначала сделать поле необязательным.`,
          steps: [
            `1. Откройте Contentful и перейдите к content type "${contentTypeName}"`,
            '2. Найдите поле, которое нужно удалить',
            '3. Сначала установите поле как "необязательное" (optional)',
            '4. Сохраните content type',
            '5. Затем удалите поле полностью',
            '6. Попробуйте восстановить бэкап снова'
          ],
          severity: 'error'
        };
      } else if (warnings.length > 0) {
        return {
          title: 'Восстановление завершено с предупреждениями',
          description: `Восстановление прошло успешно, но были обнаружены ${warnings.length} предупреждений.`,
          steps: [
            '1. Проверьте, что все данные восстановлены корректно',
            '2. Предупреждения не критичны, но стоит обратить внимание',
            '3. Создайте новый бэкап после проверки'
          ],
          severity: 'info'
        };
      }
    }
    
    return null;
  }

  /**
   * Парсит конкретную ошибку из лога
   */
  private static parseSpecificError(errorLine: string): ErrorInstruction | null {
    // Ошибка "You need to omit a field before deleting it"
    if (errorLine.includes('You need to omit a field before deleting it')) {
      // Ищем информацию о content type в логе
      const contentTypeMatch = errorLine.match(/ContentType\s+([^(]+)\s*\(([^)]+)\)/);
      const contentTypeName = contentTypeMatch ? contentTypeMatch[1].trim() : 'неизвестный Content Type';
      
      return {
        title: `Ошибка в Content Type: ${contentTypeName}`,
        description: `В content type "${contentTypeName}" есть поле, которое нельзя удалить напрямую. Contentful требует сначала сделать поле необязательным.`,
        steps: [
          `1. Откройте Contentful и перейдите к content type "${contentTypeName}"`,
          '2. Найдите поле, которое нужно удалить',
          '3. Сначала установите поле как "необязательное" (optional)',
          '4. Сохраните content type',
          '5. Затем удалите поле полностью',
          '6. Попробуйте восстановить бэкап снова'
        ],
        severity: 'error'
      };
    }
    
    // Rate limit ошибка
    if (errorLine.includes('Rate limit error')) {
      return {
        title: 'Превышен лимит запросов',
        description: 'Contentful временно ограничил количество запросов. Это нормально для больших бэкапов.',
        steps: [
          '1. Подождите несколько минут - система автоматически повторит попытку',
          '2. Если проблема повторяется, попробуйте восстановить в нерабочее время',
          '3. Для больших бэкапов процесс может занять больше времени',
          '4. Это не критическая ошибка - восстановление продолжится автоматически'
        ],
        severity: 'info'
      };
    }
    
    return null;
  }

  /**
   * Детальный анализ лога для извлечения конкретных ошибок
   */
  static parseDetailedLog(logMessage: string): ErrorInstruction[] {
    const instructions: ErrorInstruction[] = [];
    const lines = logMessage.split('\n');
    
    for (const line of lines) {
      // Ищем строки с ошибками
      if (line.includes('✖ BadRequest:') || line.includes('✖ Error:')) {
        const instruction = this.parseSpecificError(line);
        if (instruction) {
          instructions.push(instruction);
        }
      }
      
      // Ищем строки с предупреждениями
      if (line.includes('⚠ Rate limit error')) {
        const instruction = this.parseSpecificError(line);
        if (instruction) {
          instructions.push(instruction);
        }
      }
    }
    
    return instructions;
  }
  
  /**
   * Извлекает конкретные имена сущностей из ошибки
   */
  static extractEntityNames(errorMessage: string): string[] {
    const matches = errorMessage.match(/['"`]([^'"`]+)['"`]/g);
    if (!matches) return [];
    
    return matches.map(match => match.replace(/['"`]/g, ''));
  }
  
  /**
   * Проверяет, является ли ошибка критической
   */
  static isCriticalError(errorMessage: string): boolean {
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
} 