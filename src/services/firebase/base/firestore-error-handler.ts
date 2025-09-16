import { FirebaseError } from 'firebase/app';

export interface ErrorContext {
  operation: string;
  collectionName: string;
  documentId?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorDetails {
  code: string;
  message: string;
  userMessage: string;
  isRetryable: boolean;
  suggestedAction?: string;
}

export class FirestoreErrorHandler {
  private static readonly RETRYABLE_CODES = new Set([
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'internal',
    'cancelled',
  ]);

  private static readonly USER_FRIENDLY_MESSAGES = new Map<string, string>([
    ['not-found', 'The requested item could not be found.'],
    ['permission-denied', 'You do not have permission to perform this action.'],
    [
      'unavailable',
      'The service is temporarily unavailable. Please try again later.',
    ],
    ['deadline-exceeded', 'The operation timed out. Please try again.'],
    [
      'resource-exhausted',
      'Too many requests. Please wait a moment and try again.',
    ],
    [
      'invalid-argument',
      'The provided data is invalid. Please check and try again.',
    ],
    ['already-exists', 'An item with this identifier already exists.'],
    [
      'failed-precondition',
      'The operation cannot be completed due to current conditions.',
    ],
    ['out-of-range', 'The requested data is outside the valid range.'],
    ['unauthenticated', 'Please sign in to continue.'],
    ['cancelled', 'The operation was cancelled. Please try again.'],
    ['data-loss', 'Data corruption detected. Please contact support.'],
    ['unknown', 'An unexpected error occurred. Please try again.'],
    ['internal', 'An internal error occurred. Please try again later.'],
  ]);

  /**
   * Handle and format Firestore errors
   */
  static handleError(error: unknown, context: ErrorContext): ErrorDetails {
    console.error('Firestore error in operation:', context.operation, {
      error,
      context,
    });

    if (error instanceof FirebaseError) {
      return this.handleFirebaseError(error, context);
    }

    if (error instanceof Error) {
      return this.handleGenericError(error, context);
    }

    return this.handleUnknownError(error, context);
  }

  /**
   * Handle Firebase-specific errors
   */
  private static handleFirebaseError(
    error: FirebaseError,
    context: ErrorContext
  ): ErrorDetails {
    const code = error.code;
    const userMessage =
      this.USER_FRIENDLY_MESSAGES.get(code) ||
      'An unexpected error occurred. Please try again.';
    const isRetryable = this.RETRYABLE_CODES.has(code);

    let suggestedAction: string | undefined;

    switch (code) {
      case 'permission-denied':
        suggestedAction = 'Check your permissions or contact an administrator.';
        break;
      case 'not-found':
        suggestedAction = 'Verify the item exists and try again.';
        break;
      case 'unavailable':
      case 'deadline-exceeded':
      case 'resource-exhausted':
        suggestedAction = 'Wait a moment and try again.';
        break;
      case 'invalid-argument':
        suggestedAction = 'Check the provided data for errors.';
        break;
      case 'unauthenticated':
        suggestedAction = 'Sign in to your account.';
        break;
    }

    return {
      code,
      message: error.message,
      userMessage,
      isRetryable,
      suggestedAction,
    };
  }

  /**
   * Handle generic JavaScript errors
   */
  private static handleGenericError(
    error: Error,
    context: ErrorContext
  ): ErrorDetails {
    return {
      code: 'generic-error',
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      isRetryable: false,
      suggestedAction: 'If the problem persists, please contact support.',
    };
  }

  /**
   * Handle unknown error types
   */
  private static handleUnknownError(
    error: unknown,
    context: ErrorContext
  ): ErrorDetails {
    return {
      code: 'unknown-error',
      message: String(error),
      userMessage: 'An unexpected error occurred. Please try again.',
      isRetryable: false,
      suggestedAction: 'If the problem persists, please contact support.',
    };
  }

  /**
   * Log error with context for debugging
   */
  static logError(error: unknown, context: ErrorContext): void {
    const errorDetails = this.handleError(error, context);

    console.error('Firestore Operation Error:', {
      operation: context.operation,
      collection: context.collectionName,
      documentId: context.documentId,
      errorCode: errorDetails.code,
      errorMessage: errorDetails.message,
      userMessage: errorDetails.userMessage,
      isRetryable: errorDetails.isRetryable,
      additionalData: context.additionalData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Create a standardized error for throwing
   */
  static createError(
    message: string,
    code: string,
    originalError?: Error
  ): Error {
    const error = new Error(message);
    (error as any).code = code;
    (error as any).originalError = originalError;
    return error;
  }

  /**
   * Wrap async operations with error handling
   */
  static async wrapOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const errorDetails = this.handleError(error, context);
      this.logError(error, context);

      // Re-throw with enhanced error information
      const enhancedError = this.createError(
        errorDetails.userMessage,
        errorDetails.code,
        error instanceof Error ? error : undefined
      );

      (enhancedError as any).isRetryable = errorDetails.isRetryable;
      (enhancedError as any).suggestedAction = errorDetails.suggestedAction;

      throw enhancedError;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.wrapOperation(operation, {
          ...context,
          operation: `${context.operation} (attempt ${attempt}/${maxRetries})`,
        });
      } catch (error) {
        lastError = error as Error;
        const errorDetails = this.handleError(error, context);

        if (!errorDetails.isRetryable || attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay =
          baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(
          `Retrying operation after ${delay}ms (attempt ${attempt}/${maxRetries})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}
