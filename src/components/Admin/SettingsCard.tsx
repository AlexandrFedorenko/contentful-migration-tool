import React, { useState, useEffect } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Alert,
    AlertDescription,
    AlertTitle
} from "@/components/ui/alert";
import {
    Info,
    Settings2,
    Save,
    Loader2,
    Megaphone,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { cn } from "@/lib/utils";

export const SettingsCard = () => {
    const { settings, updateSettings, loading } = useAppSettings();

    const [enabled, setEnabled] = useState(true);
    const [text, setText] = useState('');
    const [tickerEnabled, setTickerEnabled] = useState(false);
    const [tickerText, setTickerText] = useState('');
    const [maxAssetSizeMB, setMaxAssetSizeMB] = useState(1024);
    const [maxBackupsPerUser, setMaxBackupsPerUser] = useState(1);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (settings) {
            setEnabled(settings.betaBannerEnabled);
            setText(settings.betaBannerText);
            setTickerEnabled(settings.tickerEnabled);
            setTickerText(settings.tickerText);
            setMaxAssetSizeMB(settings.maxAssetSizeMB || 1024);
            setMaxBackupsPerUser(settings.maxBackupsPerUser || 1);
        }
    }, [settings]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        const success = await updateSettings({
            betaBannerEnabled: enabled,
            betaBannerText: text,
            tickerEnabled,
            tickerText,
            maxAssetSizeMB,
            maxBackupsPerUser
        });

        if (success) {
            setMessage({ type: 'success', text: 'Settings updated successfully' });
            setTimeout(() => setMessage(null), 5000);
        } else {
            setMessage({ type: 'error', text: 'Failed to update settings' });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <Card className="mt-6 border-primary/10 bg-card/50 backdrop-blur-sm">
                <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading global settings...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-6 border-primary/20 bg-card/10 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Settings2 className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Global App Settings</CardTitle>
                        <CardDescription>Configure application-wide notifications, banners and resource limits</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
                {/* Beta Banner Configuration */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="beta-banner" className="text-base font-bold">Beta Availability Banner</Label>
                            <p className="text-xs text-muted-foreground">Display a persistent notification about beta status to all users</p>
                        </div>
                        <Switch
                            id="beta-banner"
                            checked={enabled}
                            onCheckedChange={setEnabled}
                        />
                    </div>

                    <div className={cn("space-y-2 transition-all duration-300", !enabled && "opacity-50 grayscale pointer-events-none")}>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Banner Title/Text</Label>
                        <Input
                            placeholder="e.g., Application is currently in Private Beta"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="bg-background/50 border-border/50"
                        />
                    </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Global Ticker Configuration */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="global-ticker" className="text-base font-bold text-amber-500">Global System Ticker</Label>
                            <p className="text-xs text-muted-foreground">Show an urgent marquee for system maintenance or critical updates</p>
                        </div>
                        <Switch
                            id="global-ticker"
                            checked={tickerEnabled}
                            onCheckedChange={setTickerEnabled}
                            className="data-[state=checked]:bg-amber-500"
                        />
                    </div>

                    <div className={cn("space-y-2 transition-all duration-300", !tickerEnabled && "opacity-50 grayscale pointer-events-none")}>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ticker Content</Label>
                        <div className="relative group">
                            <Megaphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/50 group-focus-within:text-amber-500 transition-colors" />
                            <Input
                                placeholder="Maintenance scheduled for Sunday 12:00 UTC..."
                                value={tickerText}
                                onChange={(e) => setTickerText(e.target.value)}
                                className="pl-10 bg-background/50 border-border/50 focus-visible:ring-amber-500/50"
                            />
                        </div>
                    </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Resource Limits */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h4 className="text-sm font-extrabold uppercase tracking-widest text-primary flex items-center gap-2">
                            <Info className="h-4 w-4" /> Resource Limits
                        </h4>
                        <p className="text-xs text-muted-foreground">Configure storage and processing thresholds for migration operations</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Max Asset Archive Size (MB)</Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    value={maxAssetSizeMB}
                                    onChange={(e) => setMaxAssetSizeMB(parseInt(e.target.value) || 0)}
                                    className="bg-background/50 border-border/50 font-mono"
                                />
                                <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">MB ( {Math.round(maxAssetSizeMB / 1024 * 10) / 10} GB )</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-tight italic">
                                Limits the size of asset archives during backup/restore. High values may impact memory usage.
                            </p>
                        </div>
                    </div>
                </div>

                {message && (
                    <Alert className={cn(
                        "animate-in slide-in-from-bottom-2 transition-all duration-300",
                        message.type === 'success' ? "border-green-500/20 bg-green-500/5 text-green-500" : "border-destructive/20 bg-destructive/5 text-destructive"
                    )}>
                        {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        <AlertTitle className="capitalize font-bold">{message.type}</AlertTitle>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-end pt-4 border-t border-border/50">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 min-w-[140px]"
                    >
                        {saving ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="mr-2 h-4 w-4" /> Save Settings</>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
