import React, { useCallback } from 'react';
import { useSpaces } from '@/hooks/useSpaces';
import { useGlobalContext } from '@/context/GlobalContext';
import { useAuth } from '@/context/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface SpaceSelectorProps {
  size?: 'small' | 'medium';
  className?: string;
}

const SpaceSelector = React.memo(({ className }: SpaceSelectorProps) => {
  const { state, dispatch } = useGlobalContext();
  const { spaces, loading, error } = useSpaces();
  const { isLoggedIn } = useAuth();

  const handleValueChange = useCallback((spaceId: string) => {
    dispatch({ type: 'SET_SPACE_ID', payload: spaceId });
    dispatch({ type: 'SET_SOURCE_ENV', payload: '' });
    dispatch({ type: 'SET_TARGET_ENV', payload: '' });
  }, [dispatch]);

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading spaces...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading spaces</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (spaces.length === 0) {
    return (
      <Alert className={cn("bg-amber-500/10 border-amber-500/20 text-amber-500", className)}>
        <Info className="h-4 w-4" />
        <AlertTitle className="font-bold">No spaces found</AlertTitle>
        <AlertDescription className="text-xs">
          Your token is valid but doesn't have access to any spaces.
          Verify your token in <strong>Profile & Settings</strong>.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <span className="text-sm font-semibold text-muted-foreground block">Select Space</span>
      <Select
        value={state.spaceId || ''}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-full bg-background/50">
          <SelectValue placeholder="Select a space" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NO_SELECTION_PLACEHOLDER" disabled className="text-muted-foreground italic">
            Select a space
          </SelectItem>
          {spaces.map((space) => (
            <SelectItem key={space.id} value={space.id}>
              {space.name} <span className="text-[10px] opacity-50 ml-1">({space.id})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

SpaceSelector.displayName = 'SpaceSelector';

export default SpaceSelector;
