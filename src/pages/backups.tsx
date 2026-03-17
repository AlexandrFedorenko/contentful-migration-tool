import React, { useEffect } from 'react';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Database,
    History,
    Loader2
} from "lucide-react";
import SpaceSelector from '@/components/SpaceSelector/SpaceSelector';
import BackupList from '@/components/BackupList/BackupList';
import { useGlobalContext } from '@/context/GlobalContext';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useBackups } from '@/hooks/useBackups';

import { PageHelp } from '@/components/PageHelp/PageHelp';
import { TabIndex } from '@/hooks/useDocumentationTabs';


export default function BackupsPage() {
    const { state } = useGlobalContext();
    const { loadEnvironments } = useEnvironments();
    const { loadBackups } = useBackups();


    useEffect(() => {
        if (state.spaceId) {
            loadEnvironments(state.spaceId);
            loadBackups(state.spaceId);
        }
    }, [state.spaceId, loadEnvironments, loadBackups]);

    return (
        <div className="max-w-7xl mx-auto py-8 px-6 space-y-8 animate-in fade-in duration-500">
            <Head>
                <title>Backups | Contentful CMT</title>
            </Head>

            {/* Header */}
            <header className="mb-8 space-y-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Backups History
                    </h1>
                    <PageHelp
                        description="Manage your local backup library. View details, download JSON files, or delete old backups to free up space."
                        docTab={TabIndex.BACKUPS}
                    />
                </div>
                <p className="text-base text-muted-foreground">
                    View, manage, and interact with your historical data records
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Space Selection Card */}
                <Card className="col-span-1 lg:col-span-4 border border-border/60 bg-card shadow-sm self-start">
                    <CardHeader className="py-4 px-6 border-b border-border/50 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base font-semibold text-foreground/90">Select Space</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <SpaceSelector />
                    </CardContent>
                </Card>

                {/* Backups List Card */}
                <div className="col-span-1 lg:col-span-8">
                    {state.spaceId ? (
                        <Card className="border border-border/60 bg-card shadow-sm min-h-[500px]">
                            <CardHeader className="py-4 px-6 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <History className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-base font-semibold text-foreground/90">Archives List</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <BackupList
                                    selectedBackupForRestore={null}
                                    onBackupSelect={() => { }}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border border-border/60 bg-card shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center p-12 space-y-6">
                            <div className="p-4 rounded-full bg-primary/10">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">Waiting for Space Selection</h3>
                                <p className="text-base text-muted-foreground">Select a target space to access historical records</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
