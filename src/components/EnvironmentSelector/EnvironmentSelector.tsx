import React from 'react';
import { Environment } from '@/types/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface EnvironmentSelectorProps {
  environments: Environment[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  disabledOption?: string;
}

const EnvironmentSelector = React.memo<EnvironmentSelectorProps>(({
  environments,
  value,
  onChange,
  label,
  disabled,
  disabledOption
}) => {
  return (
    <div className="space-y-3">
      <span className="text-sm font-semibold text-muted-foreground block">{label}</span>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full bg-background/50">
          <SelectValue placeholder="Select a Contentful environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NO_SELECTION_PLACEHOLDER" disabled className="text-muted-foreground italic">
            Select a Contentful environment
          </SelectItem>
          {environments.map((env) => (
            <SelectItem
              key={env.id}
              value={env.id}
              disabled={env.id === disabledOption}
            >
              {env.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

EnvironmentSelector.displayName = 'EnvironmentSelector';

export default EnvironmentSelector;