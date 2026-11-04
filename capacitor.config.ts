export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    cleartext?: boolean;
    androidScheme?: string;
    url?: string;
  };
  android?: {
    allowMixedContent?: boolean;
    captureInput?: boolean;
    webContentsDebuggingEnabled?: boolean;
  };
}

const config: CapacitorConfig = {
  appId: 'com.cinemapro.iptv',
  appName: 'Cinema Pro 4K',
  webDir: 'dist',
  server: {
    // Allows cleartext HTTP communication with IPTV servers without mixed-content blocks
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
