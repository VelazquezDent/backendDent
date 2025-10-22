// services/puntos.js
const db = require('../db');

async function sumarPuntos(usuarioId, puntos, motivo, tipoReferencia, idReferencia) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Inserta en tu estructura real
        await conn.query(
            `INSERT INTO puntos_movimientos 
       (usuario_id, tipo, motivo, puntos, referencia_cita_id, referencia_tratamiento_paciente_id, fecha_movimiento, estado_vigencia)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), 'vigente')`,
            [
                usuarioId,
                'ALTA', // o algún valor fijo para "tipo"
                motivo,
                puntos,
                tipoReferencia === 'cita' ? idReferencia : null,
                tipoReferencia === 'tratamiento_paciente' ? idReferencia : null
            ]
        );

        // Actualiza el saldo
        await conn.query(
            `INSERT INTO puntos_saldos (usuario_id, puntos_disponibles, actualizado_en)
       VALUES (?, 0, NOW())
       ON DUPLICATE KEY UPDATE actualizado_en = NOW()`,
            [usuarioId]
        );

        await conn.query(
            `UPDATE puntos_saldos 
       SET puntos_disponibles = puntos_disponibles + ?, actualizado_en = NOW()
       WHERE usuario_id = ?`,
            [puntos, usuarioId]
        );

        await conn.commit();
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}

module.exports = { sumarPuntos };
