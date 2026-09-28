export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public type: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class RateLimitError extends ApiError {
  constructor(
    public retryAfter: number,
    message: string = 'Rate limit exceeded'
  ) {
    super(429, 'rate_limit_exceeded', 'rate_limit_error', message);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, 'not_found', 'not_found_error', message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ValidationError extends ApiError {
  constructor(
    public errors: Array<{ field: string; message: string }>,
    message: string = 'Validation error'
  ) {
    super(400, 'validation_error', 'validation_error', message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(401, 'authentication_error', 'authentication_error', message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access forbidden') {
    super(403, 'authorization_error', 'authorization_error', message);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    type?: string;
    message?: string;
    errors?: Array<{ field: string; message: string }>;
  };
  message?: string;
  code?: string;
  type?: string;
  validation_errors?: Array<{
    code: string;
    path: string[];
    message: string;
    expected?: string;
    received?: string;
  }>;
}

export function parseApiError(
  statusCode: number,
  data: unknown,
  retryAfter?: number
): ApiError {
  const errorData = data as ApiErrorResponse;
  let message =
    errorData?.error?.message || errorData?.message || 'Unknown error';
  const code = errorData?.error?.code || errorData?.code || 'unknown_error';
  const type = errorData?.error?.type || errorData?.type || 'api_error';

  if (statusCode === 429) {
    return new RateLimitError(retryAfter || 60, message);
  }

  if (statusCode === 404) {
    return new NotFoundError(message);
  }

  if (statusCode === 401) {
    return new AuthenticationError(message);
  }

  if (statusCode === 403) {
    return new AuthorizationError(message);
  }

  // Handle validation errors from error.errors format
  if (statusCode === 400 && errorData?.error?.errors) {
    // Enhanced error message for validation errors
    const fieldErrors = errorData.error.errors
      .map((e) => `${e.field}: ${e.message}`)
      .join(', ');
    message = `${message} - ${fieldErrors}`;
    return new ValidationError(errorData.error.errors, message);
  }

  // Handle validation errors from root-level validation_errors format
  if (statusCode === 400 && errorData?.validation_errors) {
    const fieldErrors = errorData.validation_errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    message = `${message} - ${fieldErrors}`;
    const formattedErrors = errorData.validation_errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return new ValidationError(formattedErrors, message);
  }

  // Add helpful hints for common filter/attribute errors
  if (statusCode === 400) {
    const lowerMessage = message.toLowerCase();
    if (
      lowerMessage.includes('filter') ||
      lowerMessage.includes('attribute') ||
      lowerMessage.includes('operator')
    ) {
      message +=
        '\n\nTip: Check attribute slugs and valid operators for your object.';
      message +=
        '\nUse: attio object attributes <object> --format table to see available attributes.';
    }

    if (lowerMessage.includes('unknown attribute')) {
      message +=
        '\n\nCommon operators: $eq, $contains, $starts_with, $ends_with';
    }
  }

  return new ApiError(statusCode, code, type, message);
}
