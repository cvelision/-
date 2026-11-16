const ADMIN_CODE_KEY = 'sapphirely_admin_code_v1';
const LORD_CODE_KEY = 'sapphirely_lord_code_v1';
const SENDER_NAME_KEY = 'sapphirely_sender_name_v1';

export function getStoredAdminCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ADMIN_CODE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAdminCode(code: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (code) {
      localStorage.setItem(ADMIN_CODE_KEY, code);
    } else {
      localStorage.removeItem(ADMIN_CODE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function getStoredLordCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(LORD_CODE_KEY);
  } catch {
    return null;
  }
}

export function setStoredLordCode(code: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (code) {
      localStorage.setItem(LORD_CODE_KEY, code);
    } else {
      localStorage.removeItem(LORD_CODE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function getStoredSenderName(): string {
  if (typeof window === 'undefined') return 'Эрхэм худалдан авагч';
  try {
    return localStorage.getItem(SENDER_NAME_KEY) || 'Эрхэм худалдан авагч';
  } catch {
    return 'Эрхэм худалдан авагч';
  }
}

export function setStoredSenderName(name: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SENDER_NAME_KEY, name);
  } catch {
    // Ignore storage quota errors
  }
}
