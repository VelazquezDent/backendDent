const db = require('../db');

// Función para crear un usuario en la base de datos
const crearUsuario = async (usuarioData) => {
    const { nombre, apellido_paterno, apellido_materno, telefono, edad, sexo, email, hashedPassword, codigo_verificacion } = usuarioData;

    const [result] = await db.query(
        `INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, telefono, edad, sexo, email, password, tipo, verificado, codigo_verificacion, expiracion_codigo_verificacion) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paciente', 0, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
        [nombre, apellido_paterno, apellido_materno, telefono, edad, sexo, email, hashedPassword, codigo_verificacion]
    );

    return result.insertId;  // Devolver el ID del nuevo usuario
};

// Función para registrar la contraseña en el historial
const guardarHistorialContrasena = async (usuario_id, hashedPassword) => {
    await db.query(
        `INSERT INTO historial_contraseñas (usuario_id, password, fecha_creacion) VALUES (?, ?, NOW())`,
        [usuario_id, hashedPassword]
    );
};

// Función para buscar un usuario por email y código de verificación
const obtenerUsuarioPorCodigo = async (email, codigo) => {
    const [usuarios] = await db.query(
        `SELECT * FROM usuarios WHERE email = ? AND codigo_verificacion = ? AND expiracion_codigo_verificacion > NOW()`,
        [email, codigo]
    );
    return usuarios.length > 0 ? usuarios[0] : null;
};


// Función para marcar al usuario como verificado
const marcarUsuarioVerificado = async (email) => {
    await db.query(
        `UPDATE usuarios SET verificado = 1, codigo_verificacion = NULL, expiracion_codigo_verificacion = NULL WHERE email = ?`,
        [email]
    );
};
// Función para obtener un usuario por email
const obtenerUsuarioPorEmail = async (email) => {
    const [usuarios] = await db.query(
        `SELECT * FROM usuarios WHERE email = ?`,
        [email]
    );
    return usuarios.length > 0 ? usuarios[0] : null;
};

module.exports = {
    crearUsuario,
    guardarHistorialContrasena,
    obtenerUsuarioPorCodigo,
    marcarUsuarioVerificado,
    obtenerUsuarioPorEmail
};