const db = require('../db');
const bcrypt = require('bcrypt');


// Función para crear un usuario en la base de datos
const crearUsuario = async (usuarioData) => {
    const { nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, hashedPassword, codigo_verificacion } = usuarioData;

    const [result] = await db.query(
        `INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, password, tipo, verificado, codigo_verificacion, expiracion_codigo_verificacion) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paciente', 0, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
        [nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, hashedPassword, codigo_verificacion]
    );

    return result.insertId;
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


// Verificar si un usuario ya existe por teléfono
const obtenerUsuarioPorTelefono = async (telefono) => {
    const [result] = await db.query('SELECT * FROM usuarios WHERE telefono = ?', [telefono]);
    return result.length ? result[0] : null;
};


// Función para buscar un usuario en la tabla `usuarios`
const buscarEnUsuarios = async (nombre, apellido_paterno, apellido_materno, fecha_nacimiento, email, telefono) => {
    let query = `SELECT id, nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, 'usuario' AS tipo 
                 FROM usuarios 
                 WHERE nombre = ? AND apellido_paterno = ? AND apellido_materno = ? AND fecha_nacimiento = ?`;

    const params = [nombre, apellido_paterno, apellido_materno, fecha_nacimiento];

    if (email) {
        query += " AND email = ?";
        params.push(email);
    }
    if (telefono) {
        query += " AND telefono = ?";
        params.push(telefono);
    }

    const [result] = await db.query(query, params);
    return result;
};

// Función para buscar un usuario en la tabla `pacientes_sin_plataforma`
const buscarEnPacientesSinPlataforma = async (nombre, apellido_paterno, apellido_materno, fecha_nacimiento, email, telefono) => {
    let query = `SELECT id, nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, 'paciente_sin_plataforma' AS tipo 
                 FROM pacientes_sin_plataforma 
                 WHERE nombre = ? AND apellido_paterno = ? AND apellido_materno = ? AND fecha_nacimiento = ?`;

    const params = [nombre, apellido_paterno, apellido_materno, fecha_nacimiento];

    if (email) {
        query += " AND email = ?";
        params.push(email);
    }
    if (telefono) {
        query += " AND telefono = ?";
        params.push(telefono);
    }

    const [result] = await db.query(query, params);
    return result;
};

const obtenerTodosLosPacientes = async () => {
    const [pacientes] = await db.query(
        `SELECT id, nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, fecha_creacion 
         FROM usuarios 
         WHERE tipo = 'paciente'`
    );
    return pacientes;
};
const obtenerUsuarioPorId = async (id) => {
    const query = "SELECT id, nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, password FROM usuarios WHERE id = ?";
    const [result] = await db.execute(query, [id]);
    return result.length > 0 ? result[0] : null;
};
const obtenerDatosParaPrediccion = async () => {
    const [rows] = await db.query(`
   SELECT 
  u.id,
  CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS nombre_completo,
  TIMESTAMPDIFF(YEAR, u.fecha_nacimiento, CURDATE()) AS edad,
  tp.citas_totales,
  tp.citas_asistidas,
  (
    SELECT p.monto
    FROM pagos p
    WHERE p.usuario_id = u.id
    ORDER BY p.fecha_pago DESC
    LIMIT 1
  ) AS monto_ultimo_pago,
  t.nombre AS nombre_tratamiento,
  (
    SELECT c.fecha_hora
    FROM citas c
    WHERE c.tratamiento_paciente_id = tp.id AND c.estado = 'pendiente'
    ORDER BY c.fecha_hora ASC
    LIMIT 1
  ) AS proxima_cita
FROM usuarios u
JOIN tratamientos_pacientes tp ON tp.usuario_id = u.id
JOIN tratamientos t ON tp.tratamiento_id = t.id
WHERE u.tipo = 'paciente'

  `);

    return rows;
};
// Crear usuario a partir de login con Google
const crearUsuarioGoogle = async ({
    nombre,
    apellido_paterno,
    apellido_materno,
    email,
    hashedPassword
}) => {
    const [result] = await db.query(
        `INSERT INTO usuarios 
        (nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento, sexo, email, password, tipo, verificado, codigo_verificacion, expiracion_codigo_verificacion, intentos_fall, tiempo_bloqueo, bloqueado)
         VALUES (?, ?, ?, NULL, NULL, 'otro', ?, ?, 'paciente', 1, NULL, NULL, 0, NULL, 0)`,
        [nombre, apellido_paterno, apellido_materno, email, hashedPassword]
    );

    return result.insertId;
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
    actualizarPassword,
    obtenerUsuarioPorTelefono,
    buscarEnUsuarios,
    buscarEnPacientesSinPlataforma,
    obtenerTodosLosPacientes,
    obtenerUsuarioPorId,
    obtenerDatosParaPrediccion,
    crearUsuarioGoogle
};