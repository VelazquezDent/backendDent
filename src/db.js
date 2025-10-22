// src/db.js
const mysql = require('mysql2/promise');

// Configuración de la conexión con el pool
const db = mysql.createPool({
    host: '82.197.82.141',   // Cambia esto por el host que te proporciona Hostinger
    user: 'u781535968_consulDental2',                 // Usuario de la base de datos
    password: 'Velazquezdental12*',          // Contraseña de la base de datos
    database: 'u781535968_consulDental2',       // Nombre de la base de datos
    waitForConnections: true,
    connectionLimit: 10,                // Límite de conexiones en el pool
    queueLimit: 0
});

module.exports = db;
