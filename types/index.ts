export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
  /** TIMEOUT | NETWORK | CANCELLED, or a backend error code such as DELIVERY_SLOT_UNAVAILABLE. */
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
