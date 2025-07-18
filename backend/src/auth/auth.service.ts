import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { TokenPayloadDto, LoginResponseDto } from './dto/token-payload.dto';
import { UsersService } from '../users/users.service'; // Importar UsersService

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly usersService: UsersService, // Inyectar UsersService
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    // Primero obtener el usuario y su hash almacenado
    const [userResultInitial] = await this.entityManager.query(
      `SELECT u.id, u.password_hash, u.name, u.is_active, u.role_id, u.role_expires_at, u.previous_role_id, r.name as role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.email_institucional = ?`,
      [loginDto.email_institucional]
    );

    if (!userResultInitial) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!userResultInitial.is_active) {
      throw new UnauthorizedException('Cuenta deshabilitada');
    }

    // Verificar la contraseña usando bcrypt.compare
    const isPasswordValid = await bcrypt.compare(loginDto.password, userResultInitial.password_hash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // *** Lógica para verificar y revertir rol temporal ***
    await this.usersService.checkAndRevertExpiredRole(userResultInitial.id);

    // Obtener los datos del usuario actualizados después de la posible reversión del rol
    const userResult = await this.usersService.findOne(userResultInitial.id);

    if (!userResult) {
      // Esto no debería pasar si userResultInitial existía, pero es una buena práctica
      throw new UnauthorizedException('Error al obtener datos de usuario actualizados');
    }

    // Obtener permisos del usuario con el rol actualizado
    const permissions = await this.getUserPermissions(userResult.id);
    
    // Crear payload del JWT con los datos actualizados
    const payload: TokenPayloadDto = {
      userId: userResult.id,
      email: userResult.emailInstitucional,
      name: userResult.name,
      role: userResult.roleName, // Usar el roleName actualizado
      permissions: permissions.map(p => p.permission_name),
    };

    // Generar token
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: userResult.id,
        email: userResult.emailInstitucional,
        name: userResult.name,
        role: userResult.roleName, // Usar el roleName actualizado
        permissions: permissions.map(p => p.permission_name),
      },
    };
  }

  async getUserPermissions(userId: number): Promise<Array<{permission_name: string, permission_description: string}>> {
    const result = await this.entityManager.query('CALL sp_GetUserPermissions(?)', [userId]);
    
    // Los stored procedures pueden devolver arrays anidados en TypeORM
    // Verificar si es un array de arrays
    if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
      return result[0];
    }
    
    // Si es un array simple, usarlo directamente
    return result;
  }

  async validateUser(payload: TokenPayloadDto): Promise<any> {
    // Validar que el usuario sigue siendo válido
    try {
      const [user] = await this.entityManager.query(
        'SELECT id, email_institucional, name, is_active FROM users WHERE id = ? AND is_active = TRUE',
        [payload.userId]
      );
      
      if (!user) {
        return null;
      }

      return {
        userId: user.id,
        email: user.email_institucional,
        name: user.name,
        role: payload.role,
        permissions: payload.permissions,
      };
    } catch (error) {
      return null;
    }
  }

  // Método para cambiar contraseña del usuario autenticado
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{message: string}> {
    // Obtener la contraseña actual del usuario
    const [user] = await this.entityManager.query(
      'SELECT password_hash FROM users WHERE id = ? AND is_active = TRUE',
      [userId]
    );

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar que la contraseña actual sea correcta
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword, 
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    
    // Actualizar la contraseña en la base de datos
    await this.entityManager.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedNewPassword, userId]
    );
    
    return { message: 'Contraseña actualizada correctamente' };
  }

  // TEMPORAL: Método para actualizar contraseña del admin
  async updateAdminPassword(): Promise<{message: string}> {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await this.entityManager.query(
      'UPDATE users SET password_hash = ? WHERE email_institucional = ?',
      [hashedPassword, 'admin@planificacion.edu']
    );
    
    return { message: 'Contraseña del admin actualizada correctamente' };
  }

  async getRoles(): Promise<Array<{id: number, name: string, description: string}>> {
    const roles = await this.entityManager.query(
      'SELECT id, name, description FROM roles WHERE is_active = TRUE ORDER BY name'
    );
    return roles;
  }
}