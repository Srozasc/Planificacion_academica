const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'DuocAdmin123.',
  database: process.env.DB_DATABASE || 'planificacion_academica',
  port: process.env.DB_PORT || 3306
};

let connection;

async function connectDB() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos MySQL');
    return connection;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
}

async function closeDB() {
  if (connection) {
    await connection.end();
    console.log('🔌 Conexión cerrada');
  }
}

// Test 1: Probar sp_ValidateAndSaveScheduleEvent (Crear evento)
async function testCreateScheduleEvent() {
  console.log('\n➕ Test 1: Crear evento de programación');
  try {
    // Verificar datos existentes
    const [teachers] = await connection.execute('SELECT id, name FROM teachers WHERE is_active = TRUE LIMIT 1');
    const [structures] = await connection.execute('SELECT id, name FROM academic_structures WHERE is_active = TRUE LIMIT 1');
    const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
    
    if (teachers.length === 0 || structures.length === 0 || users.length === 0) {
      console.log('⚠️ No hay datos suficientes para las pruebas');
      return;
    }

    const eventData = {
      academic_structure_id: structures[0].id,
      teacher_id: teachers[0].id,
      area_id: 1,      start_datetime: '2024-07-01 08:00:00',
      end_datetime: '2024-07-01 10:00:00',
      day_of_week: 'LUNES',
      classroom: 'Aula Test SP',
      vacancies: 25,
      max_capacity: 30,
      weekly_hours: 2.0,
      academic_period: '2024-1',
      section: 'TEST-SP'
    };

    const userId = users[0].id;
    
    console.log('📝 Datos de prueba:', eventData);
    
    // Llamar al stored procedure
    await connection.execute(
      'CALL sp_ValidateAndSaveScheduleEvent(?, ?, @event_id, @status_code, @error_message)',
      [JSON.stringify(eventData), userId]
    );

    // Obtener variables de salida
    const [outputResults] = await connection.execute(
      'SELECT @event_id as event_id, @status_code as status_code, @error_message as error_message'
    );
    
    const output = outputResults[0];
    
    console.log('📋 Resultado del SP:');
    console.log(`   Event ID: ${output.event_id}`);
    console.log(`   Status Code: ${output.status_code}`);
    console.log(`   Error Message: ${output.error_message}`);

    if (output.status_code === 'SUCCESS') {
      console.log('✅ Evento creado exitosamente');
      return output.event_id;
    } else {
      console.log(`❌ Error: ${output.error_message}`);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error en testCreateScheduleEvent:', error);
    throw error;
  }
}

// Test 2: Probar sp_GetScheduleEventsByFilters (Obtener eventos)
async function testGetScheduleEvents() {
  console.log('\n🔍 Test 2: Obtener eventos por filtros');
  try {
    const filters = {
      area_id: 1,
      academic_period: '2024-1',
      start_date: '2024-07-01',
      end_date: '2024-07-31'
    };
    
    console.log('📝 Filtros:', filters);    const [rows] = await connection.execute(
      'CALL sp_GetScheduleEvents(?, ?, ?, ?, ?)', 
      [filters.area_id, filters.start_date, filters.end_date, null, null]
    );
    
    console.log(`📋 Eventos encontrados: ${rows[0].length}`);
    if (rows[0].length > 0) {
      console.log('📝 Primer evento:', {
        id: rows[0][0].id,
        classroom: rows[0][0].classroom,
        start_datetime: rows[0][0].start_datetime,
        teacher_name: rows[0][0].teacher_name
      });
    }
    
    return rows[0];
  } catch (error) {
    console.error('❌ Error en testGetScheduleEvents:', error);
    throw error;
  }
}

// Test 3: Probar sp_UpdateScheduleEvent (Actualizar evento)
async function testUpdateScheduleEvent(eventId) {
  console.log('\n✏️ Test 3: Actualizar evento');
  try {
    if (!eventId) {
      console.log('⚠️ No hay ID de evento para actualizar');
      return;
    }
    
    const updateData = {
      academic_structure_id: 1,
      teacher_id: 1,
      area_id: 1,
      start_datetime: '2024-07-01T09:00:00',
      end_datetime: '2024-07-01T11:00:00',
      day_of_week: 'LUNES',
      classroom: 'Aula Test SP Actualizada',
      vacancies: 30,
      max_capacity: 35,
      weekly_hours: 2.0,
      academic_period: '2024-1',
      section: 'TEST-SP-UPD'
    };
    
    const userId = 1;
    
    console.log('📝 Datos de actualización:', updateData);
    
    await connection.execute(
      'CALL sp_UpdateScheduleEvent(?, ?, ?, @status_code, @error_message)',
      [eventId, JSON.stringify(updateData), userId]
    );

    const [outputResults] = await connection.execute(
      'SELECT @status_code as status_code, @error_message as error_message'
    );
    
    const output = outputResults[0];
    
    console.log('📋 Resultado de actualización:');
    console.log(`   Status Code: ${output.status_code}`);
    console.log(`   Error Message: ${output.error_message}`);

    if (output.status_code === 'SUCCESS') {
      console.log('✅ Evento actualizado exitosamente');
    } else {
      console.log(`❌ Error: ${output.error_message}`);
    }
    
    return output;
  } catch (error) {
    console.error('❌ Error en testUpdateScheduleEvent:', error);
    throw error;
  }
}

// Test 4: Probar sp_DeleteScheduleEvent (Eliminar evento)
async function testDeleteScheduleEvent(eventId) {
  console.log('\n🗑️ Test 4: Eliminar evento');
  try {
    if (!eventId) {
      console.log('⚠️ No hay ID de evento para eliminar');
      return;
    }
    
    const userId = 1;    await connection.execute(
      'CALL sp_DeleteScheduleEvent(?, ?, ?, @status_code, @error_message)',
      [eventId, userId, true]  // true para eliminación lógica
    );

    const [outputResults] = await connection.execute(
      'SELECT @status_code as status_code, @error_message as error_message'
    );
    
    const output = outputResults[0];
    
    console.log('📋 Resultado de eliminación:');
    console.log(`   Status Code: ${output.status_code}`);
    console.log(`   Error Message: ${output.error_message}`);

    if (output.status_code === 'SUCCESS') {
      console.log('✅ Evento eliminado exitosamente');
    } else {
      console.log(`❌ Error: ${output.error_message}`);
    }
    
    return output;
  } catch (error) {
    console.error('❌ Error en testDeleteScheduleEvent:', error);
    throw error;
  }
}

// Test 5: Verificar que el evento fue eliminado
async function testGetEventById(eventId) {
  console.log('\n🔍 Test 5: Verificar evento por ID');
  try {
    if (!eventId) {
      console.log('⚠️ No hay ID de evento para verificar');
      return;
    }
    
    const [rows] = await connection.execute(
      'SELECT * FROM schedule_events WHERE id = ? AND is_active = TRUE',
      [eventId]
    );
    
    console.log(`📋 Eventos activos encontrados con ID ${eventId}: ${rows.length}`);
    if (rows.length > 0) {
      console.log('📝 Evento encontrado:', {
        id: rows[0].id,
        classroom: rows[0].classroom,
        is_active: rows[0].is_active
      });
    } else {
      console.log('✅ Evento no encontrado (correctamente eliminado)');
    }
    
    return rows[0];
  } catch (error) {
    console.error('❌ Error en testGetEventById:', error);
    throw error;
  }
}

// Test completo
async function runAllTests() {
  console.log('🚀 Iniciando pruebas completas de Stored Procedures');
  console.log('='.repeat(60));
  
  try {
    await connectDB();
    
    let createdEventId;
      // Test 1: Crear evento
    createdEventId = await testCreateScheduleEvent();
    
    // Test 2: Obtener eventos
    await testGetScheduleEvents();
    
    if (createdEventId) {
      // Test 3: Verificar evento creado
      await testGetEventById(createdEventId);
      
      // Test 4: Eliminar evento
      await testDeleteScheduleEvent(createdEventId);
      
      // Test 5: Verificar eliminación
      await testGetEventById(createdEventId);
    }
    
    console.log('\n🎉 Todas las pruebas completadas');
    
  } catch (error) {
    console.error('\n💥 Error durante las pruebas:', error);
  } finally {
    await closeDB();
  }
}

// Función para probar un SP específico
async function testSpecificSP(spName, params = []) {
  console.log(`\n� Test específico: ${spName}`);
  try {
    await connectDB();
    
    const placeholders = params.map(() => '?').join(', ');
    const query = `CALL ${spName}(${placeholders})`;
    
    console.log('📝 Query:', query);
    console.log('📝 Parámetros:', params);
    
    const [rows] = await connection.execute(query, params);
    
    console.log('✅ SP ejecutado exitosamente');
    console.log('📋 Resultado:', rows[0]);
    
    return rows[0];
  } catch (error) {
    console.error(`❌ Error ejecutando ${spName}:`, error);
    throw error;
  } finally {
    await closeDB();
  }
}

// Exportar funciones para uso individual
module.exports = {
  connectDB,
  closeDB,
  testCreateScheduleEvent,
  testGetScheduleEvents,
  testUpdateScheduleEvent,
  testDeleteScheduleEvent,
  testGetEventById,
  runAllTests,
  testSpecificSP
};

// Si se ejecuta directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const command = args[0];
    
    switch (command) {
      case 'all':
        runAllTests();
        break;
      case 'create':
        (async () => {
          await connectDB();
          await testCreateScheduleEvent();
          await closeDB();
        })();
        break;
      case 'get':
        (async () => {
          await connectDB();
          await testGetScheduleEvents();
          await closeDB();
        })();
        break;
      case 'sp':
        if (args.length >= 2) {
          const spName = args[1];
          const params = args.slice(2);
          testSpecificSP(spName, params);
        } else {
          console.log('❌ Uso: node test-sp-direct.js sp <nombre_sp> [param1] [param2] ...');
        }
        break;
      default:
        console.log('❌ Comando no reconocido');
        console.log('📖 Comandos disponibles:');
        console.log('  all - Ejecutar todas las pruebas');
        console.log('  create - Probar crear evento');
        console.log('  get - Probar obtener eventos');
        console.log('  sp <nombre> [params] - Probar SP específico');
    }
  } else {
    runAllTests();
  }
}

