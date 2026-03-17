import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Info,
  ChevronRight,
  Search,
  LifeBuoy,
  XCircle,
  Settings,
  Globe,
  ExternalLink
} from "lucide-react";

const ErrorHandling: React.FC = () => {
  const errorRegistry = [
    {
      error: "Field deletion constraint",
      cause: "Mandatory validation rules on Contentful side",
      solution: [
        "Open Contentful App → Content Model",
        "Select target content type and field",
        "Set field to 'Optional' in validation settings",
        "Execute field deletion protocol",
        "Retry migration"
      ],
      severity: 'error'
    },
    {
      error: "Schema Mismatch",
      cause: "Source content type structure does not match target",
      solution: [
        "Manually align target schema with source",
        "Or migrate content type first using Visual Builder",
        "Ensure IDs and validation rules match exactly"
      ],
      severity: 'warning'
    },
    {
      error: "Collision Detection",
      cause: "Unique constraint violation in target registry",
      solution: [
        "Locate duplicate entry ID in target environment",
        "Perform manual purging or ID re-mapping",
        "Remove child references if necessary",
        "Retry batch operation"
      ],
      severity: 'warning'
    },
    {
      error: "API Throttle engaged",
      cause: "Rate limit exceeded (Contentful internal quota)",
      solution: [
        "System will automatically initiate exponential backoff",
        "Wait 60-120 seconds for window reset",
        "CMT will resume transmission automatically"
      ],
      severity: 'info'
    },
    {
      error: "Locale Discrepancy",
      cause: "Required languages not initialized in target node",
      solution: [
        "Go to Settings → Locales in Contentful",
        "Enable target language codes",
        "Sync default locale mapping",
        "Initialize missing localized fields"
      ],
      severity: 'error'
    }
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-2 border-l-4 border-primary pl-6">
        <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
          Protocol Anomalies
        </h2>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Error resolution & fault management</p>
      </header>

      <div className="flex gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg shadow-lg shadow-primary/5 items-start">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Intelligence Engine</p>
          <p className="text-[11px] font-medium text-primary/80">
            Most anomalies are automatically intercepted. Review the system log modal for detailed resolution steps.
          </p>
        </div>
      </div>

      {/* Error Table */}
      <Card className="bg-card border-border/50 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Anomaly</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary Cause</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocol Solution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {errorRegistry.map((item, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors group">
                  <td className="p-4 align-top">
                    <div className="flex items-center gap-3">
                      {item.severity === 'error' && <XCircle className="h-4 w-4 text-rose-500" />}
                      {item.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      {item.severity === 'info' && <Info className="h-4 w-4 text-primary" />}
                      <span className="text-[11px] font-black uppercase tracking-tight text-foreground/90 group-hover:text-foreground">{item.error}</span>
                    </div>
                  </td>
                  <td className="p-4 align-top text-[11px] font-medium text-muted-foreground leading-relaxed max-w-[200px]">
                    {item.cause}
                  </td>
                  <td className="p-4 align-top">
                    <ul className="space-y-1.5 list-none">
                      {item.solution.map((step, si) => (
                        <li key={si} className="flex items-start gap-2 text-[10px] font-medium text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">
                          <ChevronRight className="h-2.5 w-2.5 mt-0.5 shrink-0 text-primary/40" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
          <Search className="h-3 w-3" />
          Structural Fault Diagnostics
        </h3>

        <Accordion type="multiple" className="space-y-3">
          <AccordionItem value="content-model" className="border-border/50 bg-card rounded-xl px-4 overflow-hidden shadow-xl">
            <AccordionTrigger className="hover:no-underline py-5 group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                  <Settings className="h-5 w-5" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-foreground/80">Architectural Deviations</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 pl-14">
              <div className="space-y-4 pr-4">
                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                  Incompatibility between source and target schema graphs will trigger validation locks.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/20 transition-all">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Protocol α: Manual Alignment</h5>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Manually adjust target Content Model parameters via Web UI to match source manifest exactly.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/20 transition-all">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Protocol β: Total Reset</h5>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Purge existing target entries and schema, then re-initialize from scratch via restore command.</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="auth" className="border-border/50 bg-card rounded-xl px-4 overflow-hidden shadow-xl">
            <AccordionTrigger className="hover:no-underline py-5 group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                  <Globe className="h-5 w-5" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-foreground/80">Identity Faults</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 pl-14">
              <ul className="space-y-3 pr-4">
                {[
                  "Invoke 'Identity Verification' to clear stale OAuth2 cookies",
                  "Verify .env configuration for static Management Tokens",
                  "Audit space-level permissions for the authenticated profile",
                  "Ensure encryption keys match between local CMT and remote API"
                ].map((auth, i) => (
                  <li key={i} className="text-[11px] font-medium text-muted-foreground flex items-center gap-3">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    {auth}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <Card className="bg-card border-border/50 border-b-primary shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <LifeBuoy className="h-24 w-24 text-primary" />
        </div>
        <CardHeader>
          <div className="flex items-center gap-3">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-black uppercase tracking-widest">Support Interface</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[11px] font-medium text-muted-foreground leading-relaxed max-w-2xl">
            If persistent faults persist beyond automated protocols, consult the Contentful API logs or
            verify network stability. Critical failures should be directed to the workspace administrator.
          </p>
          <div className="flex gap-4">
            <a href="https://www.contentful.com/developers/docs/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
              Developer Docs <ExternalLink className="h-3 w-3" />
            </a>
            <a href="#" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
              Submit Log Manifest <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorHandling;
