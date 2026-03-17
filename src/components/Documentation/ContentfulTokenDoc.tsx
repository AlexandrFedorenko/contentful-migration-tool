import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

import {
    Lock,
    ShieldCheck,
    ExternalLink,
    Database,
    Fingerprint,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";

const ContentfulTokenDoc: React.FC = () => {
    return (
        <div className="space-y-12">
            <header className="space-y-2 border-l-4 border-primary pl-6">
                <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
                    Credential Injection
                </h2>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">CMA Token generation & secure authorization</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {[
                    {
                        title: "1. Registry Accessibility",
                        desc: "Navigate to the official Contentful App. Enter 'Settings' → 'CMA tokens' (Personal Access Tokens).",
                        link: "https://app.contentful.com"
                    },
                    {
                        title: "2. Key Generation",
                        desc: "Initiate 'Generate personal token'. Assign a unique identifier (e.g., 'CMT_NODE_01') for audit tracking."
                    },
                    {
                        title: "3. Manifest Serialization",
                        desc: "Copy the primary key immediately. This hash is displayed once for security isolation. Inject it into the CMT 'Profile' terminal.",
                        critical: true
                    },
                    {
                        title: "4. Node Activation",
                        desc: "Commit the token to established local storage. The system will perform an automated handshake to verify API permissions."
                    }
                ].map((item, i) => (
                    <Card key={i} className={cn("bg-card border-border/50 shadow-xl transition-all group", item.critical && "border-rose-500/30")}>
                        <CardContent className="p-6">
                            <div className="flex gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg items-start">
                                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-2 px-2">
                                    <h4 className={cn("text-xs font-black uppercase tracking-widest", item.critical ? "text-rose-500" : "text-primary")}>
                                        {item.title}
                                    </h4>
                                    <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                        {item.desc}
                                    </p>
                                    {item.link && (
                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary hover:underline">
                                            Contentful Dashboard <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
                    <Fingerprint className="h-3 w-3" />
                    Authorization Utility
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: <ShieldCheck className="h-5 w-5" />, title: "Secure Handshake", desc: "Enables encrypted communication between CMT and the Contentful Management API." },
                        { icon: <Database className="h-5 w-5" />, title: "Registry Access", desc: "Required for environment mirroring, backup generation, and structural forge operations." },
                        { icon: <Lock className="h-5 w-5" />, title: "Identity Isolation", desc: "Tokens are encrypted at rest within your local profile, ensuring multi-tenant security." }
                    ].map((item, i) => (
                        <Card key={i} className="bg-card border-border/50 p-6 space-y-3 group hover:border-primary/20 transition-all">
                            <div className="flex gap-3 p-3 bg-muted/30 border border-border/50 rounded-lg items-start">
                                <Info className="h-4 w-4 text-primary opacity-60 shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-2 px-2">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground/90">{item.title}</h5>
                                    <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 p-3 bg-muted/30 border border-border/50 rounded-lg items-start">
                <Info className="h-4 w-4 text-primary opacity-60 shrink-0 mt-0.5" />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Protocol Activation</p>
                    <p className="text-[11px] font-medium text-primary/80">
                        Once the token is committed and authorized, all core migration modules, space selection registries,
                        and operational protocols will be unlocked for this session.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ContentfulTokenDoc;
