const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

const autenticarUsuario = (tiposPermitidos = []) => {
    return (req, res, next) => {
        const token = req.cookies.sessionToken;

        if (!token) {
            return res.status(401).json({ mensaje: 'No estás autenticado.' });
        }

        try {
            const usuario = jwt.verify(token, JWT_SECRET);

            // Validar el tipo de usuario
            if (tiposPermitidos.length > 0 && !tiposPermitidos.includes(usuario.tipo)) {
                return res.status(403).json({ mensaje: 'No tienes permisos para acceder a esta ruta.' });
            }

            req.usuario = usuario; // Adjunta el usuario al request
            next();
        } catch (error) {
            return res.status(403).json({ mensaje: 'Token inválido o expirado.' });
        }
    };
};

module.exports = autenticarUsuario;
