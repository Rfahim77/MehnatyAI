// Input sanitization to prevent prompt injection and protect PII

// Patterns for PII detection
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_PATTERN = /(\+966|00966|0)?[5][0-9]{8}\b/g; // Saudi phone numbers
const SAUDI_ID_PATTERN = /\b[12]\d{9}\b/g; // Saudi National ID (10 digits starting with 1 or 2)

// Prompt injection patterns - common attempts to manipulate the AI
const PROMPT_INJECTION_PATTERNS = [
  // Direct instruction attempts
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|commands)/gi,
  /forget\s+(everything|all|what)\s+(you|i)\s+(said|told|learned)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)/gi,
  
  // Role manipulation
  /you\s+are\s+(now\s+)?a\s+(different|new)/gi,
  /act\s+as\s+(if\s+)?(you|a)\s+(are|were)/gi,
  /pretend\s+(you|to\s+be)/gi,
  /roleplay\s+as/gi,
  
  // System prompt extraction
  /show\s+(me\s+)?(your\s+)?(system\s+)?prompt/gi,
  /what\s+(is|are)\s+your\s+(instructions|rules|guidelines)/gi,
  /reveal\s+your\s+(system|internal)\s+prompt/gi,
  
  // Encoding/escaping attempts
  /<\s*\/?system\s*>/gi,
  /<\s*\/?assistant\s*>/gi,
  /<\s*\/?user\s*>/gi,
  /```system/gi,
  
  // Jailbreak attempts
  /developer\s+mode/gi,
  /sudo\s+mode/gi,
  /admin\s+mode/gi,
  /root\s+access/gi,
];

export interface SanitizationResult {
  sanitized: string;
  piiRedacted: boolean;
  injectionAttemptDetected: boolean;
  warnings: string[];
}

/**
 * Sanitize user input before sending to LLM
 * - Removes prompt injection patterns
 * - Redacts PII (emails, phone numbers, Saudi IDs)
 * - Preserves Arabic text
 */
export function sanitizeInput(input: string): SanitizationResult {
  if (!input || typeof input !== 'string') {
    return {
      sanitized: '',
      piiRedacted: false,
      injectionAttemptDetected: false,
      warnings: [],
    };
  }

  let sanitized = input;
  let piiRedacted = false;
  let injectionAttemptDetected = false;
  const warnings: string[] = [];

  // 1. Detect and remove prompt injection attempts
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      injectionAttemptDetected = true;
      warnings.push('محاولة تلاعب بالذكاء الاصطناعي تم اكتشافها وإزالتها');
      // Replace with neutral text
      sanitized = sanitized.replace(pattern, '[REMOVED]');
    }
  }

  // 2. Redact PII
  // Email addresses
  if (EMAIL_PATTERN.test(sanitized)) {
    piiRedacted = true;
    warnings.push('تم حجب البريد الإلكتروني للخصوصية');
    sanitized = sanitized.replace(EMAIL_PATTERN, '[EMAIL_REDACTED]');
  }

  // Phone numbers
  if (PHONE_PATTERN.test(sanitized)) {
    piiRedacted = true;
    warnings.push('تم حجب رقم الهاتف للخصوصية');
    sanitized = sanitized.replace(PHONE_PATTERN, '[PHONE_REDACTED]');
  }

  // Saudi National IDs
  if (SAUDI_ID_PATTERN.test(sanitized)) {
    piiRedacted = true;
    warnings.push('تم حجب رقم الهوية للخصوصية');
    sanitized = sanitized.replace(SAUDI_ID_PATTERN, '[ID_REDACTED]');
  }

  // 3. Remove excessive repetition (potential DoS or manipulation)
  // If same character/word repeated more than 50 times, truncate
  sanitized = sanitized.replace(/(.)\1{50,}/g, '$1$1$1...');
  sanitized = sanitized.replace(/(\b\w+\b)(\s+\1){50,}/gi, '$1 $1 $1 ...');

  // 4. Limit length (safety measure)
  const MAX_INPUT_LENGTH = 50000; // ~50K chars
  if (sanitized.length > MAX_INPUT_LENGTH) {
    warnings.push('تم اقتطاع النص لأنه طويل جداً');
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH) + '...';
  }

  return {
    sanitized,
    piiRedacted,
    injectionAttemptDetected,
    warnings,
  };
}

/**
 * Sanitize resume JSON object
 * Sanitizes all text fields while preserving structure
 */
export function sanitizeResumeJson(resumeJson: any): { sanitized: any; warnings: string[] } {
  if (!resumeJson || typeof resumeJson !== 'object') {
    return { sanitized: resumeJson, warnings: [] };
  }

  const allWarnings: string[] = [];
  const sanitized = JSON.parse(JSON.stringify(resumeJson)); // Deep clone

  // Helper to sanitize a field
  const sanitizeField = (obj: any, field: string) => {
    if (obj[field] && typeof obj[field] === 'string') {
      const result = sanitizeInput(obj[field]);
      obj[field] = result.sanitized;
      allWarnings.push(...result.warnings);
    }
  };

  // Sanitize top-level fields
  sanitizeField(sanitized, 'name');
  sanitizeField(sanitized, 'summary');

  // Sanitize contact (but allow one email and one phone)
  if (sanitized.contact) {
    // Don't redact email/phone in contact section, but check for injection
    if (sanitized.contact.email) {
      const result = sanitizeInput(sanitized.contact.email);
      if (result.injectionAttemptDetected) {
        sanitized.contact.email = result.sanitized;
        allWarnings.push(...result.warnings);
      }
    }
    if (sanitized.contact.phone) {
      const result = sanitizeInput(sanitized.contact.phone);
      if (result.injectionAttemptDetected) {
        sanitized.contact.phone = result.sanitized;
        allWarnings.push(...result.warnings);
      }
    }
    sanitizeField(sanitized.contact, 'city');
  }

  // Sanitize experience bullets
  if (Array.isArray(sanitized.experience)) {
    sanitized.experience.forEach((exp: any) => {
      sanitizeField(exp, 'title');
      sanitizeField(exp, 'company');
      sanitizeField(exp, 'city');
      if (Array.isArray(exp.bullets)) {
        exp.bullets = exp.bullets.map((bullet: string) => {
          if (typeof bullet === 'string') {
            const result = sanitizeInput(bullet);
            allWarnings.push(...result.warnings);
            return result.sanitized;
          }
          return bullet;
        });
      }
    });
  }

  // Sanitize education
  if (Array.isArray(sanitized.education)) {
    sanitized.education.forEach((edu: any) => {
      sanitizeField(edu, 'degree');
      sanitizeField(edu, 'field');
      sanitizeField(edu, 'school');
    });
  }

  // Sanitize skills
  if (Array.isArray(sanitized.skills)) {
    sanitized.skills = sanitized.skills.map((skill: string) => {
      if (typeof skill === 'string') {
        const result = sanitizeInput(skill);
        allWarnings.push(...result.warnings);
        return result.sanitized;
      }
      return skill;
    });
  }

  // Remove duplicate warnings
  const uniqueWarnings = Array.from(new Set(allWarnings));

  return {
    sanitized,
    warnings: uniqueWarnings,
  };
}

/**
 * Sanitize job description text
 */
export function sanitizeJdText(jdText: string): SanitizationResult {
  return sanitizeInput(jdText);
}
