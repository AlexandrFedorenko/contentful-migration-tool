import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SpaceSelector from '@/components/SpaceSelector/SpaceSelector';
import { GlobalState } from '@/context/GlobalContext';
import { Database, Zap, Settings2, ShieldCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const handleModeChange = (value: string) => {
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
    <Card className="bg-card border-border/50 shadow-2xl h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-black uppercase tracking-widest">Space Registry</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-0 space-y-6">
        <div className="space-y-4">
          <SpaceSelector />
        </div>

        {state.spaceId && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operation Mode</span>
            </div>

            <RadioGroup
              value={currentMode}
              onValueChange={handleModeChange}
              className="grid gap-2"
            >
              {[
                { id: "default", label: "Create Backup", icon: <Database className="h-3 w-3" /> },
                { id: "restore", label: "Full Restore", icon: <ShieldCheck className="h-3 w-3" /> },
                { id: "customRestore", label: "Custom Transform", icon: <Zap className="h-3 w-3" /> }
              ].map((mode) => (
                <div key={mode.id} className="relative">
                  <RadioGroupItem
                    value={mode.id}
                    id={mode.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={mode.id}
                    className={cn(
                      "flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 cursor-pointer transition-all",
                      "hover:bg-muted/30 hover:border-border",
                      "peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:border-primary/30 peer-data-[state=checked]:text-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center border border-border/50 bg-muted/20",
                        "peer-data-[state=checked]:border-primary/20 peer-data-[state=checked]:bg-primary/5"
                      )}>
                        {mode.icon}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest">{mode.label}</span>
                    </div>
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 peer-data-[state=checked]:opacity-100 transition-opacity" />
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SpaceSelectorSection.displayName = 'SpaceSelectorSection';

export default SpaceSelectorSection;
