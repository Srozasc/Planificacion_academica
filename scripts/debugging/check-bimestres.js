const mysql = require('mysql2/promise');

async function checkBimestres() {
  let connection;
  
  try {
    console.log('🔍 Verificando bimestres en la base de datos...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });

    console.log('✅ Conexión establecida\n');

    // Verificar todos los bimestres
    const [bimestres] = await connection.execute(`
      SELECT 
        id,
        nombre,
        fechaInicio,
        fechaFin,
        anoAcademico,
        numeroBimestre,
        activo,
        createdAt
      FROM bimestres 
      ORDER BY anoAcademico DESC, numeroBimestre ASC
    `);

    console.log('📅 Bimestres encontrados:');
    console.log('=' .repeat(80));
    
    if (bimestres.length === 0) {
      console.log('❌ No se encontraron bimestres en la base de datos');
    } else {
      bimestres.forEach(bimestre => {
        console.log(`ID: ${bimestre.id}`);
        console.log(`Nombre: ${bimestre.nombre}`);
        console.log(`Año Académico: ${bimestre.anoAcademico}`);
        console.log(`Número: ${bimestre.numeroBimestre}`);
        console.log(`Fecha Inicio: ${bimestre.fechaInicio}`);
        console.log(`Fecha Fin: ${bimestre.fechaFin}`);
        console.log(`Activo: ${bimestre.activo ? 'SÍ' : 'NO'}`);
        console.log(`Creado: ${bimestre.createdAt}`);
        
        // Verificar si contiene la fecha de prueba
        const fechaPrueba = new Date('2025-06-01');
        const fechaInicio = new Date(bimestre.fechaInicio);
        const fechaFin = new Date(bimestre.fechaFin);
        const contieneFecha = fechaPrueba >= fechaInicio && fechaPrueba <= fechaFin;
        
        console.log(`¿Contiene 2025-06-01?: ${contieneFecha ? 'SÍ' : 'NO'}`);
        console.log('-'.repeat(40));
      });
    }

    // Verificar específicamente bimestres activos
    const [bimestresActivos] = await connection.execute(`
      SELECT COUNT(*) as total FROM bimestres WHERE activo = true
    `);
    
    console.log(`\n📊 Total de bimestres activos: ${bimestresActivos[0].total}`);
    
    // Verificar si hay algún bimestre que contenga la fecha 2025-06-01
    const [bimestreConFecha] = await connection.execute(`
      SELECT 
        id, nombre, fechaInicio, fechaFin, activo
      FROM bimestres 
      WHERE '2025-06-01' >= fechaInicio 
        AND '2025-06-01' <= fechaFin
        AND activo = true
    `);
    
    console.log(`\n🎯 Bimestres que contienen 2025-06-01:`);
    if (bimestreConFecha.length === 0) {
      console.log('❌ Ningún bimestre activo contiene la fecha 2025-06-01');
    } else {
      bimestreConFecha.forEach(b => {
        console.log(`✅ ${b.nombre} (${b.fechaInicio} - ${b.fechaFin})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

checkBimestres();