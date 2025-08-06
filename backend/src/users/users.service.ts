import { Injectable, NotFoundException, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { User } from './entities/user.entity';
import { Role } from '../common/entities/role.entity';
import { UsuarioPermisoCarrera } from './entities/usuario-permiso-carrera.entity';
import { UsuarioPermisoCategoria } from './entities/usuario-permiso-categoria.entity';
import { PermisosPendientes } from './entities/permisos-pendientes.entity';
import { QueryUsersDto } from './dto/query-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto, UsersListResponseDto } from './dto/user-response.dto';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';
import { BimestreService } from '../common/services/bimestre.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UsuarioPermisoCarrera)
    private readonly usuarioPermisoCarreraRepository: Repository<UsuarioPermisoCarrera>,
    @InjectRepository(UsuarioPermisoCategoria)
    private usuarioPermisoCategoriaRepository: Repository<UsuarioPermisoCategoria>,
    @InjectRepository(PermisosPendientes)
    private permisosPendientesRepository: Repository<PermisosPendientes>,
    private readonly dataSource: DataSource,
    private readonly bimestreService: BimestreService,
  ) {}

  async findAll(queryDto: QueryUsersDto, bimestreId?: number): Promise<UsersListResponseDto> {
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

  async findOne(id: number, bimestreId?: number): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['role', 'previousRole'],
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
      roleExpiresAt: user.roleExpiresAt,
      previousRoleId: user.previousRoleId,
      previousRoleName: user.previousRoleId ? user.previousRole?.name : undefined,
    };
  }

  async create(createUserDto: CreateUserDto, bimestreId?: number): Promise<UserResponseDto> {
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

    // Usar el bimestre especificado o lanzar error si no se proporciona
    if (!bimestreId) {
      throw new BadRequestException('El bimestreId es requerido para la creación de usuarios');
    }
    const bimestreActivo = bimestreId;
    
    // Crear registros en permisos_pendientes para emular carga masiva
    if (createUserDto.tipoPermiso === 'categoria' && createUserDto.categorias && createUserDto.categorias.length > 0) {
      // Crear un registro por cada categoría
      for (const categoria of createUserDto.categorias) {
        const permisosPendientes = this.permisosPendientesRepository.create({
          usuarioMail: createUserDto.emailInstitucional,
          usuarioNombre: createUserDto.name,
          cargo: 'Usuario Manual', // Valor por defecto para usuarios creados manualmente
          permisoCarreraCodigo: null,
          tipoRol: userWithRole.role?.name || 'Visualizador',
          permisoCategoria: categoria,
          fechaExpiracion: createUserDto.roleExpiresAt ? new Date(createUserDto.roleExpiresAt) : null,
          estado: 'PENDIENTE',
          bimestre_id: bimestreActivo
        });
        await this.permisosPendientesRepository.save(permisosPendientes);
      }
    } else if (createUserDto.tipoPermiso === 'carrera' && createUserDto.carreras && createUserDto.carreras.length > 0) {
      // Obtener códigos de carrera
      const carreras = await this.dataSource.query(
        'SELECT id, codigo_plan FROM carreras WHERE id IN (?)',
        [createUserDto.carreras]
      );
      
      // Crear un registro por cada carrera
      for (const carrera of carreras) {
        const permisosPendientes = this.permisosPendientesRepository.create({
          usuarioMail: createUserDto.emailInstitucional,
          usuarioNombre: createUserDto.name,
          cargo: 'Usuario Manual',
          permisoCarreraCodigo: carrera.codigo_plan,
          tipoRol: userWithRole.role?.name || 'Visualizador',
          permisoCategoria: null,
          fechaExpiracion: createUserDto.roleExpiresAt ? new Date(createUserDto.roleExpiresAt) : null,
          estado: 'PENDIENTE',
          bimestre_id: bimestreActivo
        });
        await this.permisosPendientesRepository.save(permisosPendientes);
      }
    }

    // Ejecutar scripts de permisos si se crearon permisos
    if (createUserDto.tipoPermiso && ((createUserDto.categorias && createUserDto.categorias.length > 0) || (createUserDto.carreras && createUserDto.carreras.length > 0))) {
      try {
        console.log('🔄 Ejecutando scripts de permisos para usuario:', createUserDto.emailInstitucional);
        await this.executePermissionScriptsForUser();
        console.log('✅ Scripts de permisos ejecutados exitosamente');
      } catch (error) {
        console.error('❌ Error ejecutando scripts de permisos:', error);
        // No fallar la creación del usuario, solo loggear el error
      }
    }

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

  async update(id: number, updateUserDto: UpdateUserDto, bimestreId?: number): Promise<UserResponseDto> {
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

    // Si se está cambiando el rol, verificar si deja de ser Editor
    if (updateUserDto.roleId !== undefined) {
      // Buscar el rol Editor para comparar
      const editorRole = await this.roleRepository.findOne({ where: { name: 'Editor' } });
      
      // Si el usuario tenía rol Editor y ahora cambia a otro rol, limpiar campos temporales
      if (editorRole && user.roleId === editorRole.id && updateUserDto.roleId !== editorRole.id) {
        updateUserDto.roleExpiresAt = null as any;
        updateUserDto.previousRoleId = null;
      }
    }

    // Aplicar los cambios directamente a la entidad (excluyendo los campos de permisos)
    const { careerPermissionIds, categoryPermissionIds, ...userUpdateData } = updateUserDto;
    Object.assign(user, userUpdateData);
    
    // Usar transacción para garantizar consistencia
    return await this.dataSource.transaction(async manager => {
      // Guardar los cambios del usuario
      const savedUser = await manager.save(user);
      
      // Sincronizar permisos si se proporcionaron
      if (careerPermissionIds !== undefined) {
        await this.syncCareerPermissions(manager, savedUser.id, careerPermissionIds, bimestreId);
      }
      
      if (categoryPermissionIds !== undefined) {
        await this.syncCategoryPermissions(manager, savedUser.id, categoryPermissionIds, bimestreId);
      }
      
      // Recargar la entidad con las relaciones para obtener el nombre del rol
      const userWithRole = await manager.findOne(User, {
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
    });
  }

  private async syncCareerPermissions(manager: any, userId: number, careerPermissionIds: number[], bimestreId?: number): Promise<void> {
     // Determinar qué bimestre usar
     let bimestreAUsar;
     if (bimestreId) {
       // Usar el bimestre seleccionado
       bimestreAUsar = await this.bimestreService.findById(bimestreId);
       if (!bimestreAUsar) {
         throw new BadRequestException(`Bimestre con ID ${bimestreId} no encontrado`);
       }
     } else {
       // Fallback al bimestre activo
       bimestreAUsar = await this.bimestreService.findBimestreActual();
       if (!bimestreAUsar) {
         throw new BadRequestException('No hay un bimestre activo configurado');
       }
     }
     
     // Eliminar permisos de carrera existentes para el bimestre
     await manager.delete(UsuarioPermisoCarrera, { 
       usuario_id: userId, 
       bimestre_id: bimestreAUsar.id 
     });
     
     // Crear nuevos permisos de carrera
     if (careerPermissionIds.length > 0) {
       const permisosCarrera = careerPermissionIds.map(carreraId => 
         manager.create(UsuarioPermisoCarrera, {
           usuario_id: userId,
           carrera_id: carreraId,
           bimestre_id: bimestreAUsar.id,
           activo: true
         })
       );
       await manager.save(permisosCarrera);
     }
   }
 
   private async syncCategoryPermissions(manager: any, userId: number, categoryPermissionIds: string[], bimestreId?: number): Promise<void> {
     // Determinar qué bimestre usar
     let bimestreAUsar;
     if (bimestreId) {
       // Usar el bimestre seleccionado
       bimestreAUsar = await this.bimestreService.findById(bimestreId);
       if (!bimestreAUsar) {
         throw new BadRequestException(`Bimestre con ID ${bimestreId} no encontrado`);
       }
     } else {
       // Fallback al bimestre activo
       bimestreAUsar = await this.bimestreService.findBimestreActual();
       if (!bimestreAUsar) {
         throw new BadRequestException('No hay un bimestre activo configurado');
       }
     }
     
     // Eliminar permisos de categoría existentes para el bimestre
     await manager.delete(UsuarioPermisoCategoria, { 
       usuario_id: userId, 
       bimestre_id: bimestreAUsar.id 
     });
     
     // Crear nuevos permisos de categoría
     if (categoryPermissionIds.length > 0) {
       const permisosCategoria = categoryPermissionIds.map(categoria => 
         manager.create(UsuarioPermisoCategoria, {
           usuario_id: userId,
           categoria: categoria,
           bimestre_id: bimestreAUsar.id,
           activo: true
         })
       );
       await manager.save(permisosCategoria);
     }
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

  async adminChangePassword(adminChangePasswordDto: AdminChangePasswordDto, adminUserId: number): Promise<{message: string}> {
    const { userId, newPassword, adminPassword } = adminChangePasswordDto;

    // Verificar que el usuario a cambiar existe
    const targetUser = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!targetUser) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar que el admin existe y obtener su contraseña
    const adminUser = await this.userRepository.findOne({
      where: { id: adminUserId, deletedAt: null },
    });

    if (!adminUser) {
      throw new UnauthorizedException('Usuario administrador no encontrado');
    }

    // Verificar la contraseña del administrador
    const isAdminPasswordValid = await bcrypt.compare(adminPassword, adminUser.passwordHash);
    
    if (!isAdminPasswordValid) {
      throw new UnauthorizedException('La contraseña del administrador es incorrecta');
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar la contraseña del usuario objetivo
    await this.userRepository.update(userId, {
      passwordHash: hashedNewPassword,
    });

    return {
      message: `Contraseña del usuario ${targetUser.name} actualizada exitosamente`,
    };
  }

  async importUsers(file: Express.Multer.File, bimestreId?: number) {
    try {
      // Validar el archivo
      if (!file) {
        throw new BadRequestException('No se ha proporcionado ningún archivo');
      }

      const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Formato de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls) o CSV (.csv)');
      }

      // Leer el archivo
      let data: any[];
      
      if (file.mimetype === 'text/csv') {
        // Procesar CSV
        const csvData = file.buffer.toString('utf-8');
        const workbook = XLSX.read(csvData, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        // Procesar Excel
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      }

      if (!data || data.length === 0) {
        throw new BadRequestException('El archivo está vacío o no contiene datos válidos');
      }

      // Validar estructura del archivo
      const requiredColumns = ['Usuario', 'Mail', 'Nombre', 'Tipo de Rol'];
      const firstRow = data[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        throw new BadRequestException(`Faltan las siguientes columnas requeridas: ${missingColumns.join(', ')}`);
      }

      // Obtener todos los roles para validación
      const roles = await this.roleRepository.find();
      const roleMap = new Map(roles.map(role => [role.name.toLowerCase(), role]));

      // Procesar cada fila
      const results = {
        processed: 0,
        created: 0,
        updated: 0,
        errors: 0,
        errorDetails: [] as string[]
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        results.processed++;

        try {
          // Validar datos requeridos
          if (!row.Mail || !row.Nombre || !row['Tipo de Rol']) {
            throw new Error(`Fila ${i + 2}: Faltan datos requeridos (Mail, Nombre, Tipo de Rol)`);
          }

          // Validar email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.Mail)) {
            throw new Error(`Fila ${i + 2}: Email inválido: ${row.Mail}`);
          }

          // Validar rol
          const role = roleMap.get(row['Tipo de Rol'].toLowerCase());
          if (!role) {
            throw new Error(`Fila ${i + 2}: Rol no encontrado: ${row['Tipo de Rol']}`);
          }

          // Procesar fecha de expiración si existe
          let expirationDate = null;
          if (row.Expiracion !== undefined && row.Expiracion !== null && row.Expiracion !== '') {
            try {
              let dateStr = '';
              
              // Manejar diferentes tipos de datos para la fecha
              if (typeof row.Expiracion === 'string') {
                dateStr = row.Expiracion.trim();
              } else if (typeof row.Expiracion === 'number') {
                // Podría ser un número de serie de Excel
                const excelDate = new Date((row.Expiracion - 25569) * 86400 * 1000);
                if (!isNaN(excelDate.getTime())) {
                  expirationDate = excelDate;
                } else {
                  dateStr = row.Expiracion.toString();
                }
              } else if (row.Expiracion instanceof Date) {
                expirationDate = row.Expiracion;
              } else {
                dateStr = row.Expiracion.toString().trim();
              }
              
              // Si no se pudo convertir directamente, intentar parsear como string
              if (!expirationDate && dateStr) {
                // Convertir formato DD-MM-YYYY a Date
                const dateParts = dateStr.split('-');
                if (dateParts.length === 3) {
                  const day = parseInt(dateParts[0], 10);
                  const month = parseInt(dateParts[1], 10);
                  const year = parseInt(dateParts[2], 10);
                  
                  // Validar que los valores sean números válidos
                  if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
                      day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2024) {
                    expirationDate = new Date(year, month - 1, day); // month es 0-indexed en Date
                    
                    // Verificar que la fecha sea válida
                    if (isNaN(expirationDate.getTime())) {
                      throw new Error(`Fecha inválida: ${dateStr}`);
                    }
                  } else {
                    throw new Error(`Formato de fecha inválido: ${dateStr}`);
                  }
                } else {
                  throw new Error(`Formato de fecha debe ser DD-MM-YYYY: ${dateStr}`);
                }
              }
            } catch (dateError) {
              console.error(`Error procesando fecha en fila ${i + 2}:`, {
                valorOriginal: row.Expiracion,
                tipoValor: typeof row.Expiracion,
                error: dateError.message
              });
              throw new Error(`Fila ${i + 2}: Error en fecha de expiración - ${dateError.message}`);
            }
          }

          // Verificar si el usuario ya existe
          const existingUser = await this.userRepository.findOne({
            where: { emailInstitucional: row.Mail, deletedAt: null }
          });

          // Obtener el ID del rol Visualizador si hay fecha de expiración
          let previousRoleId = null;
          if (expirationDate) {
            const visualizadorRole = await this.roleRepository.findOne({
              where: { name: 'Visualizador' }
            });
            previousRoleId = visualizadorRole ? visualizadorRole.id : null;
          }

          if (existingUser) {
            // Actualizar usuario existente
            await this.userRepository.update(existingUser.id, {
              name: row.Nombre,
              roleId: role.id,
              roleExpiresAt: expirationDate,
              previousRoleId: previousRoleId,
            });
            results.updated++;
          } else {
            // Crear nuevo usuario - usar campo Usuario como contraseña
            const userPassword = row.Usuario || 'temporal123'; // Usar campo Usuario o fallback
            const hashedPassword = await bcrypt.hash(userPassword, 10);

            await this.userRepository.save({
              emailInstitucional: row.Mail,
              passwordHash: hashedPassword,
              name: row.Nombre,
              roleId: role.id,
              roleExpiresAt: expirationDate,
              previousRoleId: previousRoleId,
              isActive: true,
            });
            results.created++;
          }
        } catch (error) {
          results.errors++;
          results.errorDetails.push(error.message);
        }
      }

      const response = {
        success: results.errors === 0,
        message: results.errors === 0 
          ? `Importación completada exitosamente. ${results.created} usuarios creados, ${results.updated} usuarios actualizados.`
          : `Importación completada con errores. ${results.created} usuarios creados, ${results.updated} usuarios actualizados, ${results.errors} errores.`,
        details: results
      };

      // Si la importación fue exitosa, ejecutar scripts de permisos
      if (results.errors === 0 && (results.created > 0 || results.updated > 0)) {
        try {
          // Guardar archivo temporalmente para procesarlo con load_users.js
          const tempFilePath = await this.saveTemporaryFile(file);
          
          // Ejecutar scripts de permisos de forma asíncrona
          this.executePermissionScripts(tempFilePath, bimestreId).catch(error => {
            console.error('Error ejecutando scripts de permisos:', error);
          });
          
          response.message += ' Los permisos se están procesando en segundo plano.';
        } catch (error) {
          console.error('Error preparando ejecución de scripts de permisos:', error);
        }
      }

      return response;

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al procesar el archivo: ${error.message}`);
    }
  }

  /**
   * Guarda el archivo temporalmente para procesarlo con los scripts de permisos
   */
  private async saveTemporaryFile(file: Express.Multer.File): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp');
    
    // Crear directorio temporal si no existe
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Generar nombre único para el archivo temporal
    const timestamp = Date.now();
    const tempFileName = `users_import_${timestamp}.xlsx`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    // Escribir el archivo
    fs.writeFileSync(tempFilePath, file.buffer);
    
    return tempFilePath;
  }

  /**
   * Ejecuta los scripts de permisos para un usuario individual
   * Solo ejecuta resolve_permissions.js para procesar permisos pendientes
   * La estructura académica debe cargarse por separado
   */
  private async executePermissionScriptsForUser(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const scriptsDir = path.join(process.cwd(), '..', 'scripts', 'permissions');
      const resolvePermissionsScript = path.join(scriptsDir, 'resolve_permissions.js');
      
      // Verificar que el script existe
      if (!fs.existsSync(resolvePermissionsScript)) {
        console.error('Script resolve_permissions.js no encontrado en:', resolvePermissionsScript);
        reject(new Error('Script resolve_permissions.js no encontrado'));
        return;
      }
      
      console.log('🚀 Ejecutando resolución de permisos para usuario individual...');
      console.log('📂 Directorio de scripts:', scriptsDir);
      
      try {
        // Ejecutar resolve_permissions.js para procesar permisos pendientes
        console.log('🔄 Resolviendo permisos pendientes...');
        await this.executeScript(resolvePermissionsScript, [], scriptsDir);
        console.log('✅ Permisos resueltos');
        
        console.log('✅ Resolución de permisos ejecutada exitosamente');
        resolve();
        
      } catch (error) {
        console.error('❌ Error ejecutando resolución de permisos:', error);
        reject(error);
      }
    });
  }

  /**
   * Ejecuta los scripts de permisos de forma asíncrona
   * Ejecuta load_users.js para procesar usuarios y permisos
   * Luego ejecuta resolve_permissions.js para resolver permisos pendientes
   * La estructura académica debe cargarse por separado
   */
  private async executePermissionScripts(tempFilePath: string, bimestreId?: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const scriptsDir = path.join(process.cwd(), '..', 'scripts', 'permissions');
      const loadUsersScript = path.join(scriptsDir, 'load_users.js');
      const resolvePermissionsScript = path.join(scriptsDir, 'resolve_permissions.js');
      
      // Verificar que los scripts existen
      if (!fs.existsSync(loadUsersScript)) {
        console.error('Script load_users.js no encontrado en:', loadUsersScript);
        reject(new Error('Script load_users.js no encontrado'));
        return;
      }
      
      if (!fs.existsSync(resolvePermissionsScript)) {
        console.error('Script resolve_permissions.js no encontrado en:', resolvePermissionsScript);
        reject(new Error('Script resolve_permissions.js no encontrado'));
        return;
      }
      
      console.log('🚀 Ejecutando scripts de carga de usuarios...');
      console.log('📁 Archivo temporal:', tempFilePath);
      console.log('📂 Directorio de scripts:', scriptsDir);
      
      try {
        // Paso 1: Ejecutar load_users.js para procesar usuarios y permisos
        console.log('👥 Paso 1: Procesando usuarios y permisos...');
        const loadUsersArgs = [tempFilePath];
        if (bimestreId) {
          loadUsersArgs.push('--bimestre-id', bimestreId.toString());
          console.log(`📅 Usando bimestre ID: ${bimestreId}`);
        }
        await this.executeScript(loadUsersScript, loadUsersArgs, scriptsDir);
        console.log('✅ Usuarios y permisos procesados');
        
        // Paso 2: Ejecutar resolve_permissions.js para resolver permisos pendientes
        console.log('🔄 Paso 2: Resolviendo permisos pendientes...');
        await this.executeScript(resolvePermissionsScript, [], scriptsDir);
        console.log('✅ Permisos resueltos');
        
        // Limpiar archivo temporal
        try {
          fs.unlinkSync(tempFilePath);
          console.log('🗑️ Archivo temporal eliminado:', tempFilePath);
        } catch (cleanupError) {
          console.error('Error eliminando archivo temporal:', cleanupError);
        }
        
        console.log('✅ Scripts de permisos ejecutados exitosamente');
        resolve();
        
      } catch (error) {
        console.error('❌ Error ejecutando scripts de permisos:', error);
        // Limpiar archivo temporal en caso de error
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.error('Error eliminando archivo temporal:', cleanupError);
        }
        reject(error);
      }
    });
  }
  
  /**
   * Ejecuta un script individual y retorna una promesa
   */
  private executeScript(scriptPath: string, args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proceso = spawn('node', [scriptPath, ...args], {
        cwd: cwd,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let errorOutput = '';
      
      proceso.stdout.on('data', (data) => {
        const message = data.toString();
        output += message;
        console.log('📊 Script output:', message.trim());
      });
      
      proceso.stderr.on('data', (data) => {
        const message = data.toString();
        errorOutput += message;
        console.error('❌ Script error:', message.trim());
      });
      
      proceso.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          console.error(`❌ Script terminó con código ${code}`);
          console.error('Output:', output);
          console.error('Error output:', errorOutput);
          reject(new Error(`Script terminó con código ${code}`));
        }
      });
      
      proceso.on('error', (error) => {
        console.error('❌ Error ejecutando script:', error);
        reject(error);
      });
    });
  }

  async getUserPermissions(userId: number, bimestreId?: number): Promise<any> {
    try {
      // Verificar que el usuario existe
      const user = await this.userRepository.findOne({
        where: { id: userId, deletedAt: null }
      });
      
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Buscar permisos por categoría
      const permisosCategorias = await this.usuarioPermisoCategoriaRepository.find({
        where: { 
          usuario_id: userId,
          ...(bimestreId && { bimestre_id: bimestreId })
        }
      });

      if (permisosCategorias.length > 0) {
        return {
          tipoPermiso: 'categoria',
          categorias: permisosCategorias.map(p => p.categoria),
          carreras: []
        };
      }

      // Buscar permisos por carrera
      const permisosCarrera = await this.usuarioPermisoCarreraRepository.find({
        where: { 
          usuario_id: userId,
          ...(bimestreId && { bimestre_id: bimestreId })
        }
      });

      if (permisosCarrera.length > 0) {
        return {
          tipoPermiso: 'carrera',
          categorias: [],
          carreras: permisosCarrera.map(p => p.carrera_id)
        };
      }

      // Sin permisos específicos
      return {
        tipoPermiso: '',
        categorias: [],
        carreras: []
      };
    } catch (error) {
      console.error('Error obteniendo permisos del usuario:', error);
      throw error;
    }
  }

  async updateUserPermissions(userId: number, permissionsData: any, bimestreId?: number): Promise<{ message: string }> {
    try {
      // Verificar que el usuario existe
      const user = await this.userRepository.findOne({
        where: { id: userId, deletedAt: null }
      });
      
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Usar transacción para asegurar consistencia
      await this.dataSource.transaction(async manager => {
        // Eliminar permisos existentes
        await manager.delete(UsuarioPermisoCategoria, { 
          usuario_id: userId,
          ...(bimestreId && { bimestre_id: bimestreId })
        });
        await manager.delete(UsuarioPermisoCarrera, { 
          usuario_id: userId,
          ...(bimestreId && { bimestre_id: bimestreId })
        });

        // Crear nuevos permisos según el tipo
        if (permissionsData.tipoPermiso === 'categoria' && permissionsData.categoria) {
          const permisoCategoria = manager.create(UsuarioPermisoCategoria, {
            usuario_id: userId,
            categoria: permissionsData.categoria,
            bimestre_id: bimestreId || null
          });
          await manager.save(permisoCategoria);
        } else if (permissionsData.tipoPermiso === 'carrera' && permissionsData.carreras?.length > 0) {
          const permisosCarrera = permissionsData.carreras.map((carreraId: number) => 
            manager.create(UsuarioPermisoCarrera, {
              usuario_id: userId,
              carrera_id: carreraId,
              bimestre_id: bimestreId || null
            })
          );
          await manager.save(permisosCarrera);
        }
      });

      return { message: 'Permisos actualizados exitosamente' };
    } catch (error) {
      console.error('Error actualizando permisos del usuario:', error);
      throw error;
    }
  }
}