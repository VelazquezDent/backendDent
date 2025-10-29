const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ============================================================
   CONSULTAS BASE / HELPERS
   (todas adaptadas a tu BD real)
   ============================================================ */

// TOTAL DE PUNTOS OTORGADOS (solo tipo = 'ALTA')
async function totalPuntosOtorgadosDB() {
    const [rows] = await pool.query(
        `SELECT COALESCE(SUM(puntos), 0) AS total_puntos
     FROM puntos_movimientos
     WHERE tipo = 'ALTA'`
    );
    return rows[0]; // { total_puntos: number }
}

// TOTAL DE LOGROS DESBLOQUEADOS (cuántas veces se han asignado logros)
async function totalLogrosDesbloqueadosDB() {
    const [rows] = await pool.query(
        `SELECT COUNT(*) AS total_logros
     FROM logros_pacientes`
    );
    return rows[0]; // { total_logros: number }
}

// TOTAL DE RECOMPENSAS CANJEADAS (aprobadas o entregadas)
async function totalRecompensasCanjeadasDB() {
    const [rows] = await pool.query(
        `SELECT COUNT(*) AS total_canje
     FROM recompensas_canje
     WHERE estado IN ('aprobado', 'entregado')`
    );
    return rows[0]; // { total_canje: number }
}

// TOP PACIENTES MÁS ACTIVOS (ranking por puntos)
async function topPacientesActivosDB(limit = 10) {
    const [rows] = await pool.query(
        `SELECT 
        u.id               AS usuario_id,
        u.nombre           AS nombre,
        u.apellido_paterno AS apellido_paterno,
        COALESCE(SUM(pm.puntos),0) AS puntos_ganados
     FROM usuarios u
     LEFT JOIN puntos_movimientos pm
       ON pm.usuario_id = u.id
       AND pm.tipo = 'ALTA'
     GROUP BY u.id
     ORDER BY puntos_ganados DESC
     LIMIT ?`,
        [limit]
    );
    return rows;
}

// ACTIVIDAD POR FECHA (rango)
// Esto resume puntos, logros, recompensas entre fecha_inicio y fecha_fin
async function actividadPorFechaDB({ fecha_inicio, fecha_fin }) {
    let wherePuntos = `1=1`;
    let whereLogros = `1=1`;
    let whereCanje = `1=1`;

    const paramsPuntos = [];
    const paramsLogros = [];
    const paramsCanje = [];

    if (fecha_inicio && fecha_fin) {
        wherePuntos += ` AND pm.fecha_movimiento BETWEEN ? AND ?`;
        whereLogros += ` AND lp.fecha_obtencion BETWEEN ? AND ?`;
        whereCanje += ` AND rc.solicitado_en BETWEEN ? AND ?`;

        paramsPuntos.push(fecha_inicio, fecha_fin);
        paramsLogros.push(fecha_inicio, fecha_fin);
        paramsCanje.push(fecha_inicio, fecha_fin);
    }

    const [puntosRows] = await pool.query(
        `SELECT COALESCE(SUM(pm.puntos),0) AS puntos_otorgados
     FROM puntos_movimientos pm
     WHERE ${wherePuntos}
       AND pm.tipo = 'ALTA'`,
        paramsPuntos
    );

    const [logrosRows] = await pool.query(
        `SELECT COUNT(*) AS logros_desbloqueados
     FROM logros_pacientes lp
     WHERE ${whereLogros}`,
        paramsLogros
    );

    const [canjeRows] = await pool.query(
        `SELECT COUNT(*) AS recompensas_solicitadas
     FROM recompensas_canje rc
     WHERE ${whereCanje}`,
        paramsCanje
    );

    return {
        puntos_otorgados: puntosRows[0]?.puntos_otorgados || 0,
        logros_desbloqueados: logrosRows[0]?.logros_desbloqueados || 0,
        recompensas_solicitadas: canjeRows[0]?.recompensas_solicitadas || 0
    };
}

