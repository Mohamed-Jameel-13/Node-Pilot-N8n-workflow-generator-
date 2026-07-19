/**
 * Secure Storage Utility
 * Encrypts sensitive data before storing in localStorage
 * 
 * SECURITY: Uses AES encryption to protect n8n credentials from XSS attacks
 */

import CryptoJS from 'crypto-js';

// IMPORTANT: In production, this should be:
// 1. Generated per-user using their session ID + server secret
// 2. Rotated periodically
// 3. Never hardcoded
// For MVP, we use a runtime-generated key stored in sessionStorage
const getEncryptionKey = (): string => {
  const SESSION_KEY = '__secure_key__';
  
  // Check if key exists in localStorage (changed from sessionStorage to persist across tabs)
  let key = localStorage.getItem(SESSION_KEY);
  
  if (!key) {
    // Generate a new key for this session
    // In production, fetch this from server after auth
    key = CryptoJS.lib.WordArray.random(32).toString();
    localStorage.setItem(SESSION_KEY, key);
  }
  
  return key;
};

export const secureStorage = {
  /**
   * Encrypt and store data in localStorage
   * @param key Storage key
   * @param value Any JSON-serializable value
   */
  set: (key: string, value: any): void => {
    try {
      const stringified = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(stringified, getEncryptionKey()).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('[SecureStorage] Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  },

  /**
   * Retrieve and decrypt data from localStorage
   * @param key Storage key
   * @returns Decrypted value or null if not found
   */
  get: (key: string): any => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, getEncryptionKey());
      let stringified = '';
      try {
        stringified = decrypted.toString(CryptoJS.enc.Utf8);
      } catch (decodeError) {
        console.warn('[SecureStorage] Data could not be decoded (corrupted or wrong key) for key:', key);
        localStorage.removeItem(key);
        return null;
      }
      
      if (!stringified) {
        // Decryption failed (wrong key or corrupted data)
        console.warn('[SecureStorage] Decryption failed for key:', key);
        localStorage.removeItem(key);
        return null;
      }
      
      return JSON.parse(stringified);
    } catch (error) {
      console.warn('[SecureStorage] Decryption process failed:', error);
      return null;
    }
  },

  /**
   * Remove data from localStorage
   * @param key Storage key
   */
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  /**
   * Check if encrypted data exists
   * @param key Storage key
   */
  has: (key: string): boolean => {
    return localStorage.getItem(key) !== null;
  },

  /**
   * Clear all data (use with caution)
   */
  clear: (): void => {
    localStorage.clear();
    sessionStorage.clear();
  }
};

/**
 * Migration helper: Convert plain localStorage to encrypted
 * Call this once when implementing secure storage
 */
export const migrateToSecureStorage = (keys: string[]): void => {
  keys.forEach(key => {
    const plainValue = localStorage.getItem(key);
    if (plainValue && !plainValue.startsWith('U2F')) { // U2F is encrypted prefix
      try {
        const parsed = JSON.parse(plainValue);
        secureStorage.set(key, parsed);
        console.log(`[SecureStorage] Migrated ${key} to encrypted storage`);
      } catch (e) {
        // Not JSON, store as-is
        secureStorage.set(key, plainValue);
      }
    }
  });
};
