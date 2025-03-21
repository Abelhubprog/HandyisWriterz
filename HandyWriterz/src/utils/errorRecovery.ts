import { type ErrorInfo } from 'react';

export interface RecoveryAttempt {
  strategy: string;
  timestamp: string;
  success: boolean;
}

export interface ErrorState {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  errorInfo?: {
    componentStack: string;
  } | null;
  timestamp: string;
  retryCount: number;
  errorId: string;
  recoveryAttempts?: RecoveryAttempt[];
}

export interface RecoveryStrategy {
  name: string;
  condition: (error: Error) => boolean;
  action: (error: Error) => Promise<void>;
  maxRetries?: number;
}

class ErrorRecoveryManager {
  private static instance: ErrorRecoveryManager;
  private strategies: RecoveryStrategy[] = [];
  private readonly storageKey = 'error_recovery_state';
  private readonly maxStoredErrors = 10;

  private constructor() {
    this.initializeDefaultStrategies();
  }

  public static getInstance(): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager();
    }
    return ErrorRecoveryManager.instance;
  }

  private initializeDefaultStrategies() {
    // Network error recovery
    this.addStrategy({
      name: 'network-retry',
      condition: (error) => 
        error.name === 'NetworkError' || 
        error.message.toLowerCase().includes('network') ||
        error.message.toLowerCase().includes('fetch'),
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Attempt to reload resources
        await Promise.all([
          window.location.reload(),
          this.clearCache()
        ]);
      },
      maxRetries: 3
    });

    // Authentication error recovery
    this.addStrategy({
      name: 'auth-refresh',
      condition: (error) => 
        error.name === 'AuthenticationError' ||
        error.message.toLowerCase().includes('unauthorized') ||
        error.message.toLowerCase().includes('unauthenticated'),
      action: async () => {
        const authModule = await import('@/hooks/useAppKitAuth');
        const { refreshAuth } = authModule.useAppKit();
        await refreshAuth();
      },
      maxRetries: 1
    });

    // Storage cleanup for quota errors
    this.addStrategy({
      name: 'storage-cleanup',
      condition: (error) => 
        error.name === 'QuotaExceededError' ||
        error.message.toLowerCase().includes('quota') ||
        error.message.toLowerCase().includes('storage full'),
      action: async () => {
        await this.clearOldErrors();
        await this.clearCache();
      },
      maxRetries: 1
    });
  }

  public addStrategy(strategy: RecoveryStrategy) {
    this.strategies = [...this.strategies.filter(s => s.name !== strategy.name), strategy];
  }

  public async handleError(error: Error, errorInfo?: ErrorInfo): Promise<boolean> {
    const errorState: ErrorState = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: errorInfo ? {
        componentStack: errorInfo.componentStack || 'No component stack available'
      } : null,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      errorId: crypto.randomUUID(),
      recoveryAttempts: []
    };

    // Store error state
    await this.storeErrorState(errorState);

    // Find and execute matching recovery strategies
    const matchingStrategies = this.strategies.filter(s => s.condition(error));
    
    for (const strategy of matchingStrategies) {
      try {
        await strategy.action(error);
        
        // Update recovery attempts
        errorState.recoveryAttempts?.push({
          strategy: strategy.name,
          timestamp: new Date().toISOString(),
          success: true
        });
        
        await this.updateErrorState(errorState);
        return true;
      } catch (recoveryError) {
        console.error(`Recovery strategy ${strategy.name} failed:`, recoveryError);
        
        // Log failed attempt
        errorState.recoveryAttempts?.push({
          strategy: strategy.name,
          timestamp: new Date().toISOString(),
          success: false
        });
        
        await this.updateErrorState(errorState);
      }
    }

    return false;
  }

  private async updateErrorState(state: ErrorState) {
    try {
      const stored = await this.getStoredErrors();
      const index = stored.findIndex(e => e.errorId === state.errorId);
      
      if (index !== -1) {
        stored[index] = state;
        localStorage.setItem(this.storageKey, JSON.stringify(stored));
      }
    } catch (e) {
      console.error('Failed to update error state:', e);
    }
  }

  private async storeErrorState(state: ErrorState) {
    try {
      const stored = await this.getStoredErrors();
      stored.unshift(state);
      
      // Keep only the most recent errors
      const trimmed = stored.slice(0, this.maxStoredErrors);
      
      localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to store error state:', e);
    }
  }

  private async getStoredErrors(): Promise<ErrorState[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private async removeErrorState(errorId: string) {
    try {
      const stored = await this.getStoredErrors();
      const filtered = stored.filter(state => state.errorId !== errorId);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to remove error state:', e);
    }
  }

  private async clearOldErrors() {
    try {
      const stored = await this.getStoredErrors();
      const now = new Date().getTime();
      const dayAgo = now - (24 * 60 * 60 * 1000);

      const recent = stored.filter(state => {
        const timestamp = new Date(state.timestamp).getTime();
        return timestamp > dayAgo;
      });

      localStorage.setItem(this.storageKey, JSON.stringify(recent));
    } catch (e) {
      console.error('Failed to clear old errors:', e);
    }
  }

  private async clearCache() {
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      } catch (e) {
        console.error('Failed to clear cache:', e);
      }
    }
  }

  public async getErrorHistory(): Promise<ErrorState[]> {
    return this.getStoredErrors();
  }

  public clearErrorHistory(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export const errorRecovery = ErrorRecoveryManager.getInstance();

// Helper hook for components
export function useErrorRecovery() {
  return {
    handleError: errorRecovery.handleError.bind(errorRecovery),
    getErrorHistory: errorRecovery.getErrorHistory.bind(errorRecovery),
    clearErrorHistory: errorRecovery.clearErrorHistory.bind(errorRecovery),
    addStrategy: errorRecovery.addStrategy.bind(errorRecovery)
  };
}
