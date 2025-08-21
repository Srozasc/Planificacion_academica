const mysql = require('mysql2/promise');

async function checkData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'planificacion_user',
    password: 'PlanUser2025!',
    database: 'planificacion_academica'
  });

  try {
    console.log('=== Verificando datos en schedule_events ===');
    const [events] = await connection.execute(
      'SELECT id, subject, title FROM schedule_events WHERE active = 1 LIMIT 3'
    );
    console.log('Eventos encontrados:', events);

    console.log('\n=== Verificando datos en academic_structures ===');
    const [academics] = await connection.execute(
      'SELECT acronym, name, school_prog, code FROM academic_structures LIMIT 3'
    );
    console.log('Estructuras académicas encontradas:', academics);

    console.log('\n=== Verificando JOIN entre tablas ===');
    const [joined] = await connection.execute(`
      SELECT e.id, e.subject, e.title, a.acronym, a.name, a.school_prog, a.code 
      FROM schedule_events e 
      LEFT JOIN academic_structures a ON a.acronym = e.subject 
      WHERE e.active = 1 
      LIMIT 3
    `);
    console.log('Resultado del JOIN:', joined);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkData();