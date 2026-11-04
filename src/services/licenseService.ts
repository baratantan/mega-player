/**
 * Cinema Pro Player License & Monetization Service
 * يدير تراخيص الأجهزة، الفترة التجريبية المجانية، ونظام تفعيل الأكواد المدفوعة
 * متوافق مع نموذج TiviMate و IBO Player (بيع رخصة المشغل للأجهزة)
 */

export interface AppLicense {
  deviceId: string;
  isActivated: boolean;
  licenseType: 'trial' | 'annual' | 'lifetime' | 'expired';
  licenseKey?: string;
  activatedAt?: number;
  expiresAt?: number; // timestamp ms
  trialStartedAt: number;
  daysRemaining: number;
}

const STORAGE_KEY_LICENSE = 'cinema_pro_app_license_v1';
const TRIAL_DAYS = 7;
const ADMIN_MASTER_PIN = '8899'; // رمز المالك لتوليد الأكواد

class LicenseService {
  private license: AppLicense;
  private listeners: Array<() => void> = [];

  constructor() {
    this.license = this.loadLicense();
  }

  private generateDeviceId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let part1 = '';
    let part2 = '';
    for (let i = 0; i < 4; i++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
      part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CP-${part1}-${part2}`;
  }

  private loadLicense(): AppLicense {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LICENSE);
      if (saved) {
        const parsed = JSON.parse(saved) as AppLicense;
        return this.recalculateStatus(parsed);
      }
    } catch (e) {
      console.warn('License load error:', e);
    }

    // First time setup - 7-day free trial
    const newLicense: AppLicense = {
      deviceId: this.generateDeviceId(),
      isActivated: false,
      licenseType: 'trial',
      trialStartedAt: Date.now(),
      daysRemaining: TRIAL_DAYS,
    };
    this.saveLicense(newLicense);
    return newLicense;
  }

  private recalculateStatus(lic: AppLicense): AppLicense {
    const now = Date.now();

    // If lifetime activated
    if (lic.isActivated && lic.licenseType === 'lifetime') {
      return { ...lic, daysRemaining: 9999 };
    }

    // If annual activated
    if (lic.isActivated && lic.licenseType === 'annual' && lic.expiresAt) {
      if (now > lic.expiresAt) {
        lic.isActivated = false;
        lic.licenseType = 'expired';
        lic.daysRemaining = 0;
      } else {
        const diffDays = Math.ceil((lic.expiresAt - now) / (1000 * 60 * 60 * 24));
        lic.daysRemaining = Math.max(0, diffDays);
      }
      this.saveLicense(lic);
      return lic;
    }

    // Free trial calculation
    const trialEnd = lic.trialStartedAt + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    if (now > trialEnd) {
      lic.isActivated = false;
      lic.licenseType = 'expired';
      lic.daysRemaining = 0;
    } else {
      lic.daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
    }
    this.saveLicense(lic);
    return lic;
  }

  private saveLicense(lic: AppLicense): void {
    try {
      localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(lic));
    } catch (e) {
      console.warn('License save error:', e);
    }
  }

  public getLicense(): AppLicense {
    return this.recalculateStatus(this.license);
  }

  public isPro(): boolean {
    const lic = this.getLicense();
    return lic.isActivated || lic.licenseType === 'trial';
  }

  public isPremiumPaid(): boolean {
    const lic = this.getLicense();
    return lic.isActivated && (lic.licenseType === 'annual' || lic.licenseType === 'lifetime');
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  /**
   * Validate and activate a user license key
   * Structure: CPRO-1Y-XXXXX (Annual) or CPRO-LIFE-XXXXX (Lifetime)
   */
  public activateKey(inputKey: string): { success: boolean; message: string; type?: 'annual' | 'lifetime' } {
    const cleanKey = inputKey.trim().toUpperCase();

    if (!cleanKey) {
      return { success: false, message: 'يرجى إدخال كود التفعيل' };
    }

    // Check Lifetime format: CPRO-LIFE-XXXX-XXXX
    if (cleanKey.startsWith('CPRO-LIFE-') && cleanKey.length >= 14) {
      this.license = {
        ...this.license,
        isActivated: true,
        licenseType: 'lifetime',
        licenseKey: cleanKey,
        activatedAt: Date.now(),
        daysRemaining: 9999,
      };
      this.saveLicense(this.license);
      this.notify();
      return { success: true, message: 'تهانينا! تم تفعيل رخصة مدى الحياة بنجاح! 🎉', type: 'lifetime' };
    }

    // Check Annual format: CPRO-1Y-XXXX-XXXX
    if (cleanKey.startsWith('CPRO-1Y-') && cleanKey.length >= 12) {
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      this.license = {
        ...this.license,
        isActivated: true,
        licenseType: 'annual',
        licenseKey: cleanKey,
        activatedAt: Date.now(),
        expiresAt: Date.now() + oneYearMs,
        daysRemaining: 365,
      };
      this.saveLicense(this.license);
      this.notify();
      return { success: true, message: 'تهانينا! تم تفعيل رخصة المشغل السنوية (365 يوماً) بنجاح! 🎉', type: 'annual' };
    }

    // Check VIP Standard codes
    if (cleanKey.startsWith('VIP-') && cleanKey.length >= 10) {
      this.license = {
        ...this.license,
        isActivated: true,
        licenseType: 'annual',
        licenseKey: cleanKey,
        activatedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        daysRemaining: 365,
      };
      this.saveLicense(this.license);
      this.notify();
      return { success: true, message: 'تم تفعيل كود VIP السنوي بنجاح!', type: 'annual' };
    }

    return { 
      success: false, 
      message: 'كود التفعيل غير صالح. تأكد من إدخال الكود بشكل صحيح أو تواصل مع المالك للحصول على كود مفعّل.' 
    };
  }

  /**
   * Admin code generator for the App Owner to sell codes to customers
   */
  public generateCode(type: 'annual' | 'lifetime', adminPin: string): { success: boolean; code?: string; error?: string } {
    if (adminPin !== ADMIN_MASTER_PIN) {
      return { success: false, error: 'رمز مرور المالك غير صحيح' };
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 4; i++) {
      p1 += chars.charAt(Math.floor(Math.random() * chars.length));
      p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const prefix = type === 'lifetime' ? 'CPRO-LIFE' : 'CPRO-1Y';
    const code = `${prefix}-${p1}-${p2}`;
    return { success: true, code };
  }
}

export const licenseService = new LicenseService();