// Test: Probar actualización de evento (usando el mismo SP con un ID)
async function testUpdateScheduleEventWithSameSP() {
  console.log('\n✏️ Test: Actualizar evento usando sp_ValidateAndSaveScheduleEvent');
  try {
    // Primero verificar que existe el evento ID 5
    const [existingEvents] = await connection.execute(
      'SELECT * FROM schedule_events WHERE id = 5 AND is_active = TRUE'
    );
    
    if (existingEvents.length === 0) {
      console.log('⚠️ No se encontró evento con ID 5 para actualizar');
      return;
    }
    
    console.log('📝 Evento existente:', {
      id: existingEvents[0].id,
      classroom: existingEvents[0].classroom,
      teacher_id: existingEvents[0].teacher_id,
      start_datetime: existingEvents[0].start_datetime
    });

    // Preparar datos de actualización (incluyendo el ID)
    const updateData = {
      id: 5,  // Incluir ID para indicar que es actualización
      academic_structure_id: existingEvents[0].academic_structure_id,
      teacher_id: 2,  // Cambiar docente
      area_id: existingEvents[0].area_id,
      start_datetime: '2024-07-01 14:00:00',  // Cambiar horario
      end_datetime: '2024-07-01 16:00:00',
      day_of_week: 'LUNES',
      classroom: 'Aula Test SP Actualizada',  // Cambiar aula
      vacancies: 30,  // Cambiar vacantes
      max_capacity: 35,
      weekly_hours: 2.0,
      academic_period: '2024-1',
      section: 'TEST-SP-UPD'
    };

    const userId = 1;
    
    console.log('📝 Datos de actualización:', updateData);
    
    // Llamar al mismo SP pero con datos que incluyen ID
    await connection.execute(
      'CALL sp_ValidateAndSaveScheduleEvent(?, ?, @event_id, @status_code, @error_message)',
      [JSON.stringify(updateData), userId]
    );

    // Obtener variables de salida
    const [outputResults] = await connection.execute(
      'SELECT @event_id as event_id, @status_code as status_code, @error_message as error_message'
    );
    
    const output = outputResults[0];
    
    console.log('📋 Resultado del SP:');
    console.log(`   Event ID: ${output.event_id}`);
    console.log(`   Status Code: ${output.status_code}`);
    console.log(`   Error Message: ${output.error_message}`);

    if (output.status_code === 'SUCCESS') {
      console.log('✅ SP ejecutado - verificando si actualizó o creó nuevo evento');
      
      // Verificar si se actualizó el evento original o se creó uno nuevo
      const [updatedEvent] = await connection.execute(
        'SELECT * FROM schedule_events WHERE id = 5 AND is_active = TRUE'
      );
      
      const [newEvent] = await connection.execute(
        'SELECT * FROM schedule_events WHERE id = ? AND is_active = TRUE',
        [output.event_id]
      );
      
      if (output.event_id === 5) {
        console.log('🔄 El evento original fue actualizado');
        console.log(`   Nueva aula: ${updatedEvent[0]?.classroom}`);
        console.log(`   Nuevo horario: ${updatedEvent[0]?.start_datetime}`);
      } else {
        console.log('➕ Se creó un nuevo evento (ID:', output.event_id, ')');
        if (newEvent.length > 0) {
          console.log(`   Aula: ${newEvent[0].classroom}`);
          console.log(`   Horario: ${newEvent[0].start_datetime}`);
        }
      }
    } else {
      console.log(`❌ Error: ${output.error_message}`);
    }
    
    return output;
  } catch (error) {
    console.error('❌ Error en testUpdateScheduleEventWithSameSP:', error);
    throw error;
  }
}
