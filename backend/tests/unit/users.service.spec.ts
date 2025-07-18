
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

// Mock de bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

// Mock del repositorio de User
const mockUserRepository = {
  createQueryBuilder: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  // Pruebas para create()
  describe('create', () => {
    const createUserDto: CreateUserDto = {
      emailInstitucional: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      roleId: 1,
    };

    beforeEach(() => {
      // Reset findOne mock for each test in this describe block
      mockUserRepository.findOne.mockReset(); 
    });

    it('debería crear un usuario exitosamente', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null); // Primera llamada: no existe usuario
      const newUser = { id: 1, ...createUserDto, passwordHash: 'hashed_password' };
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);
      // Mock para la recarga con relaciones (segunda llamada a findOne)
      mockUserRepository.findOne.mockResolvedValueOnce({ ...newUser, role: { id: 1, name: 'Admin' } });

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.emailInstitucional).toBe(createUserDto.emailInstitucional);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUserRepository.save).toHaveBeenCalledWith(newUser);
    });

    it('debería lanzar ConflictException si el email ya existe', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ id: 2, emailInstitucional: 'test@example.com' });
      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  // Pruebas para findOne()
  describe('findOne', () => {
    it('debería retornar un usuario si se encuentra', async () => {
      const user = { id: 1, name: 'Test User', role: { id: 1, name: 'Admin' } };
      mockUserRepository.findOne.mockResolvedValue(user);
      const result = await service.findOne(1);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('debería retornar null si el usuario no se encuentra', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const result = await service.findOne(99);
      expect(result).toBeNull();
    });
  });

  // Pruebas para update()
  describe('update', () => {
    const updateUserDto: UpdateUserDto = { name: 'Updated Name' };
    const existingUser = { id: 1, name: 'Original Name' };

    it('debería actualizar un usuario exitosamente', async () => {
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockImplementation(user => Promise.resolve(user));
      // Mock para la recarga con relaciones
      mockUserRepository.findOne.mockResolvedValue({ ...existingUser, ...updateUserDto, role: { id: 1, name: 'Admin' } });

      const result = await service.update(1, updateUserDto);
      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Name');
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.update(99, updateUserDto)).rejects.toThrow(NotFoundException);
    });
  });

  // Pruebas para remove() (soft delete)
  describe('remove', () => {
    it('debería marcar un usuario como eliminado (soft delete)', async () => {
      const user = { id: 1, name: 'Test User' };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1);
      expect(result.message).toContain('eliminado exitosamente');
      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('debería lanzar NotFoundException si el usuario a eliminar no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });

  // Pruebas para checkAndRevertExpiredRole()
  describe('checkAndRevertExpiredRole', () => {
    it('debería revertir un rol expirado', async () => {
      const expiredDate = new Date(Date.now() - 86400000); // Ayer
      const user = { id: 1, roleId: 2, roleExpiresAt: expiredDate, previousRoleId: 1 };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({ ...user, roleId: 1, roleExpiresAt: null, previousRoleId: null });

      const result = await service.checkAndRevertExpiredRole(1);
      expect(result).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({ roleId: 1, roleExpiresAt: null }));
    });

    it('no debería revertir un rol no expirado', async () => {
      const futureDate = new Date(Date.now() + 86400000); // Mañana
      const user = { id: 1, roleId: 2, roleExpiresAt: futureDate, previousRoleId: 1 };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.checkAndRevertExpiredRole(1);
      expect(result).toBe(false);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});
