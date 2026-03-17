import React from 'react';
import { Loader2, Database } from "lucide-react";
import Image from "next/image";

interface ContentfulLoaderProps {
  message?: string;
}

const ContentfulLoader = React.memo<ContentfulLoaderProps>(({ message = 'Synchronizing...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center">
        {/* Animated Background Pulse */}
        <div className="absolute inset-0 blur-3xl bg-primary/10 rounded-full animate-pulse scale-150" />

        {/* Core Logo Container */}
        <div className="relative h-40 w-40 flex items-center justify-center">
          {/* Base Gray Logo */}
          {/* Base Gray Logo */}
          <Image
            src="/contentful-logo-gray.svg"
            alt="Contentful Logo"
            fill
            className="absolute inset-0 object-contain opacity-10 grayscale"
          />

          {/* Animated Color Logo */}
          <Image
            src="/contentful-logo-color.svg"
            alt="Contentful Logo"
            fill
            className="absolute inset-0 object-contain animate-pulse z-10"
          />

          {/* Neural Circle Spinner */}
          <div className="absolute inset-[-10px] rounded-full border border-primary/20 border-t-primary animate-spin duration-[3000ms]" />
          <div className="absolute inset-[-4px] rounded-full border border-border/50 border-b-primary/40 animate-spin duration-[5000ms] reverse" />
        </div>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3 w-3 text-primary animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/80">
            {message}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">
          <Database className="h-2 w-2" /> Neural Link Active
        </div>
      </div>
    </div>
  );
});

ContentfulLoader.displayName = 'ContentfulLoader';

export default ContentfulLoader;