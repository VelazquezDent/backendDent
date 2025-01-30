const userModel = require('../models/usuarioModel');
const { enviarCorreo } = require('../utils/mailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Función para registrar un usuario
const registrarUsuario = async (req, res) => {
    try {
        const { nombre, apellido_paterno, apellido_materno, telefono, edad, sexo, email, password, repetir_password } = req.body;

        // Validar que las contraseñas coincidan
        if (password !== repetir_password) {
            return res.status(400).json({ mensaje: 'Las contraseñas no coinciden' });
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
        await userModel.guardarHistorialContraseña(usuario_id, hashedPassword);

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
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
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

        // Enviar respuesta de éxito con un mensaje y el nombre del usuario
        res.status(200).json({ mensaje: 'Inicio de sesión exitoso.', nombre: usuario.nombre });
    } catch (error) {
        console.error('Error al autenticar usuario:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};
module.exports = { registrarUsuario, verificarCodigo,loginUsuario };
