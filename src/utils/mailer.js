const nodemailer = require('nodemailer');

// Configuración de transporte SMTP para Hostinger
const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 587,                // Usando SSL
    secure: false,             // true para SSL
    auth: {
        user: 'sistema@consultoriovelazquezmcd.com',  // Tu correo
        pass: 'Velazquezdental1212*'                 // Contraseña del correo
    }
});

// Función para enviar correos
const enviarCorreo = async (destinatario, asunto, mensaje) => {
    try {
        const info = await transporter.sendMail({
            from: '"Consultorio Dental" <sistema@consultoriovelazquezmcd.com>',
            to: destinatario,
            subject: asunto,
            html: mensaje
        });

        console.log('Correo enviado:', info.messageId);
    } catch (error) {
        console.error('Error al enviar correo:', error);
    }
};

module.exports = { enviarCorreo };
