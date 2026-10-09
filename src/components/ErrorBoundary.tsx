import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught application error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-strong rounded-3xl p-6 sm:p-8 border border-white/10 text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Đã xảy ra sự cố</h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
                Ứng dụng gặp lỗi ngoài dự kiến. Bạn có thể tải lại trang hoặc khôi phục lại dữ liệu mặc định.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-left font-mono text-[11px] text-rose-400/90 max-h-28 overflow-y-auto break-all">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 gradient-accent rounded-xl text-xs sm:text-sm text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> Tải lại trang
              </button>
              
              <button
                type="button"
                onClick={this.handleResetCache}
                className="py-2.5 px-4 glass border border-white/10 rounded-xl text-xs sm:text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition flex items-center justify-center gap-2 active:scale-95"
                title="Khôi phục mặc định"
              >
                <Trash2 className="w-4 h-4 text-rose-400" /> Xóa bộ nhớ đệm
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
