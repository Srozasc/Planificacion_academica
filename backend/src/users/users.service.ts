import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { Role } from '../common';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findAll(queryDto: QueryUsersDto = {}) {
    const { page = 1, limit = 10, email, role_id, is_active, search } = queryDto;
    
    // Validar límites de seguridad
    const safeLimit = Math.min(limit, 100);
    const offset = (page - 1) * safeLimit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.deleted_at IS NULL'); // Solo usuarios no eliminados

    // Aplicar filtros
    if (email) {
      queryBuilder.andWhere('user.email_institucional LIKE :email', { 
        email: `%${email}%` 
      });
    }

    if (role_id) {
      queryBuilder.andWhere('user.role_id = :role_id', { role_id });
    }

    if (is_active !== undefined) {
      queryBuilder.andWhere('user.is_active = :is_active', { is_active });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.name LIKE :search OR user.email_institucional LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Aplicar paginación
    queryBuilder
      .orderBy('user.created_at', 'DESC')
      .skip(offset)
      .take(safeLimit);

    const [users, total] = await queryBuilder.getManyAndCount();

    // Transformar a DTO de respuesta
    const userDtos = users.map(user => plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true
    }));

    return {
      data: userDtos,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id AND user.deleted_at IS NULL', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true
    });
  }
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email_institucional, password, name, role_id, is_active = true, telefono, documento_identificacion } = createUserDto;

    // Verificar que el email no exista
    const existingUser = await this.userRepository.findOne({
      where: { email_institucional },
      withDeleted: true // Incluir eliminados para verificar unicidad
    });

    if (existingUser) {
      throw new ConflictException('El email institucional ya está en uso');
    }

    // Verificar que el rol exista
    const role = await this.roleRepository.findOne({
      where: { id: role_id, is_active: true }
    });

    if (!role) {
      throw new BadRequestException('El rol especificado no existe o no está activo');
    }    // Hashear contraseña si se proporciona
    let password_hash = null;
    if (password) {
      password_hash = await hash(password, 10);
    }    // Crear usuario
    const user = this.userRepository.create({
      email_institucional,
      password_hash,
      name: name.trim(),
      role_id,
      is_active,
      telefono,
      documento_identificacion,
    });

    const savedUser = await this.userRepository.save(user);

    // Retornar con información del rol
    return this.findOne(savedUser.id);
  }  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const { email_institucional, password, name, role_id, is_active, telefono, documento_identificacion } = updateUserDto;

    // Verificar que el usuario exista
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: false
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Si se actualiza el email, verificar unicidad
    if (email_institucional && email_institucional !== user.email_institucional) {
      const existingUser = await this.userRepository.findOne({
        where: { email_institucional },
        withDeleted: true
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('El email institucional ya está en uso');
      }
    }

    // Si se actualiza el rol, verificar que exista
    if (role_id && role_id !== user.role_id) {
      const role = await this.roleRepository.findOne({
        where: { id: role_id, is_active: true }
      });

      if (!role) {
        throw new BadRequestException('El rol especificado no existe o no está activo');
      }
    }

    // Preparar datos de actualización
    const updateData: Partial<User> = {};    if (email_institucional) updateData.email_institucional = email_institucional;
    if (name) updateData.name = name.trim();
    if (role_id) updateData.role_id = role_id;
    if (is_active !== undefined) updateData.is_active = is_active;    if (telefono !== undefined) updateData.telefono = telefono;
    if (documento_identificacion !== undefined) updateData.documento_identificacion = documento_identificacion;

    // Hashear nueva contraseña si se proporciona
    if (password) {
      updateData.password_hash = await hash(password, 10);
    }

    // Actualizar usuario
    await this.userRepository.update(id, updateData);

    // Retornar usuario actualizado
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Verificar que el usuario exista
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: false
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Soft delete
    await this.userRepository.softDelete(id);

    return { message: `Usuario con ID ${id} eliminado correctamente` };
  }
  // Método auxiliar para buscar por email (para autenticación)
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email_institucional: email, is_active: true },
      relations: ['role'],
      withDeleted: false
    });
  }
}
