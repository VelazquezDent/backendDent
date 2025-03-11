const db = require('../db');

// Función para crear un paciente sin plataforma
const crearPacienteSinPlataforma = async (pacienteData) => {
    const { nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email } = pacienteData;

    const [result] = await db.query(
        `INSERT INTO pacientes_sin_plataforma (nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, fecha_creacion) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email]
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
// ✅ **Modificamos esta función para filtrar por email o teléfono**
const obtenerPacienteSinPlataformaExistentes = async (email, telefono) => {
    const [pacientes] = await db.query(
        `SELECT * FROM pacientes_sin_plataforma WHERE email = ? OR telefono = ?`,
        [email, telefono]
    );
    return pacientes.length > 0 ? pacientes[0] : null; // Si hay resultados, retorna el primer paciente
};
module.exports = {
    crearPacienteSinPlataforma,
    obtenerPacienteSinPlataforma,
    obtenerPacienteSinPlataformaExistentes
};
