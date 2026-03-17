import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Info,
    Code2,
    Lock,
    Copy,
    Check
} from "lucide-react";
import Editor from '@monaco-editor/react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from "@/lib/utils";

interface CodeEditorPanelProps {
    code: string;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
    code
}) => {
    const { mode } = useTheme();
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <Card className="h-full flex flex-col bg-card/95 backdrop-blur-xl border-primary/20 shadow-xl overflow-hidden">
            <CardHeader className="p-4 border-b border-border/50 flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Code2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-black uppercase tracking-tight">Generated Manifest</CardTitle>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">ECMAScript Migration Payload</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            className="h-9 gap-2 text-xs font-black uppercase tracking-widest bg-primary/10 border-primary/20 hover:bg-primary/20 hover:text-primary transition-all"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? "Copied!" : "Copy Code"}
                        </Button>
                    </div>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="h-8 w-8 rounded-full hover:bg-muted/20 flex items-center justify-center cursor-help transition-colors">
                                    <Info className="h-4 w-4 text-muted-foreground opacity-40" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover border-primary/20 text-xs font-bold uppercase tracking-widest">
                                Copy this code to run the migration locally using the Contentful CLI
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 relative group">
                <div className={cn(
                    "absolute inset-0 transition-opacity duration-500 pointer-events-none z-10 opacity-10"
                )}
                    style={{
                        backgroundImage: 'linear-gradient(45deg, var(--primary) 1px, transparent 1px), linear-gradient(-45deg, var(--primary) 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }} />

                <Editor
                    height="100%"
                    language="javascript"
                    theme={mode === 'dark' ? 'vs-dark' : 'light'}
                    value={code}
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        automaticLayout: true,
                        tabSize: 2,
                        renderWhitespace: 'none',
                        padding: { top: 16, bottom: 16 },
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontLigatures: true,
                        cursorStyle: 'block',
                        cursorBlinking: 'smooth',
                        smoothScrolling: true,
                        scrollbar: {
                            vertical: 'visible',
                            horizontal: 'visible',
                            verticalScrollbarSize: 10,
                            horizontalScrollbarSize: 10
                        }
                    }}
                />
            </CardContent>

            <div className="p-3 px-4 border-t border-border/50 bg-muted/40 shrink-0">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary/60" />
                    READ-ONLY MODE: Copy code to execute custom logic manually via CLI
                </p>
            </div>
        </Card>
    );
};
