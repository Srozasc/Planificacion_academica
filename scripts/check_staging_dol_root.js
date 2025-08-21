const mysql = require('mysql2/promise');

async function checkStagingDol() {
  let connection;
  
  try {
    console.log('🔍 Conectando a la base de datos...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });
    
    console.log('✅ Conexión establecida');
    
    // Verificar estructura de la tabla staging_dol
    console.log('\n📋 Verificando estructura de la tabla staging_dol:');
    const [structure] = await connection.execute('DESCRIBE staging_dol');
    console.table(structure);
    
    // Verificar índices de la tabla
    console.log('\n🔑 Verificando índices de la tabla staging_dol:');
    const [indexes] = await connection.execute('SHOW INDEX FROM staging_dol');
    console.table(indexes.map(idx => ({
      Key_name: idx.Key_name,
      Column_name: idx.Column_name,
      Seq_in_index: idx.Seq_in_index,
      Non_unique: idx.Non_unique
    })));
    
    // Contar total de registros
    console.log('\n📊 Contando registros en staging_dol:');
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM staging_dol');
    console.log(`Total de registros: ${countResult[0].total}`);
    
    if (countResult[0].total > 0) {
      // Mostrar registros por bimestre
      console.log('\n📈 Registros por bimestre:');
      const [bimestreCount] = await connection.execute(`
        SELECT 
          id_bimestre,
          COUNT(*) as cantidad
        FROM staging_dol 
        GROUP BY id_bimestre 
        ORDER BY id_bimestre
      `);
      console.table(bimestreCount);
      
      // Mostrar registros por plan
      console.log('\n📋 Registros por plan:');
      const [planCount] = await connection.execute(`
        SELECT 
          plan,
          COUNT(*) as cantidad
        FROM staging_dol 
        GROUP BY plan 
        ORDER BY plan
      `);
      console.table(planCount);
      
      // Verificar combinaciones únicas de sigla-plan
      console.log('\n🔍 Verificando combinaciones únicas sigla-plan:');
      const [uniqueCombinations] = await connection.execute(`
        SELECT 
          sigla,
          plan,
          COUNT(*) as cantidad
        FROM staging_dol 
        GROUP BY sigla, plan
        HAVING COUNT(*) > 1
        ORDER BY cantidad DESC, sigla, plan
      `);
      
      if (uniqueCombinations.length > 0) {
        console.log('⚠️  Combinaciones duplicadas encontradas:');
        console.table(uniqueCombinations);
      } else {
        console.log('✅ No se encontraron combinaciones duplicadas de sigla-plan');
      }
      
      // Mostrar muestra de datos recientes
      console.log('\n📋 Muestra de datos más recientes (últimos 10):');
      const [sampleData] = await connection.execute(`
        SELECT 
          sigla,
          plan,
          descripcion,
          id_bimestre
        FROM staging_dol 
        ORDER BY id_bimestre DESC, sigla, plan
        LIMIT 10
      `);
      console.table(sampleData);
      
      // Verificar si hay registros con la misma sigla en diferentes planes
      console.log('\n🔄 Verificando siglas que aparecen en múltiples planes:');
      const [multiPlanSiglas] = await connection.execute(`
        SELECT 
          sigla,
          COUNT(DISTINCT plan) as planes_diferentes,
          GROUP_CONCAT(DISTINCT plan ORDER BY plan) as planes
        FROM staging_dol 
        GROUP BY sigla
        HAVING COUNT(DISTINCT plan) > 1
        ORDER BY planes_diferentes DESC, sigla
      `);
      
      if (multiPlanSiglas.length > 0) {
        console.log('✅ Siglas que aparecen en múltiples planes (esto es correcto):');
        console.table(multiPlanSiglas);
      } else {
        console.log('ℹ️  No hay siglas que aparezcan en múltiples planes');
      }
    }
    
    console.log('\n✅ Verificación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la verificación
checkStagingDol();