import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Standardize key to 32 bytes (256 bits)
const RAW_KEY = process.env.ENCRYPTION_KEY || 'vault_secure_aes_encryption_key_32_bytes_vault';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(RAW_KEY).digest(); // Always generates a 32-byte key

const IV_LENGTH = 12; // GCM recommended IV size

/**
 * Encrypt plain text using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted string in the format iv:ciphertext:authTag
 */
export function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypt cipher text using AES-256-GCM
 * @param {string} encryptedText - Encrypted text in the format iv:ciphertext:authTag
 * @returns {string} Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return '';
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed cipher text structure');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const ciphertext = parts[1];
  const authTag = Buffer.from(parts[2], 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
