const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigrationSP() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });

    try {
        console.log('Executing MigrateStagingToAcademicStructures stored procedure...');
        await connection.execute('CALL sp_MigrateStagingToAcademicStructures()');
        console.log('MigrateStagingToAcademicStructures stored procedure executed successfully.');
    } catch (error) {
        console.error('Error executing stored procedure:', error);
    } finally {
        await connection.end();
    }
}

runMigrationSP();