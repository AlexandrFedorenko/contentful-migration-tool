import React from 'react';
import { useStore } from '@/store/useStore';
import RestoreResultModal from './RestoreResultModal';

const RestoreResultContainer: React.FC = () => {
    const restoreResult = useStore(state => state.restoreResult);
    const dispatch = useStore(state => state.dispatch);

    const handleClose = () => {
        dispatch({ type: "CLOSE_RESTORE_RESULT" });
    };

    if (!restoreResult.open) return null;

    return (
        <RestoreResultModal
            open={restoreResult.open}
            success={restoreResult.success}
            backupName={restoreResult.backupName}
            targetEnvironment={restoreResult.targetEnvironment}
            errorMessage={restoreResult.errorMessage}
            onClose={handleClose}
        />
    );
};

export default RestoreResultContainer;
