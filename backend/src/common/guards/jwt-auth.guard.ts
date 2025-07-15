import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../../users/entities/user.entity';

/**
 * JWT Authentication Guard
 * Moved to CommonModule to avoid cross-module dependencies
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      
      // Verificar si el rol del usuario ha expirado y revertirlo automáticamente
      if (payload.sub) {
        await this.checkAndRevertExpiredRole(payload.sub);
      }
      
      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * Verifica si el rol temporal del usuario ha expirado y lo revierte automáticamente
   */
  private async checkAndRevertExpiredRole(userId: number): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'roleId', 'roleExpiresAt', 'previousRoleId']
      });

      if (!user || !user.roleExpiresAt || !user.previousRoleId) {
        return; // No hay rol temporal o no hay datos de expiración
      }

      const now = new Date();
      if (now >= user.roleExpiresAt) {
        // El rol ha expirado, revertir al rol anterior
        await this.userRepository.update(user.id, {
          roleId: user.previousRoleId,
          roleExpiresAt: null,
          previousRoleId: null
        });
      }
    } catch (error) {
      // Log del error pero no interrumpir el flujo de autenticación
      console.error('Error al verificar rol expirado:', error);
    }
  }
}
