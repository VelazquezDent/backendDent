const db = require('../db');

// historial de puntos del usuario
// devuelve cada movimiento con fecha, motivo, tipo y puntos
exports.obtenerHistorialPuntos = async (usuarioId) => {
    const [rows] = await db.execute(
        `
        SELECT 
            pm.id,
            pm.fecha_movimiento,
            pm.tipo,
            pm.motivo,
            pm.puntos,
            pm.referencia_cita_id,
            pm.referencia_tratamiento_paciente_id
        FROM puntos_movimientos pm
        WHERE pm.usuario_id = ?
        ORDER BY pm.fecha_movimiento DESC;
        `,
        [usuarioId]
    );

    return rows;
};

// saldo actual (para mostrar en perfil junto al historial)
exports.obtenerSaldoPuntos = async (usuarioId) => {
    const [rows] = await db.execute(
        `
        SELECT 
            ps.puntos_disponibles,
            ps.puntos_en_pausa,
            ps.actualizado_en
        FROM puntos_saldos ps
        WHERE ps.usuario_id = ?
        LIMIT 1;
        `,
        [usuarioId]
    );

    if (rows.length === 0) {
        // si nunca se le han dado puntos, devolvemos 0 en vez de null
        return {
            puntos_disponibles: 0,
            puntos_en_pausa: 0,
            actualizado_en: null,
        };
    }

    return rows[0];
};
