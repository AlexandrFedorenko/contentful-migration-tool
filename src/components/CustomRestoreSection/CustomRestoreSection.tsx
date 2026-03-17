import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Upload, FileJson, AlertTriangle, Info } from "lucide-react";
import { useRouter } from 'next/router';
import { GlobalState } from '@/context/GlobalContext';
import { cn } from "@/lib/utils";

interface CustomRestoreSectionProps {
  state: GlobalState;
  selectedFile: File | null;
  loadingCustomRestore: boolean;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCustomRestore: () => void;
}

const CustomRestoreSection = React.memo(({
  state,
  selectedFile,
  loadingCustomRestore,
  onFileSelect
}: CustomRestoreSectionProps) => {
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Prepare file for preview using IndexedDB
  useEffect(() => {
    if (!selectedFile || !state.spaceId) {
      setUploadedFileName(null);
      return;
    }

    const preparePreview = async () => {
      setIsUploading(true);

      try {
        const fileContent = await selectedFile.text();
        const tempFileName = `temp-preview-${Date.now()}-${selectedFile.name}`;

        // Store in IndexedDB for preview page to access (handles large files)
        const storageKey = `temp-backup-${state.spaceId}-${tempFileName}`;
        const { saveTempBackup } = await import('@/utils/largeFileStorage');
        await saveTempBackup(storageKey, fileContent);

        setUploadedFileName(tempFileName);
      } catch (error) {
        console.error('Failed to prepare file for preview:', error);
      } finally {
        setIsUploading(false);
      }
    };

    preparePreview();
  }, [selectedFile, state.spaceId]);

  const router = useRouter();

  const handlePreviewClick = () => {
    if (uploadedFileName && state.spaceId && state.selectedTarget) {
      router.push(`/backup-preview/${uploadedFileName}?spaceId=${state.spaceId}&targetEnv=${state.selectedTarget}`);
    }
  };

  return (
    <Card className="bg-card border-border/50 border-l-amber-500/30 shadow-2xl mt-6 overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-3">
          <Upload className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-sm font-black uppercase tracking-widest">Custom Transform</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium text-amber-200/70 leading-relaxed uppercase tracking-widest">
            Protocol Warning: This will overwrite entries in the target environment with the selected manifest data.
          </p>
        </div>

        <div className="grid gap-4">
          <input
            accept=".json"
            className="hidden"
            id="file-input"
            type="file"
            onChange={onFileSelect}
            disabled={loadingCustomRestore}
          />
          <Label
            htmlFor="file-input"
            className={cn(
              "flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-border/50 bg-muted/20 cursor-pointer transition-all hover:bg-muted/30 hover:border-amber-500/30 group",
              selectedFile && "border-amber-500/20 bg-amber-500/5"
            )}
          >
            {selectedFile ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-2">
                  <FileJson className="h-6 w-6 text-amber-500" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-foreground">{selectedFile.name}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Click to rotate manifest</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-12 w-12 rounded-xl bg-muted/30 flex items-center justify-center border border-border/50 mb-2 group-hover:border-amber-500/20 group-hover:bg-amber-500/5 transition-all">
                  <Upload className="h-6 w-6 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-foreground">Inject Manifest</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Support: .JSON schema exports</span>
              </div>
            )}
          </Label>

          {selectedFile && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {isUploading ? (
                <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-muted/20 border border-border/50">
                  <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Indexing Manifest...</span>
                </div>
              ) : uploadedFileName && (
                <Button
                  variant="outline"
                  onClick={handlePreviewClick}
                  disabled={!state.selectedTarget}
                  className={cn(
                    "w-full py-6 rounded-2xl border-border/50 bg-muted/20 hover:bg-muted/30 text-foreground font-black uppercase tracking-widest gap-2 shadow-xl transition-all active:scale-[0.98]",
                    !state.selectedTarget && "opacity-50 grayscale"
                  )}
                >
                  <Eye className="h-4 w-4" />
                  {state.selectedTarget ? 'Preview & Select Content' : 'Node Mapping Required'}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-2 pt-2 border-t border-border/50">
          <Info className="h-3 w-3 text-muted-foreground opacity-50" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
            Neural Hint: Use Preview to selectively filter locales and schema nodes.
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

import { Label } from "@/components/ui/label";

CustomRestoreSection.displayName = 'CustomRestoreSection';

export default CustomRestoreSection;
