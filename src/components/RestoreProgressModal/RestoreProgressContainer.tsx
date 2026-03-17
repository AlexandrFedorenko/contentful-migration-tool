import React from 'react';
import { useStore } from '@/store/useStore';
import RestoreProgressModal from './RestoreProgressModal';

const RestoreProgressContainer: React.FC = () => {
    const restoreProgress = useStore(state => state.restoreProgress);
    const dispatch = useStore(state => state.dispatch);

    const handleClose = () => {
        dispatch({
            type: "SET_RESTORE_PROGRESS",
            payload: {
                isActive: false,
                steps: [],
                currentStep: 0,
                overallProgress: 0
            }
        });
    };

    return (
        <RestoreProgressModal
            open={restoreProgress.isActive}
            steps={restoreProgress.steps}
            currentStep={restoreProgress.currentStep}
            overallProgress={restoreProgress.overallProgress}
            onClose={handleClose}
        />
    );
};

export default RestoreProgressContainer;
