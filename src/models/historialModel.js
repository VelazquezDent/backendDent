const db = require('../db');

exports.obtenerHistorialesPorUsuario = async (usuarioId) => {
    const query = `
        SELECT *
        FROM historial_medico
        WHERE usuario_id = ?
        ORDER BY fecha_registro DESC;
    `;

    const [historiales] = await db.execute(query, [usuarioId]);
    return historiales;
};
exports.insertarHistorialMedico = async (usuarioId, historialData) => {
    const query = `
        INSERT INTO historial_medico 
        (usuario_id, signos_vitales, bajo_tratamiento, tipo_tratamiento, medicamentos_recetados, observaciones_medicas) 
        VALUES (?, ?, ?, ?, ?, ?);
    `;

    const { signos_vitales, bajo_tratamiento, tipo_tratamiento, medicamentos_recetados, observaciones_medicas } = historialData;

    const [resultado] = await db.execute(query, [
        usuarioId,
        signos_vitales,
        bajo_tratamiento,
        tipo_tratamiento,
        medicamentos_recetados,
        observaciones_medicas
    ]);

    return resultado;
};