// TOP MOTIVOS / FRECUENCIAS GLOBALES
// Qué cosas están generando más puntos, qué logros se dan más, qué recompensas se canjean más
async function actividadGeneralDB() {
    // 1. Motivos de puntos más frecuentes
    const [motivosRows] = await pool.query(
        `SELECT motivo,
            COUNT(*) AS veces,
            SUM(puntos) AS puntos_totales
     FROM puntos_movimientos
     WHERE tipo = 'ALTA'
     GROUP BY motivo
     ORDER BY puntos_totales DESC
     LIMIT 5`
    );

    // 2. Logros más entregados
    const [logrosRows] = await pool.query(
        `SELECT lc.nombre AS logro,
            COUNT(lp.id) AS veces_otorgado
     FROM logros_pacientes lp
     INNER JOIN logros_catalogo lc ON lc.id = lp.logro_id
     GROUP BY lc.id
     ORDER BY veces_otorgado DESC
     LIMIT 5`
    );

    // 3. Recompensas más canjeadas
    const [recompensasRows] = await pool.query(
        `SELECT rcat.nombre AS recompensa,
            COUNT(rc.id) AS veces_canjeada
     FROM recompensas_canje rc
     INNER JOIN recompensas_catalogo rcat
             ON rcat.id = rc.recompensa_id
     WHERE rc.estado IN ('aprobado', 'entregado')
     GROUP BY rcat.id
     ORDER BY veces_canjeada DESC
     LIMIT 5`
    );

    return {
        puntos_por_motivo: motivosRows,
        logros_mas_entregados: logrosRows,
        recompensas_mas_canjeadas: recompensasRows
    };
}

// PARTICIPACIÓN MENSUAL
// Devuelve actividad agregada por mes (para gráficas de tendencia)
async function participacionMensualDB() {
    // Puntos por mes
    const [puntosMensual] = await pool.query(
        `SELECT DATE_FORMAT(pm.fecha_movimiento, '%Y-%m') AS mes,
            SUM(pm.puntos) AS puntos_mes
     FROM puntos_movimientos pm
     WHERE pm.tipo = 'ALTA'
     GROUP BY mes
     ORDER BY mes DESC
     LIMIT 6`
    );

    // Logros por mes
    const [logrosMensual] = await pool.query(
        `SELECT DATE_FORMAT(lp.fecha_obtencion, '%Y-%m') AS mes,
            COUNT(*) AS logros_mes
     FROM logros_pacientes lp
     GROUP BY mes
     ORDER BY mes DESC
     LIMIT 6`
    );

    // Recompensas por mes
    const [recompensasMensual] = await pool.query(
        `SELECT DATE_FORMAT(rc.solicitado_en, '%Y-%m') AS mes,
            COUNT(*) AS recompensas_mes
     FROM recompensas_canje rc
     WHERE rc.estado IN ('aprobado', 'entregado')
     GROUP BY mes
     ORDER BY mes DESC
     LIMIT 6`
    );

    return {
        puntos_por_mes: puntosMensual,
        logros_por_mes: logrosMensual,
        recompensas_por_mes: recompensasMensual
    };
}

// PERFIL DE UN PACIENTE
// Métricas individuales para un paciente específico
async function resumenPacienteDB(usuarioId) {
    // total de puntos del paciente
    const [pts] = await pool.query(
        `SELECT COALESCE(SUM(puntos),0) AS puntos_ganados
     FROM puntos_movimientos
     WHERE usuario_id = ? AND tipo = 'ALTA'`,
        [usuarioId]
    );

    // historial de movimientos de puntos del paciente
    const [movs] = await pool.query(
        `SELECT motivo,
            puntos,
            fecha_movimiento
     FROM puntos_movimientos
     WHERE usuario_id = ?
     ORDER BY fecha_movimiento DESC
     LIMIT 20`,
        [usuarioId]
    );

    // logros que tiene el paciente
    const [logs] = await pool.query(
        `SELECT lc.nombre AS logro,
            lc.descripcion AS detalle,
            lp.fecha_obtencion
     FROM logros_pacientes lp
     INNER JOIN logros_catalogo lc ON lc.id = lp.logro_id
     WHERE lp.usuario_id = ?
     ORDER BY lp.fecha_obtencion DESC`,
        [usuarioId]
    );

    // recompensas que ha canjeado el paciente
    const [rcs] = await pool.query(
        `SELECT rcat.nombre AS recompensa,
            rc.estado,
            rc.solicitado_en,
            rc.entregado_en
     FROM recompensas_canje rc
     INNER JOIN recompensas_catalogo rcat
             ON rcat.id = rc.recompensa_id
     WHERE rc.usuario_id = ?
     ORDER BY rc.solicitado_en DESC`,
        [usuarioId]
    );

    // datos básicos del paciente
    const [usr] = await pool.query(
        `SELECT id AS usuario_id,
            nombre,
            apellido_paterno
     FROM usuarios
     WHERE id = ?
     LIMIT 1`,
        [usuarioId]
    );

    return {
        paciente: usr[0] || null,
        puntos_totales: pts[0]?.puntos_ganados || 0,
        movimientos_recientes: movs,
        logros: logs,
        recompensas: rcs
    };
}

