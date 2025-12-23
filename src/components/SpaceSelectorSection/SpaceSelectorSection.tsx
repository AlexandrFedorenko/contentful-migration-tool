import React from 'react';
import { Paper, Typography, Box, Checkbox, FormControlLabel } from '@mui/material';
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
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Select Space
      </Typography>
      <SpaceSelector />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={!!state.restoreMode}
              onChange={e => onRestoreModeChange(e.target.checked)}
              color="primary"
              disabled={customRestoreMode || customMigrateMode}
            />
          }
          label="Restore"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={customRestoreMode}
              onChange={e => onCustomRestoreModeChange(e.target.checked)}
              color="secondary"
              disabled={customMigrateMode}
            />
          }
          label="Custom Restore"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={customMigrateMode}
              onChange={e => onCustomMigrateModeChange(e.target.checked)}
              color="primary"
            />
          }
          label="Custom Migrate"
        />
      </Box>
    </Paper>
  );
});

SpaceSelectorSection.displayName = 'SpaceSelectorSection';

export default SpaceSelectorSection;

