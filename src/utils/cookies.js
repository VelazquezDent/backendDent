const jwt = require('jsonwebtoken');
require('dotenv').config();

// Llave secreta del token
const JWT_SECRET = process.env.JWT_SECRET;

// Configuración común para las cookies
const cookieOptions = {
    httpOnly: true,  // La cookie solo se puede acceder desde el servidor
    secure: 'production',    // Solo se envía en HTTPS
    sameSite: 'None', // Permitir compartir entre distintos dominios
    path: '/',
};

// **Función para generar y establecer la cookie de sesión**
const establecerCookieSesion = (res, usuario) => {
    const token = jwt.sign(
        { id: usuario.id, tipo: usuario.tipo },
        JWT_SECRET,
        { expiresIn: '24h' }  // Token expira en 24 horas
    );

    // Establecer la cookie con expiración de 24 horas
    res.cookie('sessionToken', token, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000,  // 24 horas en milisegundos
    });

    console.log('[COOKIE LOG] Cookie creada con duración de 24 horas.');
};

// **Función para eliminar la cookie de sesión**
const eliminarCookieSesion = (res) => {
    res.cookie('sessionToken', '', {
        ...cookieOptions,
        expires: new Date(0),  // Fecha de expiración en el pasado para eliminar la cookie
    });

    console.log('[COOKIE LOG] Cookie eliminada.');
};

// **Función para verificar el token de la cookie**
const verificarCookieSesion = (req) => {
    const token = req.cookies.sessionToken;
    if (!token) {
        console.log('[COOKIE LOG] No se encontró token en la cookie.');
        throw new Error('No estás autenticado');
    }

    console.log('[COOKIE LOG] Verificando token de sesión.');
    return jwt.verify(token, JWT_SECRET);  // Verifica y decodifica el token
};

module.exports = {
    establecerCookieSesion,
    eliminarCookieSesion,
    verificarCookieSesion,
};
