import React from 'react';
import { CheckCircle2, Package, FileCode, Landmark, Globe } from "lucide-react";

interface SuccessSummaryProps {
  importedEntities: {
    contentTypes?: number;
    entries?: number;
    assets?: number;
    locales?: number;
  };
}

const SuccessSummary = React.memo<SuccessSummaryProps>(({ importedEntities }) => {
  const stats = [
    { label: 'Schemas', value: importedEntities.contentTypes || 0, icon: <Package className="h-3 w-3" /> },
    { label: 'Entries', value: importedEntities.entries || 0, icon: <FileCode className="h-3 w-3" /> },
    { label: 'Assets', value: importedEntities.assets || 0, icon: <Landmark className="h-3 w-3" /> },
    { label: 'Locales', value: importedEntities.locales || 0, icon: <Globe className="h-3 w-3" /> },
  ];

  return (
    <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Successful Synchronizations</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="space-y-1">
            <div className="flex items-center gap-1.5 opacity-40">
              {stat.icon}
              <span className="text-[9px] font-bold uppercase tracking-tighter">{stat.label}</span>
            </div>
            <p className="text-lg font-mono font-bold text-emerald-400 leading-none">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

SuccessSummary.displayName = 'SuccessSummary';

export default SuccessSummary;
