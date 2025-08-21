const { DataSource } = require('typeorm');
const { User } = require('./dist/users/entities/user.entity');
const { Role } = require('./dist/common/entities/role.entity');
require('dotenv').config();

// Configuración de la base de datos
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 3306,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'planificacion_academica',
  entities: [User, Role],
  synchronize: false,
});

async function testTypeOrmUpdate() {
  try {
    await dataSource.initialize();
    console.log('Conectado a la base de datos con TypeORM');
    
    const userRepository = dataSource.getRepository(User);
    
    // 1. Verificar el estado inicial
    console.log('\n=== ESTADO INICIAL ===');
    const initialUser = await userRepository.findOne({
      where: { id: 7 },
      relations: ['role']
    });
    console.log('Usuario inicial:', {
      id: initialUser.id,
      name: initialUser.name,
      roleId: initialUser.roleId,
      roleName: initialUser.role?.name
    });
    
    // 2. Probar actualización con update() method
    console.log('\n=== PROBANDO UPDATE METHOD ===');
    const updateResult = await userRepository.update(
      { id: 7 },
      { roleId: 8 }
    );
    console.log('Resultado del update:', updateResult);
    
    // 3. Verificar después del update
    console.log('\n=== DESPUÉS DEL UPDATE ===');
    const afterUpdate = await userRepository.findOne({
      where: { id: 7 },
      relations: ['role']
    });
    console.log('Usuario después del update:', {
      id: afterUpdate.id,
      name: afterUpdate.name,
      roleId: afterUpdate.roleId,
      roleName: afterUpdate.role?.name
    });
    
    // 4. Probar actualización con save() method
    console.log('\n=== PROBANDO SAVE METHOD ===');
    const userToSave = await userRepository.findOne({
      where: { id: 7 },
      relations: ['role']
    });
    
    console.log('Antes de modificar:', {
      roleId: userToSave.roleId,
      roleName: userToSave.role?.name
    });
    
    userToSave.roleId = 8;
    // Limpiar la relación para forzar la recarga
    userToSave.role = null;
    
    console.log('Después de modificar:', {
      roleId: userToSave.roleId,
      roleName: userToSave.role?.name
    });
    
    const savedUser = await userRepository.save(userToSave);
    console.log('Usuario guardado:', {
      id: savedUser.id,
      roleId: savedUser.roleId,
      roleName: savedUser.role?.name
    });
    
    // 5. Recargar después del save
    console.log('\n=== DESPUÉS DEL SAVE ===');
    const afterSave = await userRepository.findOne({
      where: { id: 7 },
      relations: ['role']
    });
    console.log('Usuario después del save:', {
      id: afterSave.id,
      name: afterSave.name,
      roleId: afterSave.roleId,
      roleName: afterSave.role?.name
    });
    
    // 6. Revertir cambios
    console.log('\n=== REVIRTIENDO CAMBIOS ===');
    await userRepository.update({ id: 7 }, { roleId: 7 });
    console.log('Cambios revertidos');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await dataSource.destroy();
    console.log('\nConexión cerrada');
  }
}

testTypeOrmUpdate();