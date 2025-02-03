const db = require('../db');
const bcrypt = require('bcrypt');


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
// Función para guardar el token de recuperación de contraseña
const guardarTokenRecuperacion = async (usuario_id, token, expiracion) => {
    await db.query(
        `INSERT INTO tokens_recuperacion (usuario_id, token, expiracion, usado, fecha_creacion) 
         VALUES (?, ?, ?, 0, NOW())`,
        [usuario_id, token, expiracion]
    );
};

// Función para obtener un token de recuperación
const obtenerTokenRecuperacion = async (token) => {
    const [tokens] = await db.query(
        `SELECT * FROM tokens_recuperacion WHERE token = ? AND usado = 0`,
        [token]
    );
    return tokens.length > 0 ? tokens[0] : null;
};

// Función para actualizar la contraseña del usuario
const actualizarPassword = async (usuario_id, hashedPassword) => {
    await db.query(
        `UPDATE usuarios SET password = ? WHERE id = ?`,
        [hashedPassword, usuario_id]
    );
};

// Función para marcar un token como usado
const marcarTokenUsado = async (token) => {
    await db.query(
        `UPDATE tokens_recuperacion SET usado = 1 WHERE token = ?`,
        [token]
    );
};
// Obtener el historial de contraseñas de un usuario
const obtenerHistorialContrasenas = async (usuario_id) => {
    const [historial] = await db.query(
        `SELECT password FROM historial_contraseñas WHERE usuario_id = ?`,
        [usuario_id]
    );
    return historial;
};

// Verificar si una contraseña ya ha sido utilizada en el historial del usuario
const verificarPasswordEnHistorial = async (usuario_id, nuevaPassword) => {
    const historial = await obtenerHistorialContrasenas(usuario_id);

    for (let entry of historial) {
        const esIgual = await bcrypt.compare(nuevaPassword, entry.password);
        if (esIgual) {
            return true; // Contraseña ya utilizada
        }
    }
    return false; // Contraseña no encontrada en el historial
};



module.exports = {
    crearUsuario,
    guardarHistorialContrasena,
    obtenerUsuarioPorCodigo,
    marcarUsuarioVerificado,
    obtenerUsuarioPorEmail,
    guardarTokenRecuperacion,
    obtenerTokenRecuperacion,
    marcarTokenUsado,
    verificarPasswordEnHistorial,
    obtenerHistorialContrasenas,
    actualizarPassword
};