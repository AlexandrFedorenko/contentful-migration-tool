import React from 'react';

import { ShieldCheck } from "lucide-react";

// Logout button is now in AppHeader, this component just shows auth status
const LoggedInView = React.memo(() => {
    return (
        <div className="flex flex-col items-center mb-6 py-2 px-4 rounded-full bg-emerald-500/5 border border-emerald-500/10 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">
                    Neural Link: <strong className="text-emerald-500 uppercase tracking-tighter">Established</strong>
                </span>
            </div>
        </div>
    );
});

LoggedInView.displayName = 'LoggedInView';

export default LoggedInView;
