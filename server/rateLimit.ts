// Rate limiting for AI calls - per session
// Limit: 20 AI requests per hour per session

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests = 20;
  private readonly windowMs = 60 * 60 * 1000; // 1 hour in milliseconds
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    const entries = Array.from(this.limits.entries());
    for (const [sessionId, entry] of entries) {
      if (now >= entry.resetTime) {
        this.limits.delete(sessionId);
      }
    }
  }

  checkLimit(sessionId: string): { allowed: boolean; minutesUntilReset?: number } {
    const now = Date.now();
    const entry = this.limits.get(sessionId);

    // No entry or expired - allow and create new entry
    if (!entry || now >= entry.resetTime) {
      this.limits.set(sessionId, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { allowed: true };
    }

    // Check if under limit
    if (entry.count < this.maxRequests) {
      entry.count++;
      return { allowed: true };
    }

    // Over limit - calculate minutes until reset
    const msUntilReset = entry.resetTime - now;
    const minutesUntilReset = Math.ceil(msUntilReset / (60 * 1000));

    return {
      allowed: false,
      minutesUntilReset,
    };
  }

  // For testing/admin purposes
  resetSession(sessionId: string) {
    this.limits.delete(sessionId);
  }

  // Get current usage for a session
  getUsage(sessionId: string): { count: number; limit: number; resetTime?: number } {
    const entry = this.limits.get(sessionId);
    const now = Date.now();

    if (!entry || now >= entry.resetTime) {
      return { count: 0, limit: this.maxRequests };
    }

    return {
      count: entry.count,
      limit: this.maxRequests,
      resetTime: entry.resetTime,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Helper to generate Arabic error message
export function getRateLimitErrorMessage(minutesUntilReset: number): string {
  return `لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة بعد ${minutesUntilReset} دقيقة`;
}
