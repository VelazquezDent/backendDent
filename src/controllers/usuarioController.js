const userModel = require('../models/usuarioModel');
const {
    validarFortalezaContrasena,
    validarNombre,
    validarTelefono,
    validarEdad,
    validarCorreo
} = require('../utils/validations');
const { enviarCorreo } = require('../utils/mailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { establecerCookieSesion, eliminarCookieSesion } = require('../utils/cookies');

// Función para registrar un usuario
const registrarUsuario = async (req, res) => {
    try {
        const { nombre, apellido_paterno, apellido_materno, telefono, edad, sexo, email, password, repetir_password } = req.body;

        // Validaciones de datos
        const errores = [];

        const errorNombre = validarNombre(nombre);
        if (errorNombre) errores.push(errorNombre);

        const errorApellidoPaterno = validarNombre(apellido_paterno);
        if (errorApellidoPaterno) errores.push("Apellido paterno: " + errorApellidoPaterno);

        const errorTelefono = validarTelefono(telefono);
        if (errorTelefono) errores.push(errorTelefono);

        const errorEdad = validarEdad(edad);
        if (errorEdad) errores.push(errorEdad);

        const errorCorreo = validarCorreo(email);
        if (errorCorreo) errores.push(errorCorreo);

        const errorPassword = validarFortalezaContrasena(password);
        if (errorPassword) errores.push(errorPassword);

        if (password !== repetir_password) {
            errores.push("Las contraseñas no coinciden.");
        }

        // Si hay errores, retornar respuesta con los mensajes
        if (errores.length > 0) {
            return res.status(400).json({ errores });
        }
          // Verificar si el correo ya está registrado
          const usuarioExistentePorCorreo = await userModel.obtenerUsuarioPorEmail(email);
          if (usuarioExistentePorCorreo) {
              return res.status(409).json({ mensaje: 'El correo ya está registrado. Usa otro correo electrónico.' });
          }
  
          // Verificar si el teléfono ya está registrado
          const usuarioExistentePorTelefono = await userModel.obtenerUsuarioPorTelefono(telefono);
          if (usuarioExistentePorTelefono) {
              return res.status(409).json({ mensaje: 'El teléfono ya está registrado. Usa otro número de teléfono.' });
          }
  

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generar un código de verificación
        const codigo_verificacion = crypto.randomBytes(4).toString('hex');

        // Crear el usuario en la base de datos
        const usuario_id = await userModel.crearUsuario({
            nombre,
            apellido_paterno,
            apellido_materno,
            telefono,
            edad,
            sexo,
            email,
            hashedPassword,
            codigo_verificacion,
        });

        // Guardar la contraseña en el historial
        await userModel.guardarHistorialContrasena(usuario_id, hashedPassword);

        // Enviar el correo de verificación
        await enviarCorreo(
            email,
            'Verificación de cuenta - Consultorio Dental Velázquez',
            `
            <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #007bff; color: white; padding: 15px;">
                        <h1 style="margin: 0; font-size: 24px;">Consultorio Dental Velázquez</h1>
                        <p style="margin: 0; font-size: 16px;">¡Gracias por registrarte!</p>
                    </div>
                    <div style="padding: 20px; text-align: left;">
                        <p style="font-size: 16px; color: #333;">Hola,</p>
                        <p style="font-size: 16px; color: #333;">
                            Para completar tu registro, por favor verifica tu cuenta con el siguiente código:
                        </p>
                        <div style="margin: 20px 0; padding: 10px; background-color: #f0f8ff; border-left: 4px solid #007bff;">
                            <p style="font-size: 24px; font-weight: bold; color: #007bff; text-align: center;">${codigo_verificacion}</p>
                        </div>
                        <p style="font-size: 14px; color: #666;">
                            Este código es válido por 5 minutos. Si no solicitaste este correo, por favor ignóralo.
                        </p>
                    </div>
                    <div style="background-color: #f4f4f4; padding: 10px; text-align: center;">
                        <p style="font-size: 12px; color: #999;">
                            Consultorio Dental Velázquez<br>
                            <a href="https://consultoriovelasquezmcd.com" style="color: #007bff; text-decoration: none;">consultoriovelasquezmcd.com</a>
                        </p>
                    </div>
                </div>
            </div>
            `
        );

        res.status(201).json({ mensaje: 'Usuario registrado. Revisa tu correo para verificar tu cuenta.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'El correo ya está registrado. Por favor, usa otro.' });
        }

        console.error('Error al registrar usuario:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};
// Función para verificar el código de registro
const verificarCodigo = async (req, res) => {
    try {
        const { email, codigo } = req.body;

        // Log para verificar que los datos lleguen correctamente
        console.log('Datos recibidos en verificarCodigo:', email, codigo);

        // Buscar usuario con el email y el código
        const usuario = await userModel.obtenerUsuarioPorCodigo(email, codigo);

        // Log para verificar el resultado de la consulta
        console.log('Resultado de la consulta obtenerUsuarioPorCodigo:', usuario);

        if (!usuario) {
            return res.status(400).json({ mensaje: 'Código de verificación inválido o expirado.' });
        }

        await userModel.marcarUsuarioVerificado(email);

        res.status(200).json({ mensaje: 'Cuenta verificada con éxito.' });
    } catch (error) {
        console.error('Error al verificar el código:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};
// Función para manejar el login del usuario
const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones de datos
        const errores = [];

        const errorCorreo = validarCorreo(email);
        if (errorCorreo) errores.push(errorCorreo);

        if (!password || !password.trim()) {
            errores.push("La contraseña no puede estar vacía.");
        }

        if (errores.length > 0) {
            return res.status(400).json({ errores });
        }

        // Buscar al usuario en la base de datos
        const usuario = await userModel.obtenerUsuarioPorEmail(email);

        // Verificar si el usuario no existe o no está verificado
        if (!usuario || usuario.verificado !== 1) {
            return res.status(401).json({ mensaje: 'Usuario no verificado o inexistente.' });
        }

        // Comparar la contraseña ingresada con la almacenada
        const esValida = await bcrypt.compare(password, usuario.password);

        if (!esValida) {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
        }
        // Establecer la cookie de sesión
        establecerCookieSesion(res, usuario);
        // Enviar respuesta de éxito con un mensaje y el nombre del usuario
        res.status(200).json({ mensaje: 'Inicio de sesión exitoso.', nombre: usuario.nombre, tipo: usuario.tipo });
    } catch (error) {
        console.error('Error al autenticar usuario:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// Función para cerrar sesión
const logoutUsuario = (req, res) => {
    try {
        eliminarCookieSesion(res);
        res.status(200).json({ mensaje: 'Sesión cerrada correctamente.' });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};
// Función para enviar el correo de recuperación de contraseña
const enviarCorreoRecuperacion = async (req, res) => {
    try {
        const { email } = req.body;

        // Buscar el usuario por email
        const usuario = await userModel.obtenerUsuarioPorEmail(email);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        // Generar un token único y su expiración
        const token = crypto.randomBytes(32).toString('hex');
        const expiracion = new Date(Date.now() + 15 * 60 * 1000); // Expira en 15 minutos

        // Guardar el token en la base de datos
        await userModel.guardarTokenRecuperacion(usuario.id, token, expiracion);

        // Enviar el correo con el enlace de recuperación
        const enlaceRecuperacion = `http://localhost:5173/cambiar-password?token=${token}`;
        await enviarCorreo(
            email,
            'Recuperación de contraseña',
            `
            <p>Hola ${usuario.nombre},</p>
            <p>Haz solicitado recuperar tu contraseña. Haz clic en el siguiente enlace para cambiarla:</p>
            <a href="${enlaceRecuperacion}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Cambiar contraseña</a>
            <p>Este enlace es válido por 15 minutos.</p>
            `
        );

        res.status(200).json({ mensaje: 'Correo enviado con éxito.' });
    } catch (error) {
        console.error('Error al enviar el correo de recuperación:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

// Función para cambiar la contraseña con validación del historial
const cambiarPassword = async (req, res) => {
    try {
        const { token, nuevaPassword } = req.body;

        // Verificar si el token es válido
        const tokenData = await userModel.obtenerTokenRecuperacion(token);
        if (!tokenData || new Date() > new Date(tokenData.expiracion)) {
            return res.status(400).json({ mensaje: 'Token inválido o expirado.' });
        }

        // Verificar si la nueva contraseña ya fue utilizada en el historial
        const yaUsada = await userModel.verificarPasswordEnHistorial(tokenData.usuario_id, nuevaPassword);
        if (yaUsada) {
            return res.status(409).json({ mensaje: 'Esta contraseña ya ha sido utilizada anteriormente.' });
        }

        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

        // Actualizar la contraseña del usuario
        await userModel.actualizarPassword(tokenData.usuario_id, hashedPassword);

        // Marcar el token como usado
        await userModel.marcarTokenUsado(token);

        // Guardar la nueva contraseña en el historial
        await userModel.guardarHistorialContrasena(tokenData.usuario_id, hashedPassword);

        res.status(200).json({ mensaje: 'Contraseña actualizada con éxito.' });
    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};
const verificarSesion = (req, res) => {
    try {
        // `req.usuario` contiene los datos del usuario autenticado gracias al middleware
        res.status(200).json({ usuario: req.usuario });
    } catch (error) {
        console.error('Error al verificar la sesión:', error);
        res.status(500).json({ mensaje: 'Error al verificar la sesión.' });
    }
};
module.exports = { registrarUsuario, verificarCodigo, loginUsuario, enviarCorreoRecuperacion, cambiarPassword,logoutUsuario,verificarSesion };
