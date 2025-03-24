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

module.exports = {
    crearPacienteSinPlataforma,
    obtenerPacienteSinPlataforma,
    obtenerPacienteSinPlataformaExistentes
};