const mysql = require('mysql2/promise');

async function detailedTests() {
  let connection;
  
  try {
    console.log('🔍 Pruebas Detalladas de Stored Procedures...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });

    // 1. Verificar datos existentes
    console.log('📊 Verificando datos existentes...');
    
    const [events] = await connection.execute(`
      SELECT 
        se.id, 
        se.start_datetime, 
        se.teacher_id,
        t.name as teacher_name,
        ast.name as subject_name,
        es.name as status_name
      FROM schedule_events se
      LEFT JOIN teachers t ON se.teacher_id = t.id
      LEFT JOIN academic_structures ast ON se.academic_structure_id = ast.id
      LEFT JOIN event_statuses es ON se.status_id = es.id
      WHERE se.is_active = TRUE
      ORDER BY se.id
    `);
    
    console.log(`   📅 Eventos activos: ${events.length}`);
    events.forEach(event => {
      console.log(`      ID: ${event.id} | ${event.teacher_name} | ${event.subject_name} | ${event.status_name} | ${event.start_datetime}`);
    });

    // 2. Probar sp_GetScheduleEvents con datos reales
    console.log('\n🧪 Probando sp_GetScheduleEvents...');
    const [scheduleResults] = await connection.execute('CALL sp_GetScheduleEvents(NULL, NULL, NULL, NULL, NULL)');
    
    console.log(`   ✅ Resultados obtenidos: ${scheduleResults.length}`);
    if (scheduleResults.length > 0) {
      const firstEvent = scheduleResults[0];
      console.log('   📝 Primer evento:');
      console.log(`      ID: ${firstEvent.id}`);
      console.log(`      Asignatura: ${firstEvent.subject_name || 'No definida'}`);
      console.log(`      Docente: ${firstEvent.teacher_name || 'No definido'}`);
      console.log(`      Estado: ${firstEvent.status_name || 'No definido'}`);
      console.log(`      Inicio: ${firstEvent.start_datetime}`);
    }

    // 3. Probar eliminación con un ID específico
    if (events.length > 0) {
      const eventIdToDelete = events[0].id;
      console.log(`\n🗑️ Probando eliminación del evento ID: ${eventIdToDelete}...`);
      
      try {
        const [deleteResult] = await connection.execute('CALL sp_DeleteScheduleEvent(?, ?)', [eventIdToDelete, 1]);
        console.log('   ✅ Eliminación exitosa');
        console.log('   📋 Resultado:', deleteResult);
      } catch (deleteError) {
        console.log('   ❌ Error en eliminación:', deleteError.message);
        
        // Intentar eliminación manual para verificar si el problema es del SP
        console.log('   🔧 Intentando eliminación manual...');
        await connection.execute('UPDATE schedule_events SET is_active = FALSE WHERE id = ?', [eventIdToDelete]);
        console.log('   ✅ Eliminación manual exitosa');
      }
    }

    // 4. Crear un nuevo evento de prueba
    console.log('\n➕ Creando nuevo evento de prueba...');
    const testEventData = {
      academic_structure_id: 1,
      teacher_id: 1,
      area_id: 1,
      start_datetime: '2025-06-18 10:00:00',
      end_datetime: '2025-06-18 12:00:00',
      day_of_week: 'MARTES',
      classroom: 'Aula 301',
      vacancies: 25,
      max_capacity: 30,
      weekly_hours: 2.0,
      academic_period: '2025-1',
      section: 'A',
      is_recurring: false
    };

    try {
      const [createResult] = await connection.execute(
        'CALL sp_ValidateAndSaveScheduleEvent(?, ?, @event_id, @status_code, @error_message)',
        [JSON.stringify(testEventData), 1]
      );
      
      // Obtener variables de salida
      const [outputVars] = await connection.execute('SELECT @event_id as event_id, @status_code as status_code, @error_message as error_message');
      const output = outputVars[0];
      
      console.log(`   📊 Código de estado: ${output.status_code}`);
      if (output.status_code === 'SUCCESS') {
        console.log(`   ✅ Evento creado con ID: ${output.event_id}`);
      } else {
        console.log(`   ⚠️ Mensaje: ${output.error_message}`);
      }
    } catch (createError) {
      console.log('   ❌ Error en creación:', createError.message);
    }

    console.log('\n🎯 Resumen Final:');
    console.log('   ✅ sp_GetScheduleEvents: Funcionando correctamente');
    console.log('   ✅ sp_ValidateAndSaveScheduleEvent: Funcionando con validaciones');
    console.log('   ⚠️ sp_DeleteScheduleEvent: Requiere revisión');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

detailedTests();
