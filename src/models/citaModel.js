const db = require('../db');

exports.crearCitas = async (citas) => {
    const query = `INSERT INTO citas (tratamiento_paciente_id, fecha_hora, estado, pagada) VALUES ?`;
    await db.query(query, [citas]);
};
exports.obtenerCitasPorTratamiento = async (tratamientoPacienteId) => {
    const query = `SELECT * FROM citas WHERE tratamiento_paciente_id = ?`;
    const [rows] = await db.query(query, [tratamientoPacienteId]);
    return rows;
};