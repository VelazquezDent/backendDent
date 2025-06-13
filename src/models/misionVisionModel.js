const db = require('../db');

exports.obtenerUltimaVersion = async (tipo) => {
    const query = `SELECT version FROM mision_vision WHERE tipo = ? ORDER BY version DESC LIMIT 1`;
    const [rows] = await db.execute(query, [tipo]);
    return rows.length > 0 ? rows[0].version : 0;
};

exports.marcarComoNoVigente = async (tipo) => {
    const query = `UPDATE mision_vision SET vigente = 0 WHERE tipo = ?`;
    await db.execute(query, [tipo]);
};

exports.insertarNuevaVersion = async (tipo, contenido, version) => {
    const query = `
        INSERT INTO mision_vision (tipo, contenido, version, vigente)
        VALUES (?, ?, ?, 1)
    `;
    const [result] = await db.execute(query, [tipo, contenido, version]);
    return result.insertId;
};
exports.obtenerVigentePorTipo = async (tipo) => {
    const query = `
        SELECT id, tipo, contenido, version, fecha_creacion
        FROM mision_vision
        WHERE tipo = ? AND vigente = 1
        LIMIT 1
    `;
    const [rows] = await db.execute(query, [tipo]);
    return rows.length > 0 ? rows[0] : null;
};


exports.obtenerHistorial = async () => {
    const query = `
        SELECT id, tipo, contenido, version, fecha_creacion
        FROM mision_vision
        WHERE vigente = 0
        ORDER BY tipo ASC, version DESC
    `;
    const [rows] = await db.execute(query);
    return rows;
};