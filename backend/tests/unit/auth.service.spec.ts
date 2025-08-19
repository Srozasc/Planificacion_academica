import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from 'src/auth/dto/login.dto';

// Mocks
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

const mockJwtService = {
  sign: jest.fn(),
};

const mockEntityManager = {
  query: jest.fn(),
};

const mockUsersService = {
  checkAndRevertExpiredRole: jest.fn(),
  findOne: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let entityManager: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: EntityManager, useValue: mockEntityManager },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    entityManager = module.get<EntityManager>(EntityManager);

    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email_institucional: 'test@example.com',
      password: 'password123',
    };

    const mockUserDbResult = {
      id: 1,
      password_hash: 'hashed_password',
      name: 'Test User',
      is_active: true,
      role_id: 1,
      role_name: 'Editor',
      role_expires_at: null,
      previous_role_id: null,
    };

    const mockUserFindOneResult = {
      id: 1,
      emailInstitucional: 'test@example.com',
      name: 'Test User',
      roleId: 1,
      roleName: 'Editor',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      roleExpiresAt: null,
      previousRoleId: null,
      previousRoleName: null,
    };

    // No hay beforeEach global para mockEntityManager.query aquí.
    // Cada prueba configurará sus propios mocks de query.

    it('debería autenticar un usuario y retornar un token', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockEntityManager.query.mockResolvedValueOnce([mockUserDbResult]); // Primera query para obtener usuario
      mockEntityManager.query.mockResolvedValueOnce([[]]); // Segunda query para permisos (vacío por simplicidad)
      mockUsersService.checkAndRevertExpiredRole.mockResolvedValue(false); // Por defecto, no hay reversión
      mockUsersService.findOne.mockResolvedValue(mockUserFindOneResult); // findOne devuelve el usuario sin cambios
      mockJwtService.sign.mockReturnValue('mock_jwt_token');

      const result = await service.login(loginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUserDbResult.password_hash);
      expect(mockUsersService.checkAndRevertExpiredRole).toHaveBeenCalledWith(mockUserDbResult.id);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(mockUserDbResult.id);
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(result.access_token).toBe('mock_jwt_token');
      expect(result.user.email).toBe(loginDto.email_institucional);
      expect(result.user.role).toBe(mockUserFindOneResult.roleName);
    });

    it('debería lanzar UnauthorizedException si el usuario no es encontrado', async () => {
      mockEntityManager.query.mockResolvedValueOnce([null]); // Simula que el usuario no existe
      await expect(service.login(loginDto)).rejects.toThrow(new UnauthorizedException('Usuario no encontrado'));
    });

    it('debería lanzar UnauthorizedException si la cuenta está deshabilitada', async () => {
      mockEntityManager.query.mockResolvedValueOnce([{ ...mockUserDbResult, is_active: false }]); // Simula usuario deshabilitado
      await expect(service.login(loginDto)).rejects.toThrow(new UnauthorizedException('Cuenta deshabilitada'));
    });

    it('debería lanzar UnauthorizedException si las credenciales son inválidas', async () => {
      mockEntityManager.query.mockResolvedValueOnce([mockUserDbResult]); // Usuario existe
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Contraseña inválida
      await expect(service.login(loginDto)).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));
    });

    it('debería llamar a checkAndRevertExpiredRole y actualizar el rol si ha expirado', async () => {
      const expiredDate = new Date(Date.now() - 86400000); // Ayer
      const userWithExpiredRole = {
        ...mockUserDbResult,
        role_id: 2, // Rol temporal
        role_name: 'Temporal',
        role_expires_at: expiredDate,
        previous_role_id: 1,
      };
      const userAfterRevert = {
        ...mockUserFindOneResult,
        roleId: 1,
        roleName: 'Editor', // Rol revertido
        roleExpiresAt: null,
        previousRoleId: null,
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Asegurar que la contraseña es válida para esta prueba
      mockEntityManager.query.mockResolvedValueOnce([userWithExpiredRole]); // Primera query: usuario con rol expirado
      mockEntityManager.query.mockResolvedValueOnce([[]]); // Segunda query: permisos
      mockUsersService.checkAndRevertExpiredRole.mockResolvedValue(true); // Simula que el rol fue revertido
      mockUsersService.findOne.mockResolvedValue(userAfterRevert); // findOne devuelve el usuario con el rol revertido

      const result = await service.login(loginDto);

      expect(mockUsersService.checkAndRevertExpiredRole).toHaveBeenCalledWith(userWithExpiredRole.id);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userWithExpiredRole.id);
      expect(result.user.role).toBe('Editor'); // Verificar que el rol en el token es el revertido
    });


  });
});