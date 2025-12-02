/**
 * Error handling utilities
 * Provides safe error handling to prevent app crashes
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error. Please check your connection.') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Safely execute an async function with error handling
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback?: T,
  errorMessage?: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const message = errorMessage || 'An error occurred';
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Log error but don't crash
    if (__DEV__) {
      console.error(message, errorObj);
    }
    
    return fallback ?? null;
  }
}

/**
 * Parse error message from various error types
 */
export function parseErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('failed to fetch')
    );
  }
  
  return false;
}






