import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { TokenPayloadDto, LoginResponseDto } from './dto/token-payload.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    // Primero obtener el usuario y su hash almacenado
    const [userResult] = await this.entityManager.query(
      `SELECT u.id, u.password_hash, u.name, u.is_active, r.name as role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.email_institucional = ?`,
      [loginDto.email_institucional]
    );

    if (!userResult) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!userResult.is_active) {
      throw new UnauthorizedException('Cuenta deshabilitada');
    }

    // Verificar la contraseña usando bcrypt.compare
    const isPasswordValid = await bcrypt.compare(loginDto.password, userResult.password_hash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }    // Obtener permisos del usuario
    const permissions = await this.getUserPermissions(userResult.id);
    
    // Crear payload del JWT
    const payload: TokenPayloadDto = {
      userId: userResult.id,
      email: loginDto.email_institucional,
      name: userResult.name,
      role: userResult.role_name,
      permissions: permissions.map(p => p.permission_name),
    };

    // Generar token
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: userResult.id,
        email: loginDto.email_institucional,
        name: userResult.name,
        role: userResult.role_name,
        permissions: permissions.map(p => p.permission_name),
      },
    };
  }  async getUserPermissions(userId: number): Promise<Array<{permission_name: string, permission_description: string}>> {
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

  // TEMPORAL: Método para actualizar contraseña del admin
  async updateAdminPassword(): Promise<{message: string}> {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await this.entityManager.query(
      'UPDATE users SET password_hash = ? WHERE email_institucional = ?',
      [hashedPassword, 'admin@planificacion.edu']
    );
    
    return { message: 'Contraseña del admin actualizada correctamente' };
  }
}
