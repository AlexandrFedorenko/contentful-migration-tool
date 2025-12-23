import React, { useCallback } from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText, SelectChangeEvent } from '@mui/material';
import { Environment } from '@/types/common';

interface EnvironmentSelectorProps {
  environments: Environment[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

const EnvironmentSelector = React.memo<EnvironmentSelectorProps>(({ environments, value, onChange, label, disabled }) => {
  const handleChange = useCallback((event: SelectChangeEvent) => {
    onChange(event.target.value);
  }, [onChange]);

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        label={label}
        disabled={disabled}
      >
        {environments.map((env) => (
          <MenuItem key={env.id} value={env.id}>{env.name}</MenuItem>
        ))}
      </Select>
      <FormHelperText>Select a Contentful environment</FormHelperText>
    </FormControl>
  );
});

EnvironmentSelector.displayName = 'EnvironmentSelector';

export default EnvironmentSelector; 