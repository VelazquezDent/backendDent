const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración de transporte SMTP para Hostinger usando variables de entorno
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),   // Convierte el puerto a número
    secure: process.env.SMTP_SECURE === 'true',  // Convierte el valor de secure a booleano
    auth: {
        user: process.env.SMTP_USER,  // Correo desde el .env
        pass: process.env.SMTP_PASS,  // Contraseña desde el .env
    },
});

// Función para enviar correos
const enviarCorreo = async (destinatario, asunto, mensaje) => {
    try {
        const info = await transporter.sendMail({
            from: `"Consultorio Dental" <${process.env.SMTP_USER}>`,
            to: destinatario,
            subject: asunto,
            html: mensaje,
        });

        console.log('Correo enviado:', info.messageId);
    } catch (error) {
        console.error('Error al enviar correo:', error);
    }
};

module.exports = { enviarCorreo };
