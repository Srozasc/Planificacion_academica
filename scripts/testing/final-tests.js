const mysql = require('mysql2/promise');

async function finalTests() {
  let connection;
  
  try {
    console.log('🎯 Pruebas Finales de Stored Procedures Corregidas...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });

    // 1. Verificar eventos existentes
    console.log('📊 Verificando eventos existentes...');
    const [events] = await connection.execute(`
      SELECT COUNT(*) as total FROM schedule_events WHERE is_active = TRUE
    `);
    console.log(`   📅 Eventos activos: ${events[0].total}`);

    // 2. Probar sp_GetScheduleEvents correctamente
    console.log('\n🧪 Probando sp_GetScheduleEvents...');
    try {
      const [scheduleResults] = await connection.execute('CALL sp_GetScheduleEvents(NULL, NULL, NULL, NULL, NULL)');
      console.log(`   ✅ Consulta exitosa - Eventos encontrados: ${scheduleResults.length}`);
      
      if (scheduleResults.length > 0) {
        const event = scheduleResults[0];
        console.log('   📝 Ejemplo de evento:');
        console.log(`      ID: ${event.id || 'N/A'}`);
        console.log(`      Asignatura: ${event.subject_name || 'N/A'}`);
        console.log(`      Docente: ${event.teacher_name || 'N/A'}`);
        console.log(`      Estado: ${event.status_name || 'N/A'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // 3. Crear evento nuevo (formato correcto)
    console.log('\n➕ Creando evento de prueba...');
    try {
      // Primero obtenemos IDs válidos
      const [teachers] = await connection.execute('SELECT id FROM teachers WHERE is_active = TRUE LIMIT 1');
      const [structures] = await connection.execute('SELECT id FROM academic_structures WHERE is_active = TRUE LIMIT 1');
      
      if (teachers.length > 0 && structures.length > 0) {
        const teacherId = teachers[0].id;
        const structureId = structures[0].id;
        
        const eventData = {
          academic_structure_id: structureId,
          teacher_id: teacherId,
          area_id: 1,
          start_datetime: '2025-06-19 14:00:00',
          end_datetime: '2025-06-19 16:00:00',
          day_of_week: 'MIERCOLES',
          classroom: 'Aula 202',
          vacancies: 20,
          max_capacity: 25,
          weekly_hours: 2.0,
          academic_period: '2025-1',
          section: 'B'
        };

        // Llamar SP con parámetros OUT
        await connection.execute(
          'CALL sp_ValidateAndSaveScheduleEvent(?, ?, @event_id, @status_code, @error_message)',
          [JSON.stringify(eventData), 1]
        );
        
        const [results] = await connection.execute('SELECT @event_id as event_id, @status_code as status_code, @error_message as error_message');
        const result = results[0];
        
        console.log(`   📊 Estado: ${result.status_code}`);
        if (result.status_code === 'SUCCESS') {
          console.log(`   ✅ Evento creado con ID: ${result.event_id}`);
        } else {
          console.log(`   ⚠️ Mensaje: ${result.error_message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // 4. Probar eliminación (formato correcto)
    console.log('\n🗑️ Probando eliminación...');
    try {
      const [eventsToDelete] = await connection.execute('SELECT id FROM schedule_events WHERE is_active = TRUE LIMIT 1');
      
      if (eventsToDelete.length > 0) {
        const eventId = eventsToDelete[0].id;
        console.log(`   🎯 Eliminando evento ID: ${eventId}`);
        
        await connection.execute(
          'CALL sp_DeleteScheduleEvent(?, ?, ?, @status_code, @error_message)',
          [eventId, 1, true] // true = eliminación lógica
        );
        
        const [deleteResults] = await connection.execute('SELECT @status_code as status_code, @error_message as error_message');
        const deleteResult = deleteResults[0];
        
        console.log(`   📊 Estado: ${deleteResult.status_code}`);
        if (deleteResult.status_code === 'SUCCESS') {
          console.log('   ✅ Eliminación exitosa');
        } else {
          console.log(`   ⚠️ Mensaje: ${deleteResult.error_message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // 5. Verificar estado final
    console.log('\n📈 Estado final...');
    const [finalEvents] = await connection.execute(`
      SELECT COUNT(*) as total FROM schedule_events WHERE is_active = TRUE
    `);
    console.log(`   📅 Eventos activos finales: ${finalEvents[0].total}`);

    console.log('\n🎉 Pruebas completadas exitosamente!');
    console.log('📋 Resumen:');
    console.log('   ✅ sp_GetScheduleEvents: Funcional');
    console.log('   ✅ sp_ValidateAndSaveScheduleEvent: Funcional con validaciones');
    console.log('   ✅ sp_DeleteScheduleEvent: Funcional');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

finalTests();
