export class ApiError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) =>
  new ApiError(400, 'VALIDATION_ERROR', message, details);

export const unauthorized = (message = 'Authentication required', code = 'UNAUTHORIZED') =>
  new ApiError(401, code, message);

export const forbidden = (message = 'You do not have permission to do that', code = 'FORBIDDEN') =>
  new ApiError(403, code, message);

export const notFound = (message = 'Resource not found', code = 'NOT_FOUND') =>
  new ApiError(404, code, message);

export const conflict = (message, code = 'CONFLICT', details) =>
  new ApiError(409, code, message, details);
