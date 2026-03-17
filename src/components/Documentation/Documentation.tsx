
import React from 'react';
import {
    Tabs,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocumentationTabs, TabIndex } from '@/hooks/useDocumentationTabs';

// Component Imports
import ContentfulOverview from './ContentfulOverview';
import CLIInstallation from './CLIInstallation';
import HowItWorks from './HowItWorks';
import OperationModes from './OperationModes';
import ErrorHandling from './ErrorHandling';
import ProductionWarning from './ProductionWarning';
import CreateBackupDoc from './CreateBackupDoc';
import RestoreBackupDoc from './RestoreBackupDoc';
import SmartMigrateDoc from './SmartMigrateDoc';
import SmartRestoreDoc from './SmartRestoreDoc';
import VisualBuilderDoc from './VisualBuilderDoc';
import ViewsMigrateDoc from './ViewsMigrateDoc';
import BackupsDoc from './BackupsDoc';
import ContentfulTokenDoc from './ContentfulTokenDoc';

// Icons
import {
    Wand2,
    Hammer,
    Layout,
    History,
    Zap,
    Database,
    AlertTriangle,
    BookOpen,
    Terminal,
    Key,
    Sparkles
} from "lucide-react";


const Documentation: React.FC = () => {
    const { tabIndex, handleTabChange } = useDocumentationTabs(TabIndex.OVERVIEW);

    const navItems = [
        { value: TabIndex.OVERVIEW, icon: <BookOpen className="h-4 w-4" />, label: "Overview" },
        { value: TabIndex.CLI_INSTALLATION, icon: <Terminal className="h-4 w-4" />, label: "CLI Installation" },
        { value: TabIndex.COMMAND_LINE, icon: <Zap className="h-4 w-4" />, label: "Command Line" },
        { value: TabIndex.CONTENTFUL_TOKEN, icon: <Key className="h-4 w-4" />, label: "Access Tokens" },
        { value: TabIndex.ERRORS_SOLUTIONS, icon: <AlertTriangle className="h-4 w-4" />, label: "Error Protocols" },
    ];

    const featureItems = [
        { value: TabIndex.CREATE_BACKUP, icon: <Database className="h-4 w-4" />, label: "Create Backup" },
        { value: TabIndex.RESTORE_BACKUP, icon: <Database className="h-4 w-4" />, label: "Restore Backup" },
        { value: TabIndex.SMART_RESTORE, icon: <Sparkles className="h-4 w-4" />, label: "Smart Restore" },
        { value: TabIndex.SMART_MIGRATE, icon: <Wand2 className="h-4 w-4" />, label: "Smart Migrate" },
        { value: TabIndex.VISUAL_BUILDER, icon: <Hammer className="h-4 w-4" />, label: "Visual Builder" },
        { value: TabIndex.VIEWS_MIGRATE, icon: <Layout className="h-4 w-4" />, label: "Views Migrate" },
        { value: TabIndex.BACKUPS, icon: <History className="h-4 w-4" />, label: "Backups History" },
    ];

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl">
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">
                        Intelligence Center
                    </h1>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] ml-14">Operational Manual & System Documentation</p>
            </header>

            <Tabs
                value={String(tabIndex)}
                onValueChange={(val) => handleTabChange(null, Number(val))}
                className="flex flex-col md:flex-row gap-8"
            >
                {/* Sidebar Navigation */}
                <Card className="w-full md:w-72 shrink-0 h-fit bg-card border-border/50 shadow-2xl overflow-hidden">
                    <TabsList className="flex flex-col h-auto bg-transparent p-2 gap-1 items-stretch">
                        <div className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                            Core Systems
                        </div>
                        {navItems.map((item) => (
                            <TabsTrigger
                                key={item.value}
                                value={String(item.value)}
                                className="justify-start px-4 h-11 text-[11px] font-bold uppercase tracking-widest gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-lg hover:bg-muted/20"
                            >
                                {item.icon}
                                {item.label}
                            </TabsTrigger>
                        ))}

                        <div className="px-3 pt-6 pb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                            Module Protocols
                        </div>
                        {featureItems.map((item) => (
                            <TabsTrigger
                                key={item.value}
                                value={String(item.value)}
                                className="justify-start px-4 h-11 text-[11px] font-bold uppercase tracking-widest gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all rounded-lg hover:bg-muted/20"
                            >
                                {item.icon}
                                {item.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Card>

                {/* Content Area */}
                <main className="flex-1 min-w-0">
                    <ScrollArea className="h-[calc(100vh-250px)] pr-4 -mr-4">
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            {tabIndex === TabIndex.OVERVIEW && (
                                <div className="space-y-12">
                                    <ContentfulOverview />
                                    <div className="pt-8 border-t border-border/50">
                                        <HowItWorks />
                                    </div>
                                </div>
                            )}

                            {tabIndex === TabIndex.CLI_INSTALLATION && <CLIInstallation />}
                            {tabIndex === TabIndex.COMMAND_LINE && <OperationModes />}
                            {tabIndex === TabIndex.CONTENTFUL_TOKEN && <ContentfulTokenDoc />}

                            {tabIndex === TabIndex.ERRORS_SOLUTIONS && (
                                <div className="space-y-12">
                                    <ErrorHandling />
                                    <div className="pt-8 border-t border-border/50">
                                        <ProductionWarning />
                                    </div>
                                </div>
                            )}

                            {tabIndex === TabIndex.CREATE_BACKUP && <CreateBackupDoc />}
                            {tabIndex === TabIndex.RESTORE_BACKUP && <RestoreBackupDoc />}
                            {tabIndex === TabIndex.SMART_RESTORE && <SmartRestoreDoc />}
                            {tabIndex === TabIndex.SMART_MIGRATE && <SmartMigrateDoc />}
                            {tabIndex === TabIndex.VISUAL_BUILDER && <VisualBuilderDoc />}
                            {tabIndex === TabIndex.VIEWS_MIGRATE && <ViewsMigrateDoc />}
                            {tabIndex === TabIndex.BACKUPS && <BackupsDoc />}
                        </div>
                    </ScrollArea>
                </main>
            </Tabs>
        </div>
    );
};

export default Documentation;
