import type { ErrorInfo } from 'react';

interface ErrorMetadata {
  timestamp: string;
  url: string;
  userAgent: string;
  sessionId?: string;
  userId?: string;
  [key: string]: any;
}

interface ErrorTrackingConfig {
  environment: 'development' | 'production' | 'test';
  sampleRate?: number;
  dsn?: string;
  enabled?: boolean;
  metadata?: Partial<ErrorMetadata>;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private config: ErrorTrackingConfig;
  private metadata: Partial<ErrorMetadata> = {};

  private constructor(config: ErrorTrackingConfig) {
    this.config = {
      sampleRate: 1.0,
      enabled: true,
      ...config
    };
  }

  public static getInstance(config?: ErrorTrackingConfig): ErrorTracker {
    if (!ErrorTracker.instance && config) {
      ErrorTracker.instance = new ErrorTracker(config);
    }
    return ErrorTracker.instance;
  }

  public setMetadata(metadata: Partial<ErrorMetadata>) {
    this.metadata = {
      ...this.metadata,
      ...metadata
    };
  }

  public captureError(error: Error, errorInfo?: ErrorInfo) {
    if (!this.shouldCaptureError()) return;

    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      metadata: {
        ...this.getDefaultMetadata(),
        ...this.metadata
      }
    };

    if (this.config.environment === 'development') {
      console.group('Error Captured');
      console.error(error);
      console.log('Error Info:', errorData);
      console.groupEnd();
      return;
    }

    // In production, send to error tracking service
    this.sendToErrorService(errorData);
  }

  private shouldCaptureError(): boolean {
    if (!this.config.enabled) return false;
    if (this.config.sampleRate === 1.0) return true;
    return Math.random() <= (this.config.sampleRate || 1.0);
  }

  private getDefaultMetadata(): ErrorMetadata {
    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
      ...this.config.metadata
    };
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('error_tracking_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('error_tracking_session', sessionId);
    }
    return sessionId;
  }

  private async sendToErrorService(errorData: any) {
    if (!this.config.dsn) return;

    try {
      const response = await fetch(this.config.dsn, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      });

      if (!response.ok) {
        console.error('Failed to send error to tracking service');
      }
    } catch (err) {
      console.error('Error sending to tracking service:', err);
    }
  }

  // User identification methods
  public identifyUser(userId: string, userData?: Record<string, any>) {
    this.setMetadata({
      userId,
      userData
    });
  }

  public clearUser() {
    const { userId, userData, ...rest } = this.metadata;
    this.metadata = rest;
  }

  // Add breadcrumb for error context
  public addBreadcrumb(message: string, category?: string) {
    const breadcrumbs = this.metadata.breadcrumbs || [];
    breadcrumbs.push({
      message,
      category,
      timestamp: new Date().toISOString()
    });

    this.setMetadata({
      breadcrumbs: breadcrumbs.slice(-10) // Keep last 10 breadcrumbs
    });
  }
}

// Create and export the error tracking hook
export function useErrorTracking() {
  const tracker = ErrorTracker.getInstance();

  return {
    captureError: tracker.captureError.bind(tracker),
    setMetadata: tracker.setMetadata.bind(tracker),
    identifyUser: tracker.identifyUser.bind(tracker),
    clearUser: tracker.clearUser.bind(tracker),
    addBreadcrumb: tracker.addBreadcrumb.bind(tracker)
  };
}

// Initialize error tracking
export function initializeErrorTracking(config: ErrorTrackingConfig) {
  return ErrorTracker.getInstance(config);
}

// Helper to create error context
export function createErrorContext(context: Record<string, any>) {
  const tracker = ErrorTracker.getInstance();
  tracker.setMetadata(context);
}
