import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Database,
  CheckCircle2,
  History,
  FlaskConical,
  Zap,
  ClipboardCheck,
  Lock
} from "lucide-react";

const ProtocolStep = ({ number, title, content }: { number: number, title: string, content: React.ReactNode }) => (
  <div className="flex gap-4 relative pb-8 last:pb-0">
    <div className="flex flex-col items-center shrink-0">
      <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-500 shadow-lg shadow-amber-500/10">
        {number}
      </div>
      <div className="w-[1px] h-full bg-border/50 mt-2" />
    </div>
    <div className="pt-1 flex-1">
      <h4 className="text-sm font-black uppercase tracking-tight text-foreground mb-2">{title}</h4>
      <div className="text-[11px] font-medium text-muted-foreground leading-relaxed italic">
        {content}
      </div>
    </div>
  </div>
);

const ProductionWarning: React.FC = () => {
  return (
    <div className="space-y-12">
      <header className="space-y-2 border-l-4 border-rose-500 pl-6">
        <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
          Critical Safeguards
        </h2>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Production integrity & operational risk</p>
      </header>

      <div className="flex gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg shadow-xl shadow-amber-500/5 overflow-hidden relative items-start">
        <div className="absolute -top-4 -right-4 opacity-5">
          <FlaskConical className="h-24 w-24 text-amber-500" />
        </div>
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Beta Deployment Notice</p>
          <p className="text-sm font-medium text-foreground/80 leading-relaxed max-w-2xl">
            This terminal is currently in <strong className="text-amber-500">Alpha-Beta phase</strong>.
            While engineering strives for absolute stability, caution is mandatory.
            Exercise clinical precision during production-level write operations.
          </p>
        </div>
      </div>

      <Card className="bg-rose-500/10 border-rose-500/20 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <ShieldAlert className="h-32 w-32 text-rose-500" />
        </div>
        <CardHeader className="p-8 border-b border-rose-500/10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
              <ShieldAlert className="h-6 w-6 text-rose-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight text-rose-500">
                Mandate: Archival Priming
              </CardTitle>
              <p className="text-[10px] font-bold text-rose-500/60 uppercase tracking-[0.2em] mt-1">Zero-Recovery Environment Protection</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            Before initiating <strong>any</strong> destructive payload or structural re-alignment on
            production infrastructures, you <strong>must</strong> execute a full state snapshot.
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            Production registries utilize immutable IDs; accidental corruption cannot be reversed without
            valid manifest files. Verify local storage integrity before engagement.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pre-Production Checklist */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
            <ClipboardCheck className="h-3 w-3" />
            Engagement Checklist
          </h3>
          <Card className="bg-card border-border/50 shadow-xl">
            <CardContent className="p-8">
              <div className="space-y-0">
                <ProtocolStep
                  number={1}
                  title="Vault Validation"
                  content={
                    <span>Verify <code className="text-primary">backups/{'{space_id}'}/</code> directory accessibility.</span>
                  }
                />
                <ProtocolStep
                  number={2}
                  title="Fresh Snapshot"
                  content="Generate a T-minus zero backup immediately before execution."
                />
                <ProtocolStep
                  number={3}
                  title="Heuristic Verification"
                  content="Confirm manifest size is non-zero and timestamp is synchronized."
                />
                <ProtocolStep
                  number={4}
                  title="Sandbox Simulation"
                  content="Validate logic on a development/staging node before production push."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Best Practices */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
            <ShieldCheck className="h-3 w-3" />
            Operational Doctrine
          </h3>
          <Card className="bg-card border-border/50 border-l-primary/30 shadow-xl h-full">
            <CardContent className="p-8 space-y-6">
              {[
                { icon: <History className="h-4 w-4" />, label: "Pre-Restore archival is mandatory", desc: "Backup the current target state before injecting external manifests." },
                { icon: <Database className="h-4 w-4" />, label: "Multi-Version retention", desc: "Retain at least 3 historical snapshots to ensure rollback capability." },
                { icon: <Lock className="h-4 w-4" />, label: "Target node validation", desc: "Double-check Environment ID matches intended deployment target." },
                { icon: <Zap className="h-4 w-4" />, label: "Protocol Monitoring", desc: "Observe terminal logs throughout the entire data transmission phase." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground/90 mb-1">{item.label}</h5>
                    <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rollback Plan */}
      <Card className="bg-card border-border/50 border-b-rose-500 shadow-2xl overflow-hidden">
        <CardHeader className="p-6 bg-rose-500/5">
          <CardTitle className="text-lg font-black uppercase tracking-tight text-rose-500">
            Emergency Rollback Protocol
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground opacity-60">Immediate Response:</h5>
              <ol className="space-y-3 list-decimal pl-4">
                {["Terminate all active IO/Sync immediately.", "Audit error modal for failure signature.", "Locate the pre-deployment snapshot.", "Initiate 'Restore Mode' on protected node."].map((step, i) => (
                  <li key={i} className="text-[11px] font-medium text-muted-foreground">{step}</li>
                ))}
              </ol>
            </div>
            <div className="space-y-4 border-l border-border/50 pl-8">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground opacity-60">Status Verification:</h5>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground italic">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Review terminal output for 'SYNC COMPLETED'
                </div>
                <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground italic">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Re-scan via 'Diff Analysis' tool
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionWarning;
