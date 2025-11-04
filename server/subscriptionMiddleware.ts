// Subscription and usage limit middleware
import type { RequestHandler } from "express";
import { storage } from "./storage";

// Freemium limits
const FREE_LIMITS = {
  messagesPerDay: 10,
  reviewsPerMonth: 1
};

// Premium pathways - require paid subscription
const PREMIUM_PATHWAYS = [
  "tailor_to_job",
  "interview",
  "cover_letter",
  "future_plan",
  "skills_gap",
  "build_from_zero",
  "resume_review" // Resume review also requires premium
];

// Free pathways - available to all users
const FREE_PATHWAYS = [
  "career_chat"
];

interface SubscriptionCheckResult {
  allowed: boolean;
  reason?: string;
  remainingMessages?: number;
  remainingReviews?: number;
}

export async function checkSubscriptionStatus(userId: string): Promise<{
  isPremium: boolean;
  subscription: any;
}> {
  const subscription = await storage.getUserSubscription(userId);
  
  const isPremium = subscription && 
    (subscription.plan === "monthly" || subscription.plan === "annual") && 
    subscription.status === "active";
  
  return { isPremium, subscription };
}

export async function checkUsageLimits(userId: string, pathway?: string): Promise<SubscriptionCheckResult> {
  const { isPremium } = await checkSubscriptionStatus(userId);
  
  // Premium users have unlimited access
  if (isPremium) {
    return { allowed: true };
  }
  
  // Check if pathway is premium-only
  if (pathway && PREMIUM_PATHWAYS.includes(pathway)) {
    return {
      allowed: false,
      reason: "premium_pathway",
    };
  }
  
  // Check daily message limit for free users
  const usage = await storage.getUserUsage(userId);
  if (!usage) {
    return { allowed: true };
  }
  
  const remainingMessages = FREE_LIMITS.messagesPerDay - usage.messagesCount;
  const remainingReviews = FREE_LIMITS.reviewsPerMonth - usage.reviewsCount;
  
  if (usage.messagesCount >= FREE_LIMITS.messagesPerDay) {
    return {
      allowed: false,
      reason: "daily_limit_reached",
      remainingMessages: 0,
      remainingReviews
    };
  }
  
  return {
    allowed: true,
    remainingMessages,
    remainingReviews
  };
}

// Middleware to check usage limits before processing requests
export const checkLimits: RequestHandler = async (req, res, next) => {
  // Allow unauthenticated users for backward compatibility (they get limited functionality)
  if (!req.isAuthenticated()) {
    return next();
  }
  
  const user = req.user as any;
  const userId = user.claims.sub;
  const pathway = req.body.path as string | undefined;
  
  const check = await checkUsageLimits(userId, pathway);
  
  if (!check.allowed) {
    if (check.reason === "premium_pathway") {
      return res.status(403).json({
        error: "premium_required",
        message: "هذه الميزة متاحة فقط للمشتركين في الخطة المميزة",
        messageEn: "This feature is only available to premium subscribers",
        pathway
      });
    }
    
    if (check.reason === "daily_limit_reached") {
      return res.status(429).json({
        error: "daily_limit_reached",
        message: `لقد وصلت إلى الحد اليومي (${FREE_LIMITS.messagesPerDay} رسائل). قم بالترقية إلى الخطة المميزة للاستخدام غير المحدود.`,
        messageEn: `You've reached your daily limit (${FREE_LIMITS.messagesPerDay} messages). Upgrade to premium for unlimited usage.`,
        limit: FREE_LIMITS.messagesPerDay,
        remaining: 0
      });
    }
  }
  
  // Attach usage info to request for tracking
  (req as any).usageCheck = check;
  next();
};

// Middleware to track usage after successful requests
export const trackUsage: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  
  const user = req.user as any;
  const userId = user.claims.sub;
  const pathway = req.body.path as string | undefined;
  
  // Track message
  await storage.incrementMessageCount(userId);
  
  // Track review if this is a resume review pathway
  if (pathway === "resume_review") {
    await storage.incrementReviewCount(userId);
  }
  
  next();
};

// Get user usage stats
export async function getUserUsageStats(userId: string) {
  const usage = await storage.getUserUsage(userId);
  const { isPremium } = await checkSubscriptionStatus(userId);
  
  if (isPremium) {
    return {
      plan: "premium",
      messagesUsed: 0,
      messagesLimit: "unlimited",
      reviewsUsed: 0,
      reviewsLimit: "unlimited"
    };
  }
  
  return {
    plan: "free",
    messagesUsed: usage?.messagesCount || 0,
    messagesLimit: FREE_LIMITS.messagesPerDay,
    reviewsUsed: usage?.reviewsCount || 0,
    reviewsLimit: FREE_LIMITS.reviewsPerMonth
  };
}
