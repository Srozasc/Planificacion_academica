const mysql = require('mysql2/promise');
require('dotenv').config();

async function testUpdateEvent() {
  let connection;
  
  try {
    console.log('🔍 Probando actualización de evento con sp_ValidateAndSaveScheduleEvent...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'DuocAdmin123.',
      database: process.env.DB_DATABASE || 'planificacion_academica',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conexión establecida');

    // 1. Verificar evento existente ID 5
    console.log('\n📋 Verificando evento existente...');
    const [existingEvents] = await connection.execute(
      'SELECT * FROM schedule_events WHERE id = 5 AND is_active = TRUE'
    );
    
    if (existingEvents.length === 0) {
      console.log('⚠️ No se encontró evento con ID 5 activo');
      
      // Mostrar eventos disponibles
      const [allEvents] = await connection.execute(
        'SELECT id, classroom, teacher_id, is_active FROM schedule_events ORDER BY id DESC LIMIT 5'
      );
      
      console.log('\n📋 Eventos disponibles:');
      allEvents.forEach(event => {
        console.log(`   ID: ${event.id}, Aula: ${event.classroom}, Activo: ${event.is_active}`);
      });
      
      return;
    }
    
    const originalEvent = existingEvents[0];
    console.log('📝 Evento original encontrado:');
    console.log(`   ID: ${originalEvent.id}`);
    console.log(`   Aula: ${originalEvent.classroom}`);
    console.log(`   Docente ID: ${originalEvent.teacher_id}`);
    console.log(`   Horario: ${originalEvent.start_datetime}`);
    console.log(`   Activo: ${originalEvent.is_active}`);

    // 2. Preparar datos de "actualización" (enviando JSON con ID)
    const updateData = {
      id: 5,  // ¡Incluir ID para ver si el SP lo detecta!
      academic_structure_id: originalEvent.academic_structure_id,
      teacher_id: 3,  // Cambiar docente (diferente al original)
      area_id: originalEvent.area_id,
      start_datetime: '2024-07-02 10:00:00',  // Cambiar fecha y hora
      end_datetime: '2024-07-02 12:00:00',
      day_of_week: 'MARTES',  // Cambiar día
      classroom: 'Aula Actualizada con SP',  // Cambiar aula
      vacancies: 28,
      max_capacity: 32,
      weekly_hours: 2.0,
      academic_period: '2024-1',
      section: 'TEST-UPD'
    };

    console.log('\n📝 Datos para "actualización":');
    console.log('   Nuevo docente ID:', updateData.teacher_id);
    console.log('   Nueva aula:', updateData.classroom);
    console.log('   Nuevo horario:', updateData.start_datetime);
    console.log('   Nuevo día:', updateData.day_of_week);

    // 3. Llamar al SP con los datos que incluyen ID
    console.log('\n🔧 Llamando a sp_ValidateAndSaveScheduleEvent...');
    
    await connection.execute(
      'CALL sp_ValidateAndSaveScheduleEvent(?, ?, @event_id, @status_code, @error_message)',
      [JSON.stringify(updateData), 1]
    );

    // 4. Obtener resultados
    const [outputResults] = await connection.execute(
      'SELECT @event_id as event_id, @status_code as status_code, @error_message as error_message'
    );
    
    const output = outputResults[0];
    
    console.log('\n📋 Resultado del SP:');
    console.log(`   Event ID retornado: ${output.event_id}`);
    console.log(`   Status Code: ${output.status_code}`);
    console.log(`   Error Message: ${output.error_message}`);

    // 5. Analizar qué pasó
    if (output.status_code === 'SUCCESS') {
      if (output.event_id === 5) {
        console.log('\n🔄 ¡ACTUALIZACIÓN! El evento original fue modificado');
        
        // Verificar los cambios
        const [updatedEvent] = await connection.execute(
          'SELECT * FROM schedule_events WHERE id = 5'
        );
        
        if (updatedEvent.length > 0) {
          const event = updatedEvent[0];
          console.log('\n📋 Estado después de la "actualización":');
          console.log(`   Aula: ${event.classroom}`);
          console.log(`   Docente ID: ${event.teacher_id}`);
          console.log(`   Horario: ${event.start_datetime}`);
          console.log(`   Día: ${event.day_of_week}`);
          console.log(`   Activo: ${event.is_active}`);
          
          // Comparar con original
          console.log('\n🔍 Comparación:');
          console.log(`   Aula cambió: ${originalEvent.classroom} → ${event.classroom}`);
          console.log(`   Docente cambió: ${originalEvent.teacher_id} → ${event.teacher_id}`);
          console.log(`   Horario cambió: ${originalEvent.start_datetime} → ${event.start_datetime}`);
        }
      } else {
        console.log(`\n➕ CREACIÓN! Se creó un nuevo evento con ID: ${output.event_id}`);
        
        // Verificar el nuevo evento
        const [newEvent] = await connection.execute(
          'SELECT * FROM schedule_events WHERE id = ?',
          [output.event_id]
        );
        
        if (newEvent.length > 0) {
          console.log('\n📋 Nuevo evento creado:');
          console.log(`   ID: ${newEvent[0].id}`);
          console.log(`   Aula: ${newEvent[0].classroom}`);
          console.log(`   Docente ID: ${newEvent[0].teacher_id}`);
          console.log(`   Horario: ${newEvent[0].start_datetime}`);
        }
        
        // Verificar si el original sigue igual
        const [originalStillThere] = await connection.execute(
          'SELECT * FROM schedule_events WHERE id = 5'
        );
        
        console.log(`\n📋 Evento original (ID 5) sigue activo: ${originalStillThere[0]?.is_active ? 'SÍ' : 'NO'}`);
      }
    } else {
      console.log(`\n❌ Error en el SP: ${output.error_message}`);
    }

    // 6. Conclusión sobre el comportamiento del SP
    console.log('\n' + '='.repeat(60));
    console.log('💡 CONCLUSIÓN:');
    
    if (output.status_code === 'SUCCESS') {
      if (output.event_id === 5) {
        console.log('✅ El SP SÍ maneja ACTUALIZACIONES cuando se envía un ID existente');
        console.log('🔄 Modifica el evento existente en lugar de crear uno nuevo');
      } else {
        console.log('❌ El SP NO maneja actualizaciones');
        console.log('➕ Siempre crea nuevos eventos, ignora el ID enviado');
      }
    } else {
      console.log('⚠️ El SP tuvo errores de validación');
    }

  } catch (error) {
    console.error('\n❌ Error durante la prueba:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar prueba
testUpdateEvent();
