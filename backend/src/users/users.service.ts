import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { QueryUsersDto } from './dto/query-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto, UsersListResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(queryDto: QueryUsersDto): Promise<UsersListResponseDto> {
    const { page = 1, limit = 10, search, roleId, isActive } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.previousRole', 'previousRole');

    // Aplicar filtros
    if (search) {
      queryBuilder.andWhere(
        '(user.name LIKE :search OR user.emailInstitucional LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (roleId !== undefined) {
      queryBuilder.andWhere('user.roleId = :roleId', { roleId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // Excluir usuarios eliminados
    queryBuilder.andWhere('user.deletedAt IS NULL');

    // Paginación
    queryBuilder.skip(skip).take(limit);

    // Ordenar por nombre
    queryBuilder.orderBy('user.name', 'ASC');

    const [users, total] = await queryBuilder.getManyAndCount();

    const userResponses: UserResponseDto[] = users.map(user => ({
      id: user.id,
      emailInstitucional: user.emailInstitucional,
      name: user.name,

      telefono: user.telefono,
      roleId: user.roleId,
      roleName: user.role?.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roleExpiresAt: user.roleExpiresAt,
      previousRoleId: user.previousRoleId,
      previousRoleName: user.previousRoleId ? user.previousRole?.name : undefined,
    }));

    return {
      users: userResponses,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['role'],
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      emailInstitucional: user.emailInstitucional,
      name: user.name,

      telefono: user.telefono,
      roleId: user.roleId,
      roleName: user.role?.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Verificar si el email ya existe
    const existingUserByEmail = await this.userRepository.findOne({
      where: { emailInstitucional: createUserDto.emailInstitucional, deletedAt: null },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Ya existe un usuario con este email institucional');
    }



    // Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Crear el nuevo usuario
    const userData: any = {
      emailInstitucional: createUserDto.emailInstitucional,
      passwordHash: hashedPassword,
      name: createUserDto.name,
      telefono: createUserDto.telefono,
      roleId: createUserDto.roleId,
      isActive: true,
    };

    // Agregar roleExpiresAt si está presente
    if (createUserDto.roleExpiresAt) {
      userData.roleExpiresAt = new Date(createUserDto.roleExpiresAt);
    }

    // Agregar previousRoleId si está presente
    if (createUserDto.previousRoleId) {
      userData.previousRoleId = createUserDto.previousRoleId;
    }

    const newUser = this.userRepository.create(userData);

    const savedUser = await this.userRepository.save(newUser) as unknown as User;

    // Obtener el usuario con la relación del rol
    const userWithRole = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role', 'previousRole'],
    });

    return {
      id: userWithRole.id,
      emailInstitucional: userWithRole.emailInstitucional,
      name: userWithRole.name,
      telefono: userWithRole.telefono,
      roleId: userWithRole.roleId,
      roleName: userWithRole.role?.name,
      roleExpiresAt: userWithRole.roleExpiresAt,
      previousRoleId: userWithRole.previousRoleId,
      previousRoleName: userWithRole.previousRole?.name,
      isActive: userWithRole.isActive,
      createdAt: userWithRole.createdAt,
      updatedAt: userWithRole.updatedAt,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Convertir roleExpiresAt de string a Date si está presente
    if (updateUserDto.roleExpiresAt) {
      updateUserDto.roleExpiresAt = new Date(updateUserDto.roleExpiresAt) as any;
    }

    // Aplicar los cambios directamente a la entidad
    Object.assign(user, updateUserDto);
    
    // Guardar los cambios usando save() para que TypeORM maneje correctamente las relaciones
    const savedUser = await this.userRepository.save(user);
    
    // Recargar la entidad con las relaciones para obtener el nombre del rol
    const userWithRole = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role', 'previousRole'],
    });

    return {
      id: userWithRole.id,
      emailInstitucional: userWithRole.emailInstitucional,
      name: userWithRole.name,
      telefono: userWithRole.telefono,
      roleId: userWithRole.roleId,
      roleName: userWithRole.role?.name,
      isActive: userWithRole.isActive,
      createdAt: userWithRole.createdAt,
      updatedAt: userWithRole.updatedAt,
      roleExpiresAt: userWithRole.roleExpiresAt,
      previousRoleId: userWithRole.previousRoleId,
      previousRoleName: userWithRole.previousRole?.name,
    };
  }

  async checkAndRevertExpiredRole(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user || !user.roleExpiresAt || !user.previousRoleId) {
      return false; // No tiene rol temporal o no hay rol anterior
    }

    const now = new Date();
    if (now > user.roleExpiresAt) {
      // El rol ha expirado, revertir al rol anterior
      user.roleId = user.previousRoleId;
      user.roleExpiresAt = null;
      user.previousRoleId = null;
      
      await this.userRepository.save(user);
      return true; // Se revirtió el rol
    }

    return false; // El rol aún no ha expirado
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Realizar soft delete
    await this.userRepository.softDelete(id);

    return {
      message: `Usuario ${user.name} eliminado exitosamente`,
    };
  }
}