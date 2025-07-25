import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../common/entities/role.entity';
import { UsuarioPermisoCarrera } from './entities/usuario-permiso-carrera.entity';
import { UsuarioPermisoCategoria } from './entities/usuario-permiso-categoria.entity';
import { PermisosPendientes } from './entities/permisos-pendientes.entity';
import { CarrerasModule } from '../carreras/carreras.module';
import { AsignaturasModule } from '../asignaturas/asignaturas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UsuarioPermisoCarrera, UsuarioPermisoCategoria, PermisosPendientes]),
    CarrerasModule,
    AsignaturasModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}