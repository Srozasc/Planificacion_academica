const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAcademicStructuresCount() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });

    try {
        console.log('Checking record count in academic_structures table...');
        const [rows] = await connection.execute('SELECT COUNT(*) AS count FROM academic_structures;');
        console.log(`Record count in academic_structures: ${rows[0].count}`);
    } catch (error) {
        console.error('Error checking academic_structures count:', error);
    } finally {
        await connection.end();
    }
}

checkAcademicStructuresCount();