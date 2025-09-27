
export * from './vehicle.types';
export * from './booking.types';


export interface ApiError {
  error: string;
  message: string;
  details?: any[];
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
