const db = require('../db');

const crearTratamiento = async (tratamientoData) => {
    const { nombre, descripcion, duracion_minutos, precio, citas_requeridas, requiere_evaluacion, imagen_url, estado } = tratamientoData;

    const [result] = await db.query(
        `INSERT INTO tratamientos (nombre, descripcion, duracion_minutos, precio, citas_requeridas, requiere_evaluacion, imagen, estado) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [nombre, descripcion, duracion_minutos, precio, citas_requeridas, requiere_evaluacion, imagen_url, estado]
    );

    return result.insertId;
};

const obtenerTratamientos = async () => {
    const [tratamientos] = await db.query(`SELECT * FROM tratamientos`);
    return tratamientos;
};

const actualizarEstadoTratamiento = async (id, estado) => {
    await db.query(`UPDATE tratamientos SET estado = ? WHERE id = ?`, [estado, id]);
};

module.exports = { crearTratamiento, obtenerTratamientos, actualizarEstadoTratamiento };
