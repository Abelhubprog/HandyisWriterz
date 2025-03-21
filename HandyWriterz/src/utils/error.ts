interface ErrorWithMessage {
  message: string;
  name?: string;
  stack?: string;
  code?: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example
    return new Error(String(maybeError));
  }
}

/**
 * Get a consistently formatted error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message;
}

/**
 * Log error to console and any error reporting service
 */
export function reportError(error: unknown, context?: Record<string, unknown>) {
  const errorWithMessage = toErrorWithMessage(error);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: errorWithMessage.message,
      name: errorWithMessage.name,
      stack: errorWithMessage.stack,
      code: errorWithMessage.code,
      context
    });
  }

  // Here you would typically send to your error reporting service
  // Example: Sentry.captureException(error, { extra: context });
}

/**
 * Creates a promise rejection handler
 * @example window.addEventListener('unhandledrejection', createUnhandledRejectionHandler('AppName'))
 */
export function createUnhandledRejectionHandler(source: string) {
  return (event: PromiseRejectionEvent) => {
    reportError(event.reason, {
      type: 'unhandledRejection',
      source,
      promise: event.promise
    });
  };
}
