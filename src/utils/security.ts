// Security utilities for input sanitization and XSS prevention

export class SecurityManager {
  private static instance: SecurityManager;
  private readonly MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
  ];

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Input sanitization
  sanitizeXmlInput(input: string): string {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: must be a non-empty string');
    }

    if (input.length > this.MAX_INPUT_SIZE) {
      throw new Error(`Input too large: maximum ${this.MAX_INPUT_SIZE / (1024 * 1024)}MB allowed`);
    }

    // Remove potentially dangerous patterns
    let sanitized = input;
    this.DANGEROUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Encode HTML entities
    sanitized = this.encodeHtmlEntities(sanitized);

    return sanitized;
  }

  // HTML entity encoding
  private encodeHtmlEntities(str: string): string {
    const entityMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    };

    return str.replace(/[&<>"'\/]/g, (s) => entityMap[s]);
  }

  // XSS prevention
  preventXSS(input: string): string {
    // Remove script tags and event handlers
    let cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/javascript:/gi, '');
    
    return cleaned;
  }

  // Validate XML structure
  validateXmlStructure(xml: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Check for basic XML structure
      if (!xml.trim().startsWith('<')) {
        errors.push('XML must start with an opening tag');
      }

      if (!xml.trim().endsWith('>')) {
        errors.push('XML must end with a closing tag');
      }

      // Check for balanced tags
      const openTags = xml.match(/<[^/!?][^>]*[^/]>/g) || [];
      const closeTags = xml.match(/<\/[^>]+>/g) || [];
      const selfClosingTags = xml.match(/<[^>]*\/>/g) || [];

      const expectedCloseTags = openTags.length - selfClosingTags.length;
      if (closeTags.length !== expectedCloseTags) {
        errors.push('Unbalanced XML tags detected');
      }

      // Check for XML declaration
      if (xml.includes('<?xml') && !xml.trim().startsWith('<?xml')) {
        errors.push('XML declaration must be at the beginning');
      }

      // Validate with DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      const parserError = doc.querySelector('parsererror');
      
      if (parserError) {
        errors.push(`Parser error: ${parserError.textContent}`);
      }

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Content Security Policy helpers
  generateCSPNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Rate limiting
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(identifier);

    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  // File validation
  validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['text/xml', 'application/xml', 'text/plain'];
    const allowedExtensions = ['.xml', '.yxmd'];

    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    if (!allowedTypes.includes(file.type) && file.type !== '') {
      const hasValidExtension = allowedExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      
      if (!hasValidExtension) {
        errors.push('Invalid file type. Only XML and YXMD files are allowed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Data encryption/decryption for storage
  async encryptData(data: string, key?: string): Promise<string> {
    if (!crypto.subtle) {
      // Fallback for environments without crypto.subtle
      return btoa(data);
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate a key if not provided
      const cryptoKey = key 
        ? await crypto.subtle.importKey(
            'raw',
            encoder.encode(key.padEnd(32, '0').slice(0, 32)),
            { name: 'AES-GCM' },
            false,
            ['encrypt']
          )
        : await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.warn('Encryption failed, using base64 encoding:', error);
      return btoa(data);
    }
  }

  async decryptData(encryptedData: string, key?: string): Promise<string> {
    if (!crypto.subtle) {
      // Fallback for environments without crypto.subtle
      return atob(encryptedData);
    }

    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const encoder = new TextEncoder();
      const cryptoKey = key 
        ? await crypto.subtle.importKey(
            'raw',
            encoder.encode(key.padEnd(32, '0').slice(0, 32)),
            { name: 'AES-GCM' },
            false,
            ['decrypt']
          )
        : await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.warn('Decryption failed, using base64 decoding:', error);
      return atob(encryptedData);
    }
  }

  // Privacy controls
  anonymizeData(data: any): any {
    const sensitiveFields = ['email', 'name', 'phone', 'address', 'ip'];
    
    if (typeof data === 'object' && data !== null) {
      const anonymized = { ...data };
      
      Object.keys(anonymized).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          anonymized[key] = '[REDACTED]';
        } else if (typeof anonymized[key] === 'object') {
          anonymized[key] = this.anonymizeData(anonymized[key]);
        }
      });
      
      return anonymized;
    }
    
    return data;
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();

// Utility functions
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}

export function generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}