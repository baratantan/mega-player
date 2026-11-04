/**
 * Error Logging Service
 * Captures JavaScript errors, unhandled rejections, network failures,
 * and Video Player playback errors with channel URLs and error codes.
 */

export type ErrorType = 'javascript' | 'network' | 'player';

export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  timeFormatted: string;
  type: ErrorType;
  message: string;
  url?: string;
  channelName?: string;
  errorCode?: string | number;
  details?: string;
  stack?: string;
}

const STORAGE_KEY = 'iptv_cinema_error_logs_v1';
const MAX_LOGS = 100;

class ErrorLogService {
  private logs: ErrorLogEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private initialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load error logs from localStorage', e);
      this.logs = [];
    }
  }

  private saveTimer: any = null;
  private saveToStorage() {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(0, MAX_LOGS)));
      } catch (e) {
        console.warn('Failed to save error logs to localStorage', e);
      }
    }, 1000);
  }

  private notifyTimer: any = null;
  private notify() {
    if (this.notifyTimer) return;
    this.notifyTimer = setTimeout(() => {
      this.notifyTimer = null;
      this.listeners.forEach(cb => {
        try {
          cb();
        } catch (err) {
          console.error('Error in error log subscriber', err);
        }
      });
    }, 250);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  public getCount(): number {
    return this.logs.length;
  }

  public addLog(entry: {
    type: ErrorType;
    message: string;
    url?: string;
    channelName?: string;
    errorCode?: string | number;
    details?: string;
    stack?: string;
  }): ErrorLogEntry {
    const now = new Date();
    const timeFormatted = `${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ${now.toLocaleDateString()}`;

    // Prevent identical rapid log flooding (e.g. repeated loop ticks within 1.5 seconds)
    const last = this.logs[0];
    if (
      last &&
      last.type === entry.type &&
      last.message === entry.message &&
      last.url === entry.url &&
      Date.now() - last.timestamp < 1500
    ) {
      return last;
    }

    const newLog: ErrorLogEntry = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      timeFormatted,
      type: entry.type,
      message: entry.message || 'Unknown Error',
      url: entry.url,
      channelName: entry.channelName,
      errorCode: entry.errorCode,
      details: entry.details,
      stack: entry.stack,
    };

    this.logs = [newLog, ...this.logs].slice(0, MAX_LOGS);
    this.saveToStorage();
    this.notify();
    return newLog;
  }

  public logPlayerError(params: {
    channelName?: string;
    channelUrl?: string;
    errorCode?: string | number;
    message: string;
    details?: string;
  }) {
    return this.addLog({
      type: 'player',
      message: params.message,
      url: params.channelUrl,
      channelName: params.channelName,
      errorCode: params.errorCode || 'PLAYER_ERROR',
      details: params.details,
    });
  }

  public logNetworkError(params: {
    url: string;
    status?: number | string;
    message: string;
    details?: string;
  }) {
    return this.addLog({
      type: 'network',
      message: params.message,
      url: params.url,
      errorCode: params.status || 'NET_FAIL',
      details: params.details,
    });
  }

  public logJsError(params: {
    message: string;
    stack?: string;
    source?: string;
    lineno?: number;
    colno?: number;
  }) {
    return this.addLog({
      type: 'javascript',
      message: params.message,
      url: params.source,
      details: params.lineno ? `Line: ${params.lineno}, Col: ${params.colno || 0}` : undefined,
      stack: params.stack,
    });
  }

  public clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    this.notify();
  }

  /**
   * Initializes global browser error listeners:
   * - window.onerror
   * - window.onunhandledrejection
   * - window.fetch network failures
   */
  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // 1. Capture Global JavaScript Runtime Errors
    try {
      window.addEventListener(
        'error',
        (event: ErrorEvent | Event) => {
          try {
            if ('message' in event) {
              const errEvt = event as ErrorEvent;
              // Ignore extension errors or benign third-party script rejections
              if (errEvt.filename && errEvt.filename.startsWith('chrome-extension://')) return;

              this.logJsError({
                message: errEvt.message || 'JavaScript Execution Error',
                stack: errEvt.error?.stack,
                source: errEvt.filename,
                lineno: errEvt.lineno,
                colno: errEvt.colno,
              });
            }
          } catch {
            // Prevent recursive logger errors
          }
        },
        true
      );
    } catch {
      // Event listener attachment failed
    }

    // 2. Capture Unhandled Promise Rejections
    try {
      window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        try {
          const reason = event.reason;
          let msg = 'Unhandled Promise Rejection';
          let stack: string | undefined;

          if (typeof reason === 'string') {
            msg = reason;
          } else if (reason && typeof reason === 'object') {
            msg = reason.message || reason.statusText || 'Rejected Promise';
            stack = reason.stack;
          }

          this.addLog({
            type: 'javascript',
            message: msg,
            stack,
            errorCode: 'UNHANDLED_REJECTION',
            details: 'Promise rejection was not handled with .catch()',
          });
        } catch {
          // Prevent recursive logger errors
        }
      });
    } catch {
      // Event listener attachment failed
    }

    // 3. Intercept Network Fetch Errors & Failed HTTP status codes (Safely)
    try {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const originalFetch = window.fetch.bind(window);

        const customFetch: typeof window.fetch = async (...args) => {
          const input = args[0];
          let url = '';
          if (typeof input === 'string') {
            url = input;
          } else if (input instanceof URL) {
            url = input.toString();
          } else if (input && typeof input === 'object' && 'url' in input) {
            url = (input as Request).url;
          }

          try {
            const response = await originalFetch(...args);

            // Only log actual failed HTTP statuses (4xx, 5xx) on API / stream / proxy requests
            if (!response.ok && response.status >= 400) {
              // Avoid noise for common 404 image poster fallbacks or analytics
              const isIgnoredPoster = url.includes('image.tmdb.org') && response.status === 404;
              if (!isIgnoredPoster) {
                this.logNetworkError({
                  url,
                  status: response.status,
                  message: `HTTP ${response.status} (${response.statusText || 'Error'})`,
                  details: `Request to ${url} failed with status code ${response.status}`,
                });
              }
            }

            return response;
          } catch (err: any) {
            // Network connection failure, CORS blocking, offline, or aborted fetch
            this.logNetworkError({
              url,
              status: 'CORS/CONNECTION_FAILED',
              message: err?.message || 'Network request failed (CORS or unreachable host)',
              details: err?.stack || 'Failed to complete fetch request',
            });
            throw err;
          }
        };

        // In restricted sandbox environments (e.g. iframe runner), window.fetch may be a read-only getter
        // Direct assignment throws "Cannot set property fetch of #<Window> which has only a getter"
        let overridden = false;
        try {
          Object.defineProperty(window, 'fetch', {
            value: customFetch,
            writable: true,
            configurable: true,
            enumerable: true,
          });
          overridden = true;
        } catch {
          // Object.defineProperty not permitted on this environment's window
        }

        if (!overridden) {
          try {
            (window as any).fetch = customFetch;
          } catch {
            // Direct assignment also not permitted; fallback gracefully without error
          }
        }
      }
    } catch {
      // Entire fetch intercept wrapper caught; ensures initialization never crashes app
    }

    // 4. Safely Intercept XMLHttpRequest if supported
    try {
      if (typeof window !== 'undefined' && typeof window.XMLHttpRequest === 'function') {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        const self = this;

        XMLHttpRequest.prototype.open = function (this: any, ...args: any[]) {
          try {
            this._reqUrl = args[1];
          } catch {
            // ignore
          }
          return originalOpen.apply(this, args as any);
        };

        XMLHttpRequest.prototype.send = function (this: any, ...args: any[]) {
          try {
            this.addEventListener('error', () => {
              if (this._reqUrl) {
                self.logNetworkError({
                  url: String(this._reqUrl),
                  status: this.status || 'XHR_FAILED',
                  message: 'XMLHttpRequest network error (connection failed or CORS error)',
                });
              }
            });
            this.addEventListener('load', () => {
              if (this.status >= 400 && this._reqUrl) {
                self.logNetworkError({
                  url: String(this._reqUrl),
                  status: this.status,
                  message: `XHR HTTP ${this.status} (${this.statusText || 'Error'})`,
                });
              }
            });
          } catch {
            // ignore listener attachment error
          }
          return originalSend.apply(this, args as any);
        };
      }
    } catch {
      // ignore XHR wrapping failures
    }
  }

  /**
   * Export all errors as human-readable text suitable for copying to clipboard
   */
  public exportLogsAsText(): string {
    if (this.logs.length === 0) {
      return '=== IPTV Cinema Player - Error Log ===\nNo errors recorded. System running smoothly.';
    }

    const header = [
      '========================================',
      '   IPTV CINEMA PRO - ERROR LOG REPORT   ',
      '========================================',
      `Exported at: ${new Date().toLocaleString()}`,
      `Total Logged Errors: ${this.logs.length}`,
      '----------------------------------------\n',
    ].join('\n');

    const body = this.logs
      .map((log, index) => {
        const lines: string[] = [
          `[#${index + 1}] [${log.timeFormatted}] [TYPE: ${log.type.toUpperCase()}]`,
          `Message: ${log.message}`,
        ];

        if (log.channelName) {
          lines.push(`Channel: ${log.channelName}`);
        }
        if (log.url) {
          lines.push(`URL: ${log.url}`);
        }
        if (log.errorCode !== undefined) {
          lines.push(`Error Code: ${log.errorCode}`);
        }
        if (log.details) {
          lines.push(`Details: ${log.details}`);
        }
        if (log.stack) {
          lines.push(`Stack: ${log.stack.trim()}`);
        }

        return lines.join('\n');
      })
      .join('\n\n----------------------------------------\n\n');

    return `${header}${body}\n\n========================================`;
  }
}

export const errorLogService = new ErrorLogService();
