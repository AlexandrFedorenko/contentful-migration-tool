import React from 'react';
import { Paper, Typography, Box, Radio, RadioGroup, FormControlLabel, Divider } from '@mui/material';
import SpaceSelector from '@/components/SpaceSelector/SpaceSelector';
import { GlobalState } from '@/context/GlobalContext';

interface SpaceSelectorSectionProps {
  state: GlobalState;
  onRestoreModeChange: (checked: boolean) => void;
  onCustomRestoreModeChange: (checked: boolean) => void;
  onCustomMigrateModeChange: (checked: boolean) => void;
  customRestoreMode: boolean;
  customMigrateMode: boolean;
}

const SpaceSelectorSection = React.memo(({
  state,
  onRestoreModeChange,
  onCustomRestoreModeChange,
  onCustomMigrateModeChange,
  customRestoreMode,
  customMigrateMode
}: SpaceSelectorSectionProps) => {

  const currentMode = state.restoreMode
    ? 'restore'
    : customRestoreMode
      ? 'customRestore'
      : customMigrateMode
        ? 'customMigrate'
        : 'default';

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    // Reset all first
    onRestoreModeChange(false);
    onCustomRestoreModeChange(false);
    onCustomMigrateModeChange(false);

    // Set new mode
    if (value === 'restore') onRestoreModeChange(true);
    if (value === 'customRestore') onCustomRestoreModeChange(true);
    if (value === 'customMigrate') onCustomMigrateModeChange(true);
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Select Space
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ mb: 3, mt: 3 }}>
        <SpaceSelector />
      </Box>

      {state.spaceId && (
        <>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Operation Mode
          </Typography>

          <RadioGroup
            value={currentMode}
            onChange={handleModeChange}
          >
            <FormControlLabel
              value="default"
              control={<Radio />}
              label="Create Backup"
            />
            <FormControlLabel
              value="restore"
              control={<Radio />}
              label="Restore"
            />
            <FormControlLabel
              value="customRestore"
              control={<Radio />}
              label="Custom Restore"
            />

          </RadioGroup>
        </>
      )}
    </Paper>
  );
});

SpaceSelectorSection.displayName = 'SpaceSelectorSection';

export default SpaceSelectorSection;