/* ============================================================
   RUTAS / CONTROLADORES
   ============================================================ */

// DASHBOARD GENERAL
// GET /api/reportes-gamificacion/resumen
router.get('/resumen', async (req, res) => {
    try {
        const [puntos, logros, canjes, topPacientes] = await Promise.all([
            totalPuntosOtorgadosDB(),
            totalLogrosDesbloqueadosDB(),
            totalRecompensasCanjeadasDB(),
            topPacientesActivosDB(10)
        ]);

        return res.json({
            ok: true,
            data: {
                total_puntos_otorgados: puntos.total_puntos,
                total_logros_desbloqueados: logros.total_logros,
                total_recompensas_canjeadas: canjes.total_canje,
                top_pacientes: topPacientes
            }
        });
    } catch (err) {
        console.error('GET /resumen error:', err);
        return res.status(500).json({
            ok: false,
            error: 'Error interno al obtener el resumen de gamificación'
        });
    }
});

// RANKING DE PACIENTES
// GET /api/reportes-gamificacion/top-pacientes?limit=10
router.get('/top-pacientes', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || '10', 10);
        const lista = await topPacientesActivosDB(limit);

        return res.json({
            ok: true,
            data: lista
        });
    } catch (err) {
        console.error('GET /top-pacientes error:', err);
        return res.status(500).json({
            ok: false,
            error: 'Error interno al obtener pacientes más activos'
        });
    }
});

// ACTIVIDAD POR RANGO DE FECHAS
// GET /api/reportes-gamificacion/actividad?fecha_inicio=2025-01-01&fecha_fin=2025-12-31
router.get('/actividad', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        const datos = await actividadPorFechaDB({
            fecha_inicio: fecha_inicio || null,
            fecha_fin: fecha_fin || null
        });

        return res.json({
            ok: true,
            data: datos
        });
    } catch (err) {
        console.error('GET /actividad error:', err);
        return res.status(500).json({
            ok: false,
            error: 'Error interno al obtener actividad por fecha'
        });
    }
});

// ACTIVIDAD GENERAL (frecuencias globales)
// GET /api/reportes-gamificacion/actividad-general
router.get('/actividad-general', async (req, res) => {
    try {
        const data = await actividadGeneralDB();
        return res.json({
            ok: true,
            data
        });
    } catch (err) {
        console.error('GET /actividad-general error:', err);
        return res.status(500).json({
            ok: false,
            error: 'Error interno al obtener actividad general'
        });
    }
});

// PARTICIPACIÓN MENSUAL (tendencia histórica)
// GET /api/reportes-gamificacion/participacion-mensual
router.get('/participacion-mensual', async (req, res) => {
    try {
        const data = await participacionMensualDB();
        return res.json({
            ok: true,
            data
        });
    } catch (err) {
        console.error('GET /participacion-mensual error:', err);
        return res.status(500).json({
            ok: false,
            error: 'Error interno al obtener participación mensual'
        });
    }
});

// PERFIL DE UN PACIENTE ESPECÍFICO
// GET /api/reportes-gamificacion/paciente/:usuarioId
router.get('/paciente/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const data = await resumenPacienteDB(usuarioId);

        if (!data.paciente) {
            return res.status(404).json({
                ok: false,
                error: 'Paciente no encontrado'
            });
        }

        return res.json({
            ok: true,
            data
        });
    } catch (err) {
        console.error('GET /paciente/:usuarioId error:', err);
        return res.status(500).json({
            ok: false,
            error: 'Error interno al obtener datos del paciente'
        });
    }
});

module.exports = router;
