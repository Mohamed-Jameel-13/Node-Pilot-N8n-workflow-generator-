/**
 * Secure Storage Utility
 * Protects n8n and AI credentials using in-memory caching and session isolation
 */

import CryptoJS from 'crypto-js';

// In-memory runtime key - never saved to permanent disk or localStorage
let inMemorySessionKey: string | null = null;

const getSessionKey = (): string => {
  if (!inMemorySessionKey) {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let key = sessionStorage.getItem('__session_vault_key__');
      if (!key) {
        key = CryptoJS.lib.WordArray.random(32).toString();
        sessionStorage.setItem('__session_vault_key__', key);
      }
      inMemorySessionKey = key;
    } else {
      inMemorySessionKey = CryptoJS.lib.WordArray.random(32).toString();
    }
  }
  return inMemorySessionKey;
};

export const secureStorage = {
  /**
   * Encrypt and store data in sessionStorage
   * @param key Storage key
   * @param value Any JSON-serializable value
   */
  set: (key: string, value: any): void => {
    try {
      if (typeof window === 'undefined') return;
      const stringified = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(stringified, getSessionKey()).toString();
      sessionStorage.setItem(key, encrypted);
      // Clean up legacy insecure storage if present
      localStorage.removeItem(key);
      localStorage.removeItem('__secure_key__');
    } catch (error) {
      console.error('[SecureStorage] Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  },

  /**
   * Retrieve and decrypt data from sessionStorage (with legacy fallback)
   * @param key Storage key
   * @returns Decrypted value or null if not found
   */
  get: (key: string): any => {
    try {
      if (typeof window === 'undefined') return null;

      // 1. Try sessionStorage first
      let encrypted = sessionStorage.getItem(key);

      // 2. Fallback to localStorage if migrating from legacy session
      if (!encrypted) {
        encrypted = localStorage.getItem(key);
        if (encrypted) {
          // If legacy plain key exists, try legacy key
          const legacyKey = localStorage.getItem('__secure_key__');
          if (legacyKey) {
            try {
              const decrypted = CryptoJS.AES.decrypt(encrypted, legacyKey);
              const stringified = decrypted.toString(CryptoJS.enc.Utf8);
              if (stringified) {
                const parsed = JSON.parse(stringified);
                // Migrate to secure session storage and remove legacy
                secureStorage.set(key, parsed);
                return parsed;
              }
            } catch {}
          }
        }
        return null;
      }

      const decrypted = CryptoJS.AES.decrypt(encrypted, getSessionKey());
      let stringified = '';
      try {
        stringified = decrypted.toString(CryptoJS.enc.Utf8);
      } catch {
        sessionStorage.removeItem(key);
        return null;
      }

      if (!stringified) {
        sessionStorage.removeItem(key);
        return null;
      }

      return JSON.parse(stringified);
    } catch (error) {
      return null;
    }
  },

  /**
   * Remove data from storage
   * @param key Storage key
   */
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  },

  /**
   * Check if data exists
   * @param key Storage key
   */
  has: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(key) !== null || localStorage.getItem(key) !== null;
  },

  /**
   * Clear storage
   */
  clear: (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.clear();
    localStorage.removeItem('__secure_key__');
  }
};
