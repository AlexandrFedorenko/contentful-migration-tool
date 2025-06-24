import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText, SelectChangeEvent } from '@mui/material';
import { Environment } from '@/types/common';

interface EnvironmentSelectorProps {
  environments: Environment[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export default function EnvironmentSelector({ environments, value, onChange, label }: EnvironmentSelectorProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        label={label}
      >
        {environments.map((env) => (
          <MenuItem key={env.id} value={env.id}>{env.name}</MenuItem>
        ))}
      </Select>
      <FormHelperText>Select a Contentful environment</FormHelperText>
    </FormControl>
  );
} 