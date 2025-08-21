const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'planificacion_academica'
};

async function cleanExistingAdolRecords() {
  let connection;
  
  try {
    console.log('=== LIMPIEZA DE REGISTROS ADOL PENDIENTES EXISTENTES ===');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado a la base de datos');
    
    // 1. Mostrar registros ADOL pendientes actuales
    console.log('\n1. Registros ADOL pendientes actuales:');
    const [currentRecords] = await connection.execute(
      `SELECT id, file_name, upload_type, bimestre_id, approval_status, upload_date 
       FROM upload_logs 
       WHERE upload_type = 'ADOL' AND approval_status = 'Pendiente'
       ORDER BY bimestre_id, upload_date DESC`
    );
    
    if (currentRecords.length === 0) {
      console.log('No hay registros ADOL pendientes para limpiar.');
      return;
    }
    
    console.log(`Total registros ADOL pendientes: ${currentRecords.length}`);
    
    // Agrupar por bimestre
    const recordsByBimestre = {};
    currentRecords.forEach(record => {
      if (!recordsByBimestre[record.bimestre_id]) {
        recordsByBimestre[record.bimestre_id] = [];
      }
      recordsByBimestre[record.bimestre_id].push(record);
    });
    
    // Mostrar registros agrupados por bimestre
    Object.keys(recordsByBimestre).forEach(bimestreId => {
      console.log(`\n  Bimestre ${bimestreId}:`);
      recordsByBimestre[bimestreId].forEach((record, index) => {
        const status = index === 0 ? '(MÁS RECIENTE - SE MANTIENE)' : '(SE ELIMINARÁ)';
        console.log(`    ID: ${record.id}, Archivo: ${record.file_name}, Fecha: ${record.upload_date} ${status}`);
      });
    });
    
    // 2. Eliminar registros duplicados (mantener solo el más reciente por bimestre)
    console.log('\n2. Eliminando registros ADOL pendientes duplicados...');
    
    let totalDeleted = 0;
    
    for (const bimestreId of Object.keys(recordsByBimestre)) {
      const records = recordsByBimestre[bimestreId];
      
      if (records.length > 1) {
        // Mantener solo el más reciente (primer elemento después del ORDER BY)
        const recordsToDelete = records.slice(1); // Todos excepto el primero
        
        for (const record of recordsToDelete) {
          const [deleteResult] = await connection.execute(
            'DELETE FROM upload_logs WHERE id = ?',
            [record.id]
          );
          
          if (deleteResult.affectedRows > 0) {
            console.log(`    ✅ Eliminado: ID ${record.id} - ${record.file_name}`);
            totalDeleted++;
          }
        }
      }
    }
    
    // 3. Verificar estado final
    console.log('\n3. Estado final después de la limpieza:');
    const [finalRecords] = await connection.execute(
      `SELECT id, file_name, upload_type, bimestre_id, approval_status, upload_date 
       FROM upload_logs 
       WHERE upload_type = 'ADOL' AND approval_status = 'Pendiente'
       ORDER BY bimestre_id, upload_date DESC`
    );
    
    console.log(`Total registros ADOL pendientes finales: ${finalRecords.length}`);
    finalRecords.forEach(record => {
      console.log(`  Bimestre ${record.bimestre_id}: ID ${record.id} - ${record.file_name} (${record.upload_date})`);
    });
    
    console.log('\n=== RESUMEN DE LIMPIEZA ===');
    console.log(`Registros eliminados: ${totalDeleted}`);
    console.log(`Registros mantenidos: ${finalRecords.length}`);
    
    if (totalDeleted > 0) {
      console.log('\n✅ LIMPIEZA COMPLETADA EXITOSAMENTE');
      console.log('Ahora cada bimestre tiene solo un registro ADOL pendiente (el más reciente).');
    } else {
      console.log('\nℹ️  NO SE REQUIRIÓ LIMPIEZA');
      console.log('Ya existe solo un registro ADOL pendiente por bimestre.');
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    
    // Si es error de conexión, mostrar instrucciones
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n📋 INSTRUCCIONES PARA CONFIGURAR LA BASE DE DATOS:');
      console.log('1. Asegúrate de que MySQL esté ejecutándose');
      console.log('2. Verifica las credenciales en el archivo (usuario: root, contraseña: root)');
      console.log('3. O modifica las credenciales en la línea 4-8 de este archivo');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexión cerrada');
    }
  }
}

// Ejecutar la limpieza
cleanExistingAdolRecords();