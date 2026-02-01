import React, { useCallback } from 'react';
import { FormControl, Select, MenuItem, FormHelperText, SelectChangeEvent, Typography, Box, InputLabel } from '@mui/material';
import { Environment } from '@/types/common';

interface EnvironmentSelectorProps {
  environments: Environment[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  disabledOption?: string;
}

const EnvironmentSelector = React.memo<EnvironmentSelectorProps>(({ environments, value, onChange, label, disabled, disabledOption }) => {
  const handleChange = useCallback((event: SelectChangeEvent) => {
    onChange(event.target.value);
  }, [onChange]);

  const labelId = `${label.replace(/\s/g, '-').toLowerCase()}-label`;
  const selectId = label.replace(/\s/g, '-').toLowerCase();

  return (
    <Box sx={{ mb: 3 }}>
      <FormControl fullWidth>
        <InputLabel id={labelId}>{label}</InputLabel>
        <Select
          labelId={labelId}
          id={selectId}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          label={label}
        >
          <MenuItem value="">
            <em>Select a Contentful environment</em>
          </MenuItem>
          {environments.map((env) => (
            <MenuItem
              key={env.id}
              value={env.id}
              disabled={env.id === disabledOption}
            >
              {env.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
});

EnvironmentSelector.displayName = 'EnvironmentSelector';

export default EnvironmentSelector;