const db = require('../db');

exports.crearCitas = async (citas) => {
    const query = `INSERT INTO citas (tratamiento_paciente_id, fecha_hora, estado, pagada) VALUES ?`;
    
    const values = citas.map(cita => [
        cita[0], // tratamiento_paciente_id
        cita[1], // fecha_hora
        null,    // Estado debe ser NULL
        cita[3]  // Pagada
    ]);

    await db.query(query, [values]);
};

exports.obtenerCitasPorTratamiento = async (tratamientoPacienteId) => {
    const query = `SELECT * FROM citas WHERE tratamiento_paciente_id = ?`;
    const [rows] = await db.query(query, [tratamientoPacienteId]);
    return rows;
};
exports.obtenerCitasPorUsuario = async (usuarioId) => {
    const query = `
        SELECT 
            c.id,
            CASE 
                WHEN c.fecha_hora IS NULL OR c.fecha_hora = '0000-00-00 00:00:00' THEN NULL
                ELSE CONVERT_TZ(c.fecha_hora, '+00:00', '-06:00') 
            END AS fecha_hora,
            
            -- Mantener el estado tal cual está en la base de datos (puede ser NULL)
            c.estado AS estado_cita,

            -- Manejar el estado del pago
            CASE 
                WHEN c.pagada = 1 THEN 'Pagado'
                ELSE 'No pagado'
            END AS estado_pago

        FROM citas c
        JOIN tratamientos_pacientes tp ON c.tratamiento_paciente_id = tp.id
        WHERE tp.usuario_id = ?
        ORDER BY c.id ASC;
    `;

    const [citas] = await db.execute(query, [usuarioId]);

    return citas.map(cita => ({
        ...cita,
        fecha_hora: cita.fecha_hora ? new Date(cita.fecha_hora).toISOString() : null,
        estado_cita: cita.estado_cita // Mantener NULL si está en la BD
    }));
};

