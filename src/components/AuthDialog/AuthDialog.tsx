import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGlobalContext } from '@/context/GlobalContext';
import {
  Key,
  Lock,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Info
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from '@/utils/api';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

const AuthDialog = React.memo(({ open, onClose }: AuthDialogProps) => {
  const { dispatch } = useGlobalContext();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetAuthUrl = async () => {
    setLoading(true);
    try {
      const result = await api.post<{ authUrl: string }>('/api/contentful-auth-browser', {
        action: 'getAuthUrl'
      });

      if (result.success && result.data?.authUrl) {
        window.open(result.data.authUrl, '_blank');

        dispatch({
          type: "SET_STATUS",
          payload: "Please login in the opened Contentful window. After login, copy the token and paste it in the input field."
        });

        setShowTokenInput(true);
      } else {
        throw new Error(result.error || 'Failed to get auth URL');
      }
    } catch {
      dispatch({
        type: "SET_STATUS",
        payload: "Error getting auth URL. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = async () => {
    setLoading(true);
    try {
      const result = await api.post('/api/contentful-auth-browser', {
        action: 'saveToken',
        token
      });

      if (result.success) {
        // We verify auth status immediately
        const authCheck = await api.get<{ logged_in: boolean }>('/api/check-auth');

        if (authCheck.success && authCheck.data?.logged_in) {
          onClose();
          window.location.reload();
        }
      }
    } catch {
      // Error already handled by api utility globally or ignored here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-3xl border-primary/20 shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-8 bg-muted/40 border-b border-border/50 relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck className="h-24 w-24 text-primary" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
                Identity Verification
              </DialogTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Contentful Management API access required</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <Alert className="bg-primary/5 border-primary/10">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs font-medium text-foreground/80 leading-relaxed">
              You need to establish a secure connection with Contentful to utilize the high-speed migration engine.
            </AlertDescription>
          </Alert>

          {!showTokenInput ? (
            <div className="space-y-4">
              <Button
                onClick={handleGetAuthUrl}
                disabled={loading}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 gap-3 group"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Authorize Terminal
                    <ExternalLink className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </Button>
              <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
                Secure OAuth2 Handshake protocol
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                  <Key className="h-3 w-3" />
                  Access Token Authorization
                </label>
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token retrieved from Contentful..."
                  className="bg-muted/20 border-border/50 h-12 font-mono text-sm focus-visible:ring-primary/50"
                />
                <p className="text-[9px] font-medium text-muted-foreground italic px-1">
                  Token will be stored securely for session persistence.
                </p>
              </div>

              <Button
                onClick={handleSaveToken}
                disabled={!token.trim() || loading}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-emerald-500/20 gap-3"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Establish Connection'}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border/50 sm:justify-start">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 h-8"
          >
            Abort Protocol
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

AuthDialog.displayName = 'AuthDialog';

export default AuthDialog;
