import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Layers,
  Globe,
  Database,
  Terminal,
  ShieldCheck,
  Cpu,
  Zap,
  History,
  Search
} from "lucide-react";


const ContentfulOverview: React.FC = () => {
  return (
    <div className="space-y-10">
      <header className="space-y-2 border-l-4 border-primary pl-6">
        <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
          Contentful Infrastructure
        </h2>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Next-Generation Headless CMS Protocols</p>
      </header>

      <Card className="bg-card border-border/50 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
          <Globe className="h-32 w-32 text-primary" />
        </div>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-black uppercase tracking-tight">Decoupled Architecture</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            Contentful is a <strong className="text-primary">headless Content Management System (CMS)</strong> that provides
            a flexible API-first approach to content management. Unlike traditional monolithic platforms,
            Contentful separates content from presentation, allowing you to synchronize data across
            any platform or device with sub-millisecond precision.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-card border-border/50 border-l-primary/30 shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-black uppercase tracking-widest">Key Concepts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-4">
              {[
                { label: "Spaces", desc: "Top-level containers for your content" },
                { label: "Environments", desc: "Isolated iterations (master, dev, staging)" },
                { label: "Content Types", desc: "Strict data models defining schemas" },
                { label: "Entries", desc: "Individual records based on Types" },
                { label: "Assets", desc: "Binary media & document payloads" },
                { label: "Locales", desc: "Geospatial and language variations" }
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 group">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 group-hover:scale-150 transition-transform" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/90 block">{item.label}</span>
                    <span className="text-[11px] font-medium text-muted-foreground">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <div className="flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-black uppercase tracking-widest">Official Access</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Main Portal", url: "https://www.contentful.com/" },
                { label: "Core Documentation", url: "https://www.contentful.com/developers/docs/" },
                { label: "Management API", url: "https://www.contentful.com/developers/docs/references/content-management-api/" },
                { label: "CLI Repository", url: "https://www.contentful.com/developers/docs/tutorials/cli/" }
              ].map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/50 hover:bg-primary/10 hover:border-primary/20 transition-all group"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70 group-hover:text-primary transition-colors">{link.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/50 border-b-primary shadow-2xl overflow-hidden">
        <CardHeader className="p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            <CardTitle className="text-xl font-black uppercase tracking-tight">Application Interface</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <p className="text-sm text-foreground/70 leading-relaxed font-medium">
            The <strong className="text-foreground">Contentful Migration Tool</strong> is an industrial-grade interface
            designed to bypass complex CLI operations. It provides a secure bridge for:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <Database className="h-4 w-4" />, label: "Encrypted Backups" },
              { icon: <Zap className="h-4 w-4" />, label: "Rapid Migration" },
              { icon: <ShieldCheck className="h-4 w-4" />, label: "Safe Restoration" },
              { icon: <Search className="h-4 w-4" />, label: "Diff Analysis" },
              { icon: <History className="h-4 w-4" />, label: "Version Tracking" },
              { icon: <Terminal className="h-4 w-4" />, label: "Visual Builder" }
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50 group hover:border-border transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/80">{feat.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-medium italic opacity-60">
            * All operations are performed via the Contentful Management API and satisfy enterprise security protocols.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentfulOverview;
