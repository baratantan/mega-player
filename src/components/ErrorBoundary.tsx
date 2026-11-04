import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { errorLogService } from '../services/errorLogService';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    
    // Log to errorLogService for diagnostic modal
    errorLogService.logJsError({
      message: error.message || 'React Render Crash',
      stack: `${error.stack || ''}\n${errorInfo.componentStack || ''}`,
      source: 'ErrorBoundary',
    });

    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetToDefault = () => {
    try {
      localStorage.removeItem('iptv_player_active_profile_id_v2');
      localStorage.removeItem('iptv_player_profiles_v2');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-rose-500/30 backdrop-blur-2xl shadow-2xl flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-lg shadow-rose-950/50">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">
                {this.props.fallbackTitle || 'حدث خطأ في تحميل هذه الواجهة'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                تم التقاط الخطأ وحفظه في سجل التشخيص لمنع تجمّد التطبيق. يمكنك إعادة المحاولة أو استعادة الباقة الافتراضية.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="w-full p-3 rounded-xl bg-black/60 border border-white/5 text-[11px] font-mono text-rose-300 text-start break-all max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col w-full gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة تحديث الصفحة</span>
              </button>

              <button
                onClick={this.handleResetToDefault}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>استعادة الباقة الافتراضية (Cinema Pro)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
