const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

const authMovil = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ mensaje: 'Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1]; // formato: Bearer TOKEN
    if (!token) {
        return res.status(401).json({ mensaje: 'Token inválido.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.tipo !== 'paciente') {
            return res.status(403).json({ mensaje: 'Solo pacientes pueden acceder a esta API.' });
        }
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ mensaje: 'Token inválido o expirado.' });
    }
};

module.exports = authMovil;
