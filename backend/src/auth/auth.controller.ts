import { Controller, Post, Get, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/token-payload.dto';
import { JwtAuthGuard } from '../common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    // En JWT, el logout se maneja en el frontend eliminando el token
    // Aquí podríamos implementar blacklist de tokens si fuera necesario
    return { 
      message: 'Logout exitoso',
      statusCode: HttpStatus.OK 
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    // El usuario viene del JWT después de la validación
    const user = req.user;
    return {
      id: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
    };
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Req() req: any) {
    // Endpoint para validar si el token sigue siendo válido
    return {
      valid: true,
      user: {
        id: req.user.userId,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        permissions: req.user.permissions,
      },
    };
  }

  // TEMPORAL: Endpoint para actualizar contraseña del admin
  @Post('update-admin-password')
  @HttpCode(HttpStatus.OK)
  async updateAdminPassword() {
    return this.authService.updateAdminPassword();
  }
}
