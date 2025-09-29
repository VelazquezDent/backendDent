const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración de transporte SMTP para Hostinger usando variables de entorno
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false, // 🔹 evitar problemas de certificado en Render
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
