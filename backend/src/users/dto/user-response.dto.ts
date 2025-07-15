export class UserResponseDto {
  id: number;
  emailInstitucional: string;
  name: string;
  documentoIdentificacion: string;
  telefono?: string;
  roleId: number;
  roleName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roleExpiresAt?: Date;
  previousRoleId?: number;
  previousRoleName?: string;
}

export class UsersListResponseDto {
  users: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
}