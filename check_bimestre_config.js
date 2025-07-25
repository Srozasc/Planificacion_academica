const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'planificacion_user',
  password: 'PlanUser2025!',
  database: 'planificacion_academica'
};

async function checkBimestreConfiguration() {
  let connection;
  
  try {
    console.log('🔍 Verificando configuración de bimestres...');
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Verificar todos los bimestres
    console.log('\n📅 Todos los bimestres:');
    const [allBimestres] = await connection.execute(
      'SELECT id, nombre, fechaInicio, fechaFin, activo, anoAcademico FROM bimestres ORDER BY fechaInicio DESC'
    );
    
    if (allBimestres.length === 0) {
      console.log('❌ No hay bimestres configurados en la base de datos');
      return;
    }
    
    allBimestres.forEach(bimestre => {
      console.log(`   ID: ${bimestre.id} | ${bimestre.nombre} | ${bimestre.fechaInicio} - ${bimestre.fechaFin} | Activo: ${bimestre.activo ? 'Sí' : 'No'}`);
    });
    
    // 2. Verificar bimestres activos
    console.log('\n✅ Bimestres activos:');
    const [activeBimestres] = await connection.execute(
      'SELECT id, nombre, fechaInicio, fechaFin FROM bimestres WHERE activo = 1 ORDER BY fechaInicio DESC'
    );
    
    if (activeBimestres.length === 0) {
      console.log('❌ No hay bimestres activos');
    } else {
      activeBimestres.forEach(bimestre => {
        console.log(`   ID: ${bimestre.id} | ${bimestre.nombre} | ${bimestre.fechaInicio} - ${bimestre.fechaFin}`);
      });
    }
    
    // 3. Verificar bimestre actual según la lógica del backend
    console.log('\n🎯 Verificando bimestre actual (según lógica del backend):');
    const fechaActual = new Date();
    const inicioAno = new Date(fechaActual.getFullYear(), 0, 1);
    const finAno = new Date(fechaActual.getFullYear(), 11, 31);
    
    console.log(`   Fecha actual: ${fechaActual.toISOString().split('T')[0]}`);
    console.log(`   Buscando bimestres que contengan la fecha actual...`);
    
    const [currentBimestre] = await connection.execute(
      `SELECT id, nombre, fechaInicio, fechaFin, activo 
       FROM bimestres 
       WHERE fechaInicio <= ? 
         AND fechaFin >= ? 
         AND activo = 1
       ORDER BY fechaInicio DESC
       LIMIT 1`,
      [fechaActual.toISOString().split('T')[0], fechaActual.toISOString().split('T')[0]]
    );
    
    if (currentBimestre.length === 0) {
      console.log('❌ No hay bimestre actual que contenga la fecha de hoy');
      
      // Buscar el bimestre más cercano
      console.log('\n🔍 Buscando bimestre más cercano...');
      const [closestBimestre] = await connection.execute(
        `SELECT id, nombre, fechaInicio, fechaFin, activo,
               ABS(DATEDIFF(?, fechaInicio)) as dias_diferencia
         FROM bimestres 
         WHERE activo = 1
         ORDER BY dias_diferencia ASC
         LIMIT 1`,
        [fechaActual.toISOString().split('T')[0]]
      );
      
      if (closestBimestre.length > 0) {
        const bimestre = closestBimestre[0];
        console.log(`   Bimestre más cercano: ID ${bimestre.id} | ${bimestre.nombre} | ${bimestre.fechaInicio} - ${bimestre.fechaFin} (${bimestre.dias_diferencia} días de diferencia)`);
      }
    } else {
      const bimestre = currentBimestre[0];
      console.log(`✅ Bimestre actual encontrado: ID ${bimestre.id} | ${bimestre.nombre} | ${bimestre.fechaInicio} - ${bimestre.fechaFin}`);
    }
    
    // 4. Verificar si el bimestre ID 16 (mencionado por el usuario) existe
    console.log('\n🔍 Verificando bimestre ID 16 (mencionado por el usuario):');
    const [bimestre16] = await connection.execute(
      'SELECT id, nombre, fechaInicio, fechaFin, activo FROM bimestres WHERE id = 16'
    );
    
    if (bimestre16.length === 0) {
      console.log('❌ El bimestre con ID 16 no existe');
    } else {
      const bimestre = bimestre16[0];
      console.log(`✅ Bimestre ID 16: ${bimestre.nombre} | ${bimestre.fechaInicio} - ${bimestre.fechaFin} | Activo: ${bimestre.activo ? 'Sí' : 'No'}`);
    }
    
    // 5. Recomendaciones
    console.log('\n💡 Recomendaciones:');
    if (activeBimestres.length === 0) {
      console.log('   - Activar al menos un bimestre en la base de datos');
    }
    if (currentBimestre.length === 0) {
      console.log('   - Configurar un bimestre que incluya la fecha actual');
      console.log('   - O ajustar las fechas de un bimestre existente para que incluya hoy');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar configuración de bimestres:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkBimestreConfiguration();