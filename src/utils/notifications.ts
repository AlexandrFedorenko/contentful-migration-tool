type NotificationType = 'backup' | 'restore' | 'migration' | 'delete' | 'create' | 'deleteBackup';

interface NotificationMessages {
    start: string;
    success: string;
    error: string;
}

const NOTIFICATIONS: Record<NotificationType, NotificationMessages> = {
    backup: {
        start: '🚀 Starting backup for environment: {env}...',
        success: '✅ Backup completed successfully!\nFile: {file}',
        error: '❌ Backup failed: {error}'
    },
    deleteBackup: {
        start: '🚀 Deleting backup file: {file}...',
        success: '✅ Backup file deleted successfully',
        error: '❌ Failed to delete backup: {error}'
    },
    restore: {
        start: '🚀 Starting restore to environment: {env}...',
        success: '✅ Restore completed successfully to {env}',
        error: '❌ Restore failed: {error}'
    },
    migration: {
        start: '🚀 Starting migration from {sourceEnv} to {targetEnv}...',
        success: '✅ Migration completed successfully',
        error: '❌ Migration failed: {error}'
    },
    delete: {
        start: '🚀 Starting deletion of environment: {env}...',
        success: '✅ Environment {env} deleted successfully',
        error: '❌ Deletion failed: {error}'
    },
    create: {
        start: '🚀 Creating new environment: {env}...',
        success: '✅ Environment {env} created successfully',
        error: '❌ Creation failed: {error}'
    }
};

export function getNotificationMessage(
    type: NotificationType,
    status: 'start' | 'success' | 'error',
    params: Record<string, string>
): string {
    let message = NOTIFICATIONS[type][status];
    
    // Заменяем плейсхолдеры на реальные значения
    Object.entries(params).forEach(([key, value]) => {
        message = message.replace(`{${key}}`, value);
    });
    
    return message;
} 