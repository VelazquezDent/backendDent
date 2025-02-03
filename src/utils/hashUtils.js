const crypto = require('crypto');

// Clave secreta utilizada para el hash. Cámbiala por una clave única y segura.
const secretKey = process.env.HASH_SECRET || 'Scr3tK3y'; 

// Función para generar el hash del ID
const generarHash = (id) => {
    return crypto.createHmac('sha256', secretKey).update(String(id)).digest('hex');
};

// Función para verificar el hash
const verificarHash = (id, hash) => {
    const hashCalculado = generarHash(id);
    return hash === hashCalculado;
};

module.exports = { generarHash, verificarHash };
