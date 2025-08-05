import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createPool } from 'mysql2/promise';
import { DatabaseService } from './services/database.service';
import { ResponseService } from './services/response.service';
import { AppLoggerService } from './services/logger.service';
import { BimestreService } from './services/bimestre.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Role } from './entities/role.entity';
import { Bimestre } from './entities/bimestre.entity';
import { User } from '../users/entities/user.entity';

/**
 * CommonModule - Módulo global que proporciona servicios compartidos
 * 
 * Responsabilidades:
 * - Configuración global de la aplicación
 * - Conexión a base de datos (TypeORM y MySQL2)
 * - Logger global
 * - Servicios base compartidos
 * 
 * Este módulo es importado globalmente y exporta servicios base
 * que pueden ser usados por cualquier módulo de la aplicación
 */
@Global()
@Module({  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // JWT para autenticación
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret',
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
        },
      }),
      inject: [ConfigService],
    }),    // TypeORM para entidades
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT')|| 3306,
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),        entities: [
          // Incluir las entidades base
          Role,
          Bimestre,
          __dirname + '/../**/*.entity{.ts,.js}'
        ],
        synchronize: false, // Deshabilitado ahora que las tablas ya están creadas
        logging: process.env.NODE_ENV === 'development',
        autoLoadEntities: true, // Esto carga automáticamente las entidades registradas con forFeature
        extra: {
          authPlugin: 'sha256_password',
        },
      }),
      inject: [ConfigService],
    }),    // Registrar entidades compartidas
    TypeOrmModule.forFeature([Role, Bimestre, User]),
  ],
  
  providers: [
    // Pool de conexiones MySQL2 para stored procedures
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: (configService: ConfigService) => {
        return createPool({
          host: configService.get('DATABASE_HOST') || 'localhost',
          port: configService.get('DATABASE_PORT') || 3306,
          user: configService.get('DATABASE_USERNAME'),
          password: configService.get('DATABASE_PASSWORD'),
          database: configService.get('DATABASE_NAME') || 'planificacion_academica',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });
      },
      inject: [ConfigService],
    },

    // Logger global
    AppLoggerService,
    {
      provide: 'LOGGER',
      useExisting: AppLoggerService,
    },

    // Configuración de aplicación
    {
      provide: 'APP_CONFIG',
      useFactory: (configService: ConfigService) => ({
        port: configService.get('PORT') || 3001,
        environment: configService.get('NODE_ENV') || 'development',
        jwtSecret: configService.get('JWT_SECRET') || 'default_secret',
        uploadMaxSize: configService.get('UPLOAD_MAX_SIZE') || 10485760, // 10MB
        corsOrigins: configService.get('CORS_ORIGINS')?.split(',') || ['http://localhost:5173'],
      }),
      inject: [ConfigService],
    },    // Servicios base compartidos
    DatabaseService,
    ResponseService,
    BimestreService,

    // Guards de autenticación y autorización
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    // Exportamos TypeORM para que los módulos puedan usarlo
    TypeOrmModule,
    
    // Exportamos JWT Module para que otros módulos puedan usarlo
    JwtModule,
    
    // Exportamos el pool de conexiones para stored procedures
    'DATABASE_CONNECTION',
    
    // Exportamos el logger global
    'LOGGER',
    AppLoggerService,
    
    // Exportamos la configuración de aplicación
    'APP_CONFIG',    // Exportamos servicios base
    DatabaseService,
    ResponseService,
    BimestreService,

    // Exportamos guards para uso en otros módulos
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class CommonModule {}
