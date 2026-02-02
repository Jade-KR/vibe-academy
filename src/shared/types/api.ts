/**
 * Discriminated union for API responses.
 * All API routes return this shape.
 */
export interface ApiSuccessResponse<T = void> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<T = void> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Paginated list response for future use.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
