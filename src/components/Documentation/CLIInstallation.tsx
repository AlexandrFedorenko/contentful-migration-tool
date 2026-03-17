import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Terminal,
  Apple,
  Monitor,
  Cpu,
  Zap,
  Copy,
  ExternalLink
} from "lucide-react";


const CodeBlock = ({ children, label }: { children: string, label?: string }) => (
  <div className="relative group mt-4">
    {label && (
      <div className="absolute top-0 right-1 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-primary/40 group-hover:text-primary/70 transition-colors">
        {label}
      </div>
    )}
    <pre className="p-4 rounded-xl bg-muted/60 border border-border/50 font-mono text-xs leading-relaxed overflow-x-auto text-emerald-400 shadow-inner">
      {children.trim()}
    </pre>
    <button className="absolute bottom-2 right-2 p-1.5 rounded-md bg-muted/20 border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/30 active:scale-95">
      <Copy className="h-3 w-3 text-muted-foreground" />
    </button>
  </div>
);

const CLIInstallation: React.FC = () => {
  return (
    <div className="space-y-12">
      <header className="space-y-2 border-l-4 border-primary pl-6">
        <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
          CLI Integration
        </h2>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Lower-level terminal protocols</p>
      </header>

      <Card className="bg-card border-border/50 border-l-primary/30 shadow-2xl overflow-hidden group">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-black uppercase tracking-widest">Rapid Deployment</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-4">
          <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
            The Contentful CLI is the backbone of advanced migration maneuvers. Deployment is performed via the Node Package Manager:
          </p>
          <CodeBlock label="BASH / POWERSHELL">
            npm install -g contentful-cli
          </CodeBlock>
          <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 italic">
            * Essential for full-environment mirroring and high-volume archival.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
          <Cpu className="h-3 w-3" />
          OS-Specific Handshakes
        </h3>

        <Accordion type="multiple" className="space-y-3">
          {/* Windows */}
          <AccordionItem value="windows" className="border-border/50 bg-card rounded-xl px-4 overflow-hidden shadow-xl">
            <AccordionTrigger className="hover:no-underline py-5 group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Monitor className="h-5 w-5" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-foreground/80">Windows Subsystem</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 pl-14 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-primary">Pre-run Config:</h5>
                  <ul className="space-y-2">
                    {[
                      "Node.js v18.0+ LTSC",
                      "NPM Registry Access",
                      "Elevated PowerShell Privileges"
                    ].map((req, i) => (
                      <li key={i} className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                        <div className="h-1 w-1 rounded-full bg-primary" /> {req}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-primary">Verification:</h5>
                  <CodeBlock label="PS1">contentful --version</CodeBlock>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* macOS */}
          <AccordionItem value="auth" className="border-border/50 bg-card rounded-xl px-4 overflow-hidden shadow-xl">
            <AccordionTrigger className="hover:no-underline py-5 group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted/20 flex items-center justify-center text-foreground border border-border/50 group-hover:bg-muted group-hover:text-foreground transition-all">
                  <Apple className="h-5 w-5" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-foreground/80">Authentication</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 pl-14 space-y-6">
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed max-w-lg">
                Standard installation via ZSH or Bash. Use <code className="text-rose-500">sudo</code> only if
                global node directories are restricted.
              </p>
              <CodeBlock label="ZSH">
                {`# Standard Deployment
npm install -g contentful-cli

# Elevated Privileges (if required)
sudo npm install -g contentful-cli`}
              </CodeBlock>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <Card className="bg-card border-border/50 border-b-primary shadow-2xl overflow-hidden">
        <CardHeader className="p-6 bg-muted/20 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-black uppercase tracking-widest">Global Commands</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <CodeBlock>
            {`# Identity Sync
contentful login

# Registry Mapping
contentful space list

# Archive Protocol (Export)
contentful space export --space-id {ID} --environment-id master

# Injection Protocol (Import)
contentful space import --space-id {ID} --environment-id target`}
          </CodeBlock>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-4 pt-4">
        {[
          { label: "Installation Guide", url: "https://www.contentful.com/developers/docs/tutorials/cli/installation/" },
          { label: "CLI Source Code", url: "https://github.com/contentful/contentful-cli" },
          { label: "Sync Protocols", url: "https://www.contentful.com/developers/docs/tutorials/cli/import-and-export/" }
        ].map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 group px-4 py-2 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/20 transition-all"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{link.label}</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary opacity-30 group-hover:opacity-100 transition-all" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default CLIInstallation;
