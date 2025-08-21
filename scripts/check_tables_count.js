require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Conectado a la base de datos:', process.env.DB_NAME);
    console.log('\n=== CONTEO DE REGISTROS EN TABLAS ===\n');

    const tables = [
      'permisos_pendientes',
      'usuario_permisos_carrera', 
      'usuario_permisos_categoria',
      'carreras',
      'asignaturas',
      'users'
    ];

    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`${table}: ${rows[0].count} registros`);
      } catch (error) {
        console.log(`${table}: ERROR - ${error.message}`);
      }
    }

    // Verificar estado de permisos_pendientes
    console.log('\n=== ESTADO DE PERMISOS PENDIENTES ===\n');
    try {
      const [estados] = await connection.execute(`
        SELECT estado, COUNT(*) as count 
        FROM permisos_pendientes 
        GROUP BY estado
      `);
      
      if (estados.length > 0) {
        estados.forEach(row => {
          console.log(`Estado ${row.estado}: ${row.count} registros`);
        });
      } else {
        console.log('No hay registros en permisos_pendientes');
      }
    } catch (error) {
      console.log('Error al verificar estados:', error.message);
    }

    await connection.end();
    console.log('\nVerificación completada.');
  } catch (error) {
    console.error('Error de conexión:', error.message);
  }
})();