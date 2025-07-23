const db = require('../db');

// 1. Resumen de Citas por Estado y Mes
exports.obtenerResumenCitas = async (desde, hasta) => {
    const query = `
        SELECT 
            DATE_FORMAT(fecha_hora, '%Y-%m') AS mes,
            estado,
            COUNT(*) AS total
        FROM citas
        WHERE fecha_hora BETWEEN ? AND ?
        GROUP BY mes, estado
        ORDER BY mes, estado;
    `;
    const [rows] = await db.execute(query, [desde, hasta]);
    return rows;
};

// 2. Ingresos mensuales por pagos
exports.obtenerIngresosMensuales = async (desde, hasta) => {
    const query = `
        SELECT 
            DATE_FORMAT(fecha_pago, '%Y-%m') AS mes,
            SUM(monto) AS ingresos
        FROM pagos
        WHERE estado = 'pagado'
          AND fecha_pago BETWEEN ? AND ?
        GROUP BY mes
        ORDER BY mes;
    `;
    const [rows] = await db.execute(query, [desde, hasta]);
    return rows;
};

// 3. Tratamientos más solicitados
exports.obtenerTratamientosPopulares = async (desde, hasta) => {
    const query = `
        SELECT 
            DATE_FORMAT(tp.fecha_inicio, '%Y-%m') AS mes,
            t.nombre AS tratamiento,
            COUNT(*) AS total_solicitudes
        FROM tratamientos_pacientes tp
        JOIN tratamientos t ON tp.tratamiento_id = t.id
        WHERE tp.fecha_inicio BETWEEN ? AND ?
        GROUP BY mes, tratamiento
        ORDER BY mes, total_solicitudes DESC;
    `;
    const [rows] = await db.execute(query, [desde, hasta]);
    return rows;
};
