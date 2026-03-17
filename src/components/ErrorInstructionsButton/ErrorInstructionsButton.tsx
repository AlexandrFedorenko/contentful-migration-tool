import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle as ErrorIcon } from 'lucide-react';

interface ErrorInstructionsButtonProps {
  instruction: unknown;
  onClick: () => void;
  disabled?: boolean;
}

const ErrorInstructionsButton = React.memo<ErrorInstructionsButtonProps>(({
  instruction,
  onClick,
  disabled = false
}) => {
  if (!instruction) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive border-2 font-bold transition-all h-8 px-3"
          >
            <ErrorIcon className="h-4 w-4 mr-2" />
            Error Details
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-destructive text-white font-bold text-[10px] uppercase tracking-widest border-none shadow-lg">
          Click to view error details
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

ErrorInstructionsButton.displayName = 'ErrorInstructionsButton';

export default ErrorInstructionsButton;