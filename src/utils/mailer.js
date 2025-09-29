const nodemailer = require('nodemailer'); 
require('dotenv').config();

/* 
   ⚠️ NOTA:
   Ya no necesitas usar esta parte porque Render no puede conectarse a Hostinger SMTP.
   La dejamos comentada por si en un futuro lo quieres usar localmente.
*/

// Configuración de transporte SMTP para Hostinger usando variables de entorno
/*
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
*/

// Función original de enviar correos (con Hostinger) 
/*
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
*/

/* 
   ✅ NUEVO: usar el servicio en Vercel.
   Con esto tu backend en Render le manda la petición al endpoint
   https://emailvercel-xxxx.vercel.app/api/send-email
*/
const axios = require("axios");

const enviarCorreo = async (destinatario, asunto, mensaje) => {
    try {
        const response = await axios.post(
            "https://emailvercel-csru9kw24-velazquezdents-projects.vercel.app/api/send-email",
            {
                to: destinatario,
                subject: asunto,
                html: mensaje,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Api-Key": process.env.EMAIL_API_SECRET, // tu clave de seguridad
                },
            }
        );

        console.log("Correo enviado vía Vercel:", response.data);
    } catch (error) {
        console.error("Error al enviar correo vía Vercel:", error.response?.data || error.message);
    }
};

module.exports = { enviarCorreo };
