// Global types and interfaces
export interface User {
  id: number;
  email_institucional: string;
  name: string;
  role_id: number;
  documento_identificacion?: string;
  telefono?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role_name?: string;
}

export interface CreateUserDto {
  email_institucional: string;
  password: string;
  name: string;
  role_id: number;
  documento_identificacion?: string;
  telefono?: string;
}

export interface UpdateUserDto {
  email_institucional?: string;
  name?: string;
  role_id?: number;
  documento_identificacion?: string;
  telefono?: string;
  is_active?: boolean;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface QueryUsersDto {
  page?: number;
  limit?: number;
  search?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
