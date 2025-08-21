const { DataSource } = require('typeorm');
const { StagingDol } = require('./dist/src/dol/entities/dol-position.entity');

// Configuración de la base de datos
const dataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'planificacion_user',
  password: 'PlanUser2025!',
  database: 'planificacion_academica',
  entities: [StagingDol],
  synchronize: false,
  logging: true
});

async function testTypeORMSaveBehavior() {
  try {
    console.log('=== PRUEBA DE COMPORTAMIENTO DE TYPEORM SAVE ===');
    
    // Inicializar conexión
    await dataSource.initialize();
    console.log('Conexión TypeORM inicializada');
    
    const stagingDolRepository = dataSource.getRepository(StagingDol);
    
    // Limpiar datos de prueba anteriores
    console.log('\n1. Limpiando datos de prueba anteriores...');
    await stagingDolRepository.delete({ id_bimestre: 20, sigla: 'DOL006' });
    
    // Verificar estado inicial
    const initialCount = await stagingDolRepository.count({ 
      where: { id_bimestre: 20, sigla: 'DOL006' } 
    });
    console.log('Registros iniciales para bimestre 20 con sigla DOL006:', initialCount);
    
    // Crear primer registro
    console.log('\n2. Creando primer registro con TypeORM: SIGLA=DOL006, PLAN=1114401');
    const record1 = new StagingDol();
    record1.sigla = 'DOL006';
    record1.plan = '1114401';
    record1.descripcion = 'Descripción Plan 1114401';
    record1.id_bimestre = 20;
    
    console.log('Datos del primer registro:', {
      sigla: record1.sigla,
      plan: record1.plan,
      descripcion: record1.descripcion,
      id_bimestre: record1.id_bimestre
    });
    
    try {
      const savedRecord1 = await stagingDolRepository.save(record1);
      console.log('✓ Primer registro guardado exitosamente');
      console.log('Registro guardado:', {
        sigla: savedRecord1.sigla,
        plan: savedRecord1.plan,
        descripcion: savedRecord1.descripcion,
        id_bimestre: savedRecord1.id_bimestre
      });
    } catch (error) {
      console.log('✗ Error guardando primer registro:', error.message);
    }
    
    // Verificar después del primer save
    const countAfterFirst = await stagingDolRepository.count({ 
      where: { id_bimestre: 20, sigla: 'DOL006' } 
    });
    console.log('Registros después del primer save:', countAfterFirst);
    
    // Crear segundo registro
    console.log('\n3. Creando segundo registro con TypeORM: SIGLA=DOL006, PLAN=1114402');
    const record2 = new StagingDol();
    record2.sigla = 'DOL006';
    record2.plan = '1114402';
    record2.descripcion = 'Descripción Plan 1114402';
    record2.id_bimestre = 20;
    
    console.log('Datos del segundo registro:', {
      sigla: record2.sigla,
      plan: record2.plan,
      descripcion: record2.descripcion,
      id_bimestre: record2.id_bimestre
    });
    
    try {
      const savedRecord2 = await stagingDolRepository.save(record2);
      console.log('✓ Segundo registro guardado exitosamente');
      console.log('Registro guardado:', {
        sigla: savedRecord2.sigla,
        plan: savedRecord2.plan,
        descripcion: savedRecord2.descripcion,
        id_bimestre: savedRecord2.id_bimestre
      });
    } catch (error) {
      console.log('✗ Error guardando segundo registro:', error.message);
      console.log('Detalles del error:', error);
    }
    
    // Verificar después del segundo save
    const countAfterSecond = await stagingDolRepository.count({ 
      where: { id_bimestre: 20, sigla: 'DOL006' } 
    });
    console.log('Registros después del segundo save:', countAfterSecond);
    
    // Mostrar todos los registros
    console.log('\n4. Registros finales en la tabla:');
    const finalRecords = await stagingDolRepository.find({
      where: { id_bimestre: 20, sigla: 'DOL006' },
      order: { sigla: 'ASC', plan: 'ASC' }
    });
    
    if (finalRecords.length === 0) {
      console.log('No hay registros en la tabla para bimestre 20 con sigla DOL006');
    } else {
      console.log('Registros encontrados:');
      finalRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. SIGLA: ${record.sigla}, PLAN: ${record.plan}, DESCRIPCION: ${record.descripcion}`);
      });
    }
    
    // Probar con insert en lugar de save
    console.log('\n5. Probando con insert() en lugar de save():');
    
    // Limpiar primero
    await stagingDolRepository.delete({ id_bimestre: 20, sigla: 'DOL006' });
    
    const insertRecords = [
      {
        sigla: 'DOL006',
        plan: '1114401',
        descripcion: 'Descripción Plan 1114401 - INSERT',
        id_bimestre: 20
      },
      {
        sigla: 'DOL006',
        plan: '1114402',
        descripcion: 'Descripción Plan 1114402 - INSERT',
        id_bimestre: 20
      }
    ];
    
    try {
      const insertResult = await stagingDolRepository.insert(insertRecords);
      console.log('✓ INSERT ejecutado exitosamente');
      console.log('Registros insertados:', insertResult.identifiers.length);
    } catch (error) {
      console.log('✗ Error en INSERT:', error.message);
    }
    
    // Verificar después del insert
    const countAfterInsert = await stagingDolRepository.count({ 
      where: { id_bimestre: 20, sigla: 'DOL006' } 
    });
    console.log('Registros después del INSERT:', countAfterInsert);
    
    // Mostrar registros después del insert
    const insertedRecords = await stagingDolRepository.find({
      where: { id_bimestre: 20, sigla: 'DOL006' },
      order: { sigla: 'ASC', plan: 'ASC' }
    });
    
    console.log('Registros después del INSERT:');
    insertedRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. SIGLA: ${record.sigla}, PLAN: ${record.plan}, DESCRIPCION: ${record.descripcion}`);
    });
    
    console.log('\n=== PRUEBA COMPLETADA ===');
    
  } catch (error) {
    console.error('Error en la prueba:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Conexión TypeORM cerrada');
    }
  }
}

// Ejecutar la prueba
testTypeORMSaveBehavior();