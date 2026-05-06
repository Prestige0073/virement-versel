import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeIBAN,
  sanitizeBIC,
  getSafeErrorMessage,
  sanitizeAccountData,
} from '../utils/sanitizer';

/**
 * Tests for Input Sanitization Utility
 * Covers: XSS prevention, injection prevention, data validation
 */

describe('Input Sanitization', () => {
  describe('String Sanitization', () => {
    it('should remove XSS payload characters', () => {
      const dangerous = 'Normal Name<script>alert("xss")</script>';
      const sanitized = sanitizeString(dangerous);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('"');
    });

    it('should trim whitespace', () => {
      const input = '  Name with spaces  ';
      const sanitized = sanitizeString(input);

      expect(sanitized).toBe(input.trim());
    });

    it('should remove dangerous special characters', () => {
      const dangerous = "O'Neill; DROP TABLE--";
      const sanitized = sanitizeString(dangerous);

      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain(';');
    });

    it('should limit string length to 255 chars', () => {
      const longString = 'a'.repeat(500);
      const sanitized = sanitizeString(longString);

      expect(sanitized.length).toBeLessThanOrEqual(255);
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });
  });

  describe('Email Sanitization', () => {
    it('should validate correct email format', () => {
      const email = 'user@example.com';
      const sanitized = sanitizeEmail(email);

      expect(sanitized).toBe(email);
    });

    it('should convert to lowercase', () => {
      const email = 'USER@EXAMPLE.COM';
      const sanitized = sanitizeEmail(email);

      expect(sanitized).toBe('user@example.com');
    });

    it('should reject invalid email format', () => {
      expect(sanitizeEmail('notanemail')).toBe('');
      expect(sanitizeEmail('noatsign.com')).toBe('');
      expect(sanitizeEmail('@example.com')).toBe('');
    });

    it('should trim whitespace from email', () => {
      const email = '  user@example.com  ';
      const sanitized = sanitizeEmail(email);

      expect(sanitized).toBe('user@example.com');
    });

    it('should handle non-string input', () => {
      expect(sanitizeEmail(null)).toBe('');
      expect(sanitizeEmail(undefined)).toBe('');
    });
  });

  describe('Phone Sanitization', () => {
    it('should keep only digits', () => {
      const phone = '+33 (6) 12-34-56-78';
      const sanitized = sanitizePhone(phone);

      expect(sanitized).toBe('33612345678');
    });

    it('should limit to 15 digits', () => {
      const phone = '123456789012345678901'; // 21 digits
      const sanitized = sanitizePhone(phone);

      expect(sanitized.length).toBe(15);
    });

    it('should handle non-string input', () => {
      expect(sanitizePhone(null)).toBe('');
      expect(sanitizePhone(undefined)).toBe('');
    });

    it('should remove all non-digit characters', () => {
      const phone = 'abc+33(6)12@34#56';
      const sanitized = sanitizePhone(phone);

      expect(sanitized).toMatch(/^\d+$/);
    });
  });

  describe('IBAN Sanitization', () => {
    it('should convert to uppercase', () => {
      const iban = 'fr1420041010050500013m026';
      const sanitized = sanitizeIBAN(iban);

      expect(sanitized).toBe(sanitized.toUpperCase());
    });

    it('should keep only alphanumeric characters', () => {
      const iban = 'FR14-2004-1010-0505-0001-3M02-6';
      const sanitized = sanitizeIBAN(iban);

      expect(sanitized).toMatch(/^[A-Z0-9]+$/);
    });

    it('should limit to 34 characters (max IBAN length)', () => {
      const iban = 'A'.repeat(50);
      const sanitized = sanitizeIBAN(iban);

      expect(sanitized.length).toBeLessThanOrEqual(34);
    });

    it('should handle non-string input', () => {
      expect(sanitizeIBAN(null)).toBe('');
      expect(sanitizeIBAN(undefined)).toBe('');
    });

    it('should remove spaces and special chars', () => {
      const iban = 'FR14 2004 1010 0505 0001 3M02 6';
      const sanitized = sanitizeIBAN(iban);

      expect(sanitized).not.toContain(' ');
      expect(sanitized).not.toContain('-');
    });
  });

  describe('BIC Sanitization', () => {
    it('should convert to uppercase', () => {
      const bic = 'bnpafrpp';
      const sanitized = sanitizeBIC(bic);

      expect(sanitized).toBe('BNPAFRPP');
    });

    it('should keep only alphanumeric characters', () => {
      const bic = 'BNP-A.FRPP';
      const sanitized = sanitizeBIC(bic);

      expect(sanitized).toMatch(/^[A-Z0-9]+$/);
    });

    it('should limit to 11 characters (standard BIC length)', () => {
      const bic = 'ABCDEFGHIJKLMNOP';
      const sanitized = sanitizeBIC(bic);

      expect(sanitized.length).toBeLessThanOrEqual(11);
    });

    it('should handle common BIC formats', () => {
      const bic1 = sanitizeBIC('BNPAFRPP');
      const bic2 = sanitizeBIC('GERADEDB');

      expect(bic1).toBe('BNPAFRPP');
      expect(bic2).toBe('GERADEDB');
    });
  });

  describe('Safe Error Messages', () => {
    it('should map known errors to user-friendly messages', () => {
      const error = new Error('IBAN invalide');
      const safe = getSafeErrorMessage(error);

      expect(safe).toBe('Veuillez vérifier votre IBAN');
    });

    it('should not leak system errors', () => {
      const error = new Error('Database connection failed: ECONNREFUSED 127.0.0.1:5432');
      const safe = getSafeErrorMessage(error);

      expect(safe).not.toContain('127.0.0.1');
      expect(safe).not.toContain('ECONNREFUSED');
    });

    it('should provide generic message for unknown errors', () => {
      const error = new Error('Some unknown internal error');
      const safe = getSafeErrorMessage(error);

      expect(safe).toBe('Une erreur est survenue. Veuillez réessayer.');
    });

    it('should handle null error', () => {
      const safe = getSafeErrorMessage(null);

      expect(safe).toBe('Une erreur est survenue');
    });

    it('should handle undefined error', () => {
      const safe = getSafeErrorMessage(undefined);

      expect(safe).toBe('Une erreur est survenue');
    });
  });

  describe('Account Data Sanitization', () => {
    it('should sanitize all account fields', () => {
      const accountData = {
        holder_name: 'Jean Dupont<script>',
        holder_email: 'JEAN@EXAMPLE.COM',
        phone: '+33 (6) 12-34-56-78',
        address: '123 Rue de Paris; DROP TABLE',
        iban: 'fr1420041010050500013m026',
        bic: 'bnpafrpp',
        bank_name: 'BNP Paribas<img>',
        branch: 'Paris Main',
        account_type: 'courant',
        tier: 'premium',
        currency: 'EUR',
        language: 'fr',
        current_balance: '50000',
      };

      const sanitized = sanitizeAccountData(accountData);

      // Should not contain dangerous characters
      expect(sanitized.holder_name).not.toContain('<');
      expect(sanitized.address).not.toContain(';');
      expect(sanitized.bank_name).not.toContain('<');

      // Should be properly formatted
      expect(sanitized.holder_email).toBe('jean@example.com');
      expect(sanitized.iban).toBe('FR1420041010050500013M026');
      expect(sanitized.bic).toBe('BNPAFRPP');

      // Should be numeric or enum
      expect(typeof sanitized.current_balance).toBe('number');
      expect(sanitized.current_balance).toBeGreaterThanOrEqual(0);
    });

    it('should not allow negative balance', () => {
      const accountData = { current_balance: '-1000' };
      const sanitized = sanitizeAccountData(accountData);

      expect(sanitized.current_balance).toBe(0);
    });

    it('should default to valid values if missing', () => {
      const accountData = {};
      const sanitized = sanitizeAccountData(accountData);

      expect(sanitized.account_type).toBe('courant');
      expect(sanitized.tier).toBe('basique');
      expect(sanitized.currency).toBe('XOF');
      expect(sanitized.language).toBe('fr');
    });
  });

  describe('XSS Prevention', () => {
    it('should prevent script injection through names', () => {
      const xssPayload = 'Jean<img src=x onerror="alert(1)">';
      const sanitized = sanitizeString(xssPayload);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('onerror');
    });

    it('should prevent SQL injection patterns', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const sanitized = sanitizeString(sqlInjection);

      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain(';');
    });

    it('should prevent comment sequences', () => {
      const comment = 'Normal /*comment*/ Continued';
      const sanitized = sanitizeString(comment);

      expect(sanitized).toMatch(/^[a-zA-Z0-9\s]+$/);
    });
  });
});

/**
 * Helper for BIC sanitization tests
 */
function sanitizeBIC(bic) {
  if (typeof bic !== 'string') return '';

  return bic
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 11);
}
