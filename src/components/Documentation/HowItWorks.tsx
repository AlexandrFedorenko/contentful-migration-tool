import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trash2 as DeleteIcon,
  BarChart3 as AnalyticsIcon,
  Hammer as BuildIcon,
  CheckCircle2,
  ShieldAlert,
  Rocket,
  Settings,
  Maximize2,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const StepItem = ({ number, title, content, isActive = true }: { number: number, title: string, content: React.ReactNode, isActive?: boolean }) => (
  <div className="flex gap-4 relative pb-8 last:pb-0">
    <div className="flex flex-col items-center shrink-0">
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-500",
        isActive ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-muted/10 border-border/50 text-muted-foreground"
      )}>
        {number}
      </div>
      <div className="w-[1px] h-full bg-border/50 mt-2" />
    </div>
    <div className="pt-1 flex-1">
      <h4 className="text-sm font-black uppercase tracking-tight text-foreground mb-2">{title}</h4>
      <div className="text-[11px] font-medium text-muted-foreground leading-relaxed">
        {content}
      </div>
    </div>
  </div>
);

const HowItWorks: React.FC = () => {
  return (
    <div className="space-y-12">
      <header className="space-y-2 border-l-4 border-primary pl-6">
        <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
          Operational Protocols
        </h2>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Interface engagement & methodology</p>
      </header>

      <Card className="bg-card border-border/50 shadow-2xl overflow-hidden group">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-black uppercase tracking-widest">Global Initialization</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            This application provides a unified interface for complex Contentful management maneuvers.
            By leveraging the high-speed Management API, we eliminate the friction of CLI dependency
            while maintaining absolute structural integrity.
          </p>
        </CardContent>
      </Card>

      {/* Creating a Backup */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-widest text-foreground">Backup Generation</h3>
        </div>

        <Card className="bg-card border-border/50 shadow-xl">
          <CardContent className="p-8">
            <div className="space-y-0">
              <StepItem
                number={1}
                title="Authenticate"
                content="Invoke the 'Login to Contentful' protocol and establish a secure OAuth2 session."
              />
              <StepItem
                number={2}
                title="Define Scope"
                content="Select the target Contentful space from the centralized registry."
              />
              <StepItem
                number={3}
                title="Target Environment"
                content="Designate the source environment (e.g., 'master', 'production') for snapshotting."
              />
              <StepItem
                number={4}
                title="Execute Injection"
                content={
                  <span>
                    Trigger 'Backup Source'. The manifest will be serialized and stored within the <code className="text-primary font-mono bg-primary/5 px-1 rounded">backups/{'{space_id}'}/</code> archival vault.
                  </span>
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deleting a Backup */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <DeleteIcon className="h-4 w-4 text-rose-500" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-widest text-foreground text-rose-500">Resource Deallocation</h3>
        </div>

        <Card className="bg-card border-border/50 shadow-xl">
          <CardContent className="p-8">
            <ul className="space-y-4 text-[11px] font-medium text-muted-foreground list-decimal pl-4">
              <li>Navigate to the 'Archive Terminal' (Backups section)</li>
              <li>Locate the target manifest in the serialized registry</li>
              <li>Invoke the 'Purge' protocol for that specific resource</li>
              <li>Confirm permanent deletion through the secondary validation prompt</li>
            </ul>
            <div className="flex gap-3 p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg items-start mt-8">
              <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Irreversible Operation</p>
                <p className="text-[11px] font-medium text-rose-500/80">
                  Purged manifests are permanently removed from the local secure storage and cannot be recovered.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Migration */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <AnalyticsIcon className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-widest text-foreground text-emerald-500">Neural Sync (Smart Migration)</h3>
        </div>

        <Card className="bg-card border-border/50 shadow-xl overflow-hidden border-l-4 border-l-emerald-500/50">
          <CardContent className="p-8">
            <div className="space-y-0">
              <StepItem
                number={1}
                title="Environment Mapping"
                content="Define the source and target nodes within the sync matrix."
              />
              <StepItem
                number={2}
                title="Diff Analysis"
                content={
                  <div className="space-y-3">
                    <p>Execute 'SCAN DIFFERENCES' to generate a delta map:</p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black border border-emerald-500/20">NEW</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-black border border-amber-500/20">MODIFIED</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[8px] font-black border border-rose-500/20">DELETED</span>
                    </div>
                  </div>
                }
              />
              <StepItem
                number={3}
                title="Filter Criteria"
                content="Narrow sync scope by title, content type, metadata, and specific language locales."
              />
              <StepItem
                number={4}
                title="Delta Execution"
                content="Initiate 'MIGRATE SELECTED'. The system automatically resolves dependencies and pushes the payload."
              />
            </div>

            <div className="flex gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg items-start mt-8">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Intelligent Dependency Engine</p>
                <p className="text-[11px] font-medium text-emerald-500/80">
                  Our engine recursively detects required content types and dependencies, ensuring zero-fault deployments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Builder */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <BuildIcon className="h-4 w-4 text-amber-500" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-widest text-foreground text-amber-500">Blueprint Engine (Visual Migration)</h3>
        </div>

        <Card className="bg-card border-border/50 shadow-xl">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Maximize2 className="h-5 w-5" />, title: "Design Schema", desc: "Drag & drop components to build complex migration logic visually." },
                { icon: <Settings className="h-5 w-5" />, title: "Logic Injection", desc: "Apply transformation templates and SEO metadata patterns instantly." },
                { icon: <Rocket className="h-5 w-5" />, title: "Automated Build", desc: "System auto-generates JS scripts and executes them immediately." }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-amber-500/20 transition-all group">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground mb-2">{item.title}</h4>
                  <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HowItWorks;
