const db = require('../db');

// Función para crear un paciente sin plataforma
const crearPacienteSinPlataforma = async (pacienteData) => {
    const { nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, fecha_registro } = pacienteData;

    const [result] = await db.query(
        `INSERT INTO pacientes_sin_plataforma (nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, fecha_creacion) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, fecha_registro]
    );

    return result.insertId;
};

// Función para buscar si un paciente sin plataforma ya existe por email o teléfono
const obtenerPacienteSinPlataforma = async () => {
    const [pacientes] = await db.query(
        `SELECT * FROM pacientes_sin_plataforma`
    );
    return pacientes;
};

// Modificamos esta función para buscar por teléfono y email (si se proporciona)
const obtenerPacienteSinPlataformaExistentes = async (email, telefono) => {
    let query = `SELECT * FROM pacientes_sin_plataforma WHERE telefono = ?`;
    const params = [telefono];

    // Si se proporciona un email, lo incluimos en la consulta
    if (email && email.trim() !== '') {
        query += ` OR email = ?`;
        params.push(email);
    }

    const [pacientes] = await db.query(query, params);
    return pacientes.length > 0 ? pacientes[0] : null; // Si hay resultados, retorna el primer paciente
};
// ACTUALIZAR datos personales
const actualizarPacienteSinPlataforma = async (id, data) => {
    const { nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email } = data;

    await db.query(
        `UPDATE pacientes_sin_plataforma
         SET nombre = ?, 
             apellido_paterno = ?, 
             apellido_materno = ?, 
             telefono = ?, 
             fecha_nacimiento = ?, 
             sexo = ?, 
             email = ?
         WHERE id = ?`,
        [nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email || null, id]
    );
};
// Buscar si existe OTRO paciente (para editar)
const obtenerPacienteSinPlataformaExistentesEditar = async (
    id,
    email,
    telefono
) => {
    // Excluimos el propio id
    let query = `
    SELECT * FROM pacientes_sin_plataforma
    WHERE id <> ?
      AND (telefono = ?`;
    const params = [id, telefono];

    if (email && email.trim() !== "") {
        query += ` OR email = ?`;
        params.push(email);
    }

    query += `)`;

    const [pacientes] = await db.query(query, params);
    return pacientes.length > 0 ? pacientes[0] : null;
};
// Eliminar paciente sin plataforma y todas sus relaciones
const eliminarPacienteSinPlataformaCompleto = async (pacienteId) => {
    const connection = await db.getConnection(); // asumiendo que `db` es un pool de mysql2/promise

    try {
        await connection.beginTransaction();

        // 1) Obtener tratamientos del paciente sin plataforma
        const [tratamientos] = await connection.query(
            "SELECT id FROM tratamientos_pacientes WHERE paciente_id = ?",
            [pacienteId]
        );
        const tratamientosIds = tratamientos.map((t) => t.id);

        let citasIds = [];

        if (tratamientosIds.length > 0) {
            // 2) Obtener citas de esos tratamientos
            const [citas] = await connection.query(
                `SELECT id FROM citas WHERE tratamiento_paciente_id IN (?)`,
                [tratamientosIds]
            );
            citasIds = citas.map((c) => c.id);

            // 3) Eliminar pagos ligados a esas citas
            if (citasIds.length > 0) {
                await connection.query(
                    `DELETE FROM pagos WHERE cita_id IN (?)`,
                    [citasIds]
                );
            }

            // 4) Eliminar citas de esos tratamientos
            await connection.query(
                `DELETE FROM citas WHERE tratamiento_paciente_id IN (?)`,
                [tratamientosIds]
            );

            // 5) Eliminar tratamientos_pacientes del paciente
            await connection.query(
                `DELETE FROM tratamientos_pacientes WHERE paciente_id = ?`,
                [pacienteId]
            );
        }

        // 6) Eliminar pagos que tengan paciente_id (por si hay pagos sueltos)
        await connection.query(
            `DELETE FROM pagos WHERE paciente_id = ?`,
            [pacienteId]
        );

        // 7) Eliminar historial médico ligado al paciente sin plataforma
        await connection.query(
            `DELETE FROM historial_medico WHERE paciente_sin_plataforma_id = ?`,
            [pacienteId]
        );

        // 8) Finalmente, eliminar el paciente sin plataforma
        const [result] = await connection.query(
            `DELETE FROM pacientes_sin_plataforma WHERE id = ?`,
            [pacienteId]
        );

        await connection.commit();
        connection.release();

        // Si no borró ninguna fila, es que no existía
        return result.affectedRows > 0;
    } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
    }
};

module.exports = {
    crearPacienteSinPlataforma,
    obtenerPacienteSinPlataforma,
    obtenerPacienteSinPlataformaExistentes,
    actualizarPacienteSinPlataforma,
    obtenerPacienteSinPlataformaExistentesEditar,
    eliminarPacienteSinPlataformaCompleto,
};