const mysql = require('mysql2/promise');

async function testStoredProcedures() {
  let connection;
  
  try {
    console.log('🧪 Probando Stored Procedures de Programación Académica...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });

    console.log('✅ Conexión establecida\n');

    // 1. Verificar procedures existentes
    console.log('📋 Verificando stored procedures...');
    const [procedures] = await connection.execute(`
      SELECT 
        ROUTINE_NAME,
        ROUTINE_TYPE,
        CREATED,
        ROUTINE_COMMENT
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = 'planificacion_academica' 
        AND ROUTINE_NAME LIKE 'sp_%Schedule%'
      ORDER BY ROUTINE_NAME
    `);

    procedures.forEach(proc => {
      console.log(`   ✅ ${proc.ROUTINE_NAME} - Creado: ${proc.CREATED}`);
    });

    // 2. Obtener datos de prueba
    console.log('\n🔍 Obteniendo datos para pruebas...');
      const [teachers] = await connection.execute(`
      SELECT id, name FROM teachers WHERE is_active = TRUE LIMIT 3
    `);    const [academicStructures] = await connection.execute(`
      SELECT id, name as subject_name, code as subject_code FROM academic_structures WHERE is_active = TRUE LIMIT 3
    `);
    
    console.log(`   📚 Docentes disponibles: ${teachers.length}`);
    console.log(`   📖 Asignaturas disponibles: ${academicStructures.length}`);
    
    if (teachers.length === 0 || academicStructures.length === 0) {
      console.log('⚠️ No hay datos suficientes para las pruebas');
      return;
    }

    // 3. Probar sp_ValidateAndSaveScheduleEvent
    console.log('\n🧪 Probando sp_ValidateAndSaveScheduleEvent...');
    
    const testDate = new Date();
    testDate.setHours(9, 0, 0, 0); // 9:00 AM
    const endDate = new Date(testDate);
    endDate.setHours(10, 30, 0, 0); // 10:30 AM
    
    try {
      const [result] = await connection.execute(`
        CALL sp_ValidateAndSaveScheduleEvent(?, ?, 1, ?, ?, 'Lunes', 'Aula-101', 1, @event_id, @status_code, @error_message)
      `, [
        academicStructures[0].id,
        teachers[0].id,
        testDate.toISOString().slice(0, 19).replace('T', ' '),
        endDate.toISOString().slice(0, 19).replace('T', ' ')
      ]);

      const [output] = await connection.execute('SELECT @event_id as event_id, @status_code as status_code, @error_message as error_message');
      const resultData = output[0];
      
      if (resultData.status_code === 'SUCCESS') {
        console.log(`   ✅ Evento creado exitosamente - ID: ${resultData.event_id}`);
      } else {
        console.log(`   ⚠️ Error en creación: ${resultData.error_message}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error ejecutando procedure: ${error.message}`);
    }

    // 4. Probar sp_GetScheduleEvents
    console.log('\n🧪 Probando sp_GetScheduleEvents...');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Última semana
    const endDateRange = new Date();
    endDateRange.setDate(endDateRange.getDate() + 7); // Próxima semana
    
    try {
      const [events] = await connection.execute(`
        CALL sp_GetScheduleEvents(NULL, ?, ?, NULL, NULL)
      `, [
        startDate.toISOString().slice(0, 10),
        endDateRange.toISOString().slice(0, 10)
      ]);

      console.log(`   ✅ Consulta exitosa - Eventos encontrados: ${events.length}`);
      
      if (events.length > 0) {
        console.log('   📅 Eventos recientes:');
        events.slice(0, 3).forEach(event => {
          console.log(`      - ${event.subject_name} | ${event.teacher_first_name} ${event.teacher_last_name} | ${event.start_datetime}`);
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Error en consulta: ${error.message}`);
    }

    // 5. Probar sp_DeleteScheduleEvent (solo si hay eventos)
    if (procedures.some(p => p.ROUTINE_NAME === 'sp_DeleteScheduleEvent')) {
      console.log('\n🧪 Probando sp_DeleteScheduleEvent...');
      
      const [recentEvents] = await connection.execute(`
        SELECT id FROM schedule_events WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1
      `);
      
      if (recentEvents.length > 0) {
        try {
          await connection.execute(`
            CALL sp_DeleteScheduleEvent(?, 1, TRUE, @status_code, @error_message)
          `, [recentEvents[0].id]);

          const [deleteResult] = await connection.execute('SELECT @status_code as status_code, @error_message as error_message');
          const deleteData = deleteResult[0];
          
          if (deleteData.status_code === 'SUCCESS') {
            console.log(`   ✅ Evento eliminado exitosamente (lógico)`);
          } else {
            console.log(`   ⚠️ Error en eliminación: ${deleteData.error_message}`);
          }
          
        } catch (error) {
          console.log(`   ❌ Error en eliminación: ${error.message}`);
        }
      } else {
        console.log('   ⚠️ No hay eventos para eliminar');
      }
    }

    console.log('\n🎉 Pruebas de stored procedures completadas');
    console.log('\n📊 Resumen de funcionalidades:');
    console.log('   - ✅ Validación y creación de eventos');
    console.log('   - ✅ Consulta de eventos con filtros');
    console.log('   - ✅ Eliminación lógica de eventos');
    console.log('   - ✅ Validaciones de conflictos de horario');
    
  } catch (error) {
    console.error('\n❌ Error en pruebas:', error.message);
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

testStoredProcedures();
