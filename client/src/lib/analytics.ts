// Analytics event tracking utility
// Events are tracked with descriptive names in English for consistency
// Can be connected to Google Analytics, Mixpanel, or other services

export type AnalyticsEvent =
  // Landing page interactions
  | "hero_cta_click"
  | "signin_click"
  | "chip_select"
  
  // File upload events
  | "upload_started"
  | "upload_success"
  | "upload_failed"
  | "parse_success"
  | "parse_failed"
  | "ocr_started"
  | "ocr_success"
  | "ocr_failed"
  
  // Pathway events
  | "pathway_selected"
  | "jd_tailor_started"
  | "jd_tailor_done"
  | "resume_rewrite_done"
  | "interview_started"
  | "interview_complete"
  | "future_plan_generated"
  | "cover_letter_generated"
  
  // Export events
  | "export_docx"
  | "export_pdf"
  | "export_failed"
  
  // LLM events
  | "llm_request_started"
  | "llm_request_success"
  | "llm_request_failed"
  | "llm_timeout"
  
  // Auth events
  | "auth_started"
  | "auth_success"
  | "auth_failed"
  | "session_linked";

interface AnalyticsEventData {
  event: AnalyticsEvent;
  properties?: Record<string, any>;
  timestamp?: number;
}

class Analytics {
  private enabled: boolean = true;
  
  constructor() {
    // Check if user has opted out of analytics
    if (typeof window !== "undefined") {
      const optOut = localStorage.getItem("analytics_opt_out");
      this.enabled = optOut !== "true";
    }
  }

  track(event: AnalyticsEvent, properties?: Record<string, any>) {
    if (!this.enabled) return;

    const data: AnalyticsEventData = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        language: document.documentElement.lang || "ar",
      },
      timestamp: Date.now(),
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log("📊 Analytics:", data);
    }

    // Send to analytics service
    this.send(data);
  }

  private send(data: AnalyticsEventData) {
    // TODO: Connect to your analytics service (Google Analytics, Mixpanel, etc.)
    // For now, we'll just store events locally for debugging
    
    try {
      // Example: Google Analytics 4
      if (typeof (window as any).gtag === "function") {
        (window as any).gtag("event", data.event, data.properties);
      }

      // Example: Mixpanel
      if (typeof (window as any).mixpanel === "object") {
        (window as any).mixpanel.track(data.event, data.properties);
      }

      // Store locally for debugging
      if (import.meta.env.DEV) {
        const events = JSON.parse(localStorage.getItem("analytics_events") || "[]");
        events.push(data);
        // Keep only last 100 events
        if (events.length > 100) events.shift();
        localStorage.setItem("analytics_events", JSON.stringify(events));
      }
    } catch (error) {
      console.error("Analytics error:", error);
    }
  }

  optOut() {
    this.enabled = false;
    localStorage.setItem("analytics_opt_out", "true");
  }

  optIn() {
    this.enabled = true;
    localStorage.removeItem("analytics_opt_out");
  }
}

// Export singleton instance
export const analytics = new Analytics();
