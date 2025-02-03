const db = require('../db');
const { generarHash,verificarHash  } = require('../../src/utils/hashUtils');


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
const actualizarTratamiento = async (id, camposActualizados) => {
    const campos = Object.keys(camposActualizados)
        .map((campo) => `${campo} = ?`)
        .join(", ");
    const valores = Object.values(camposActualizados);

    await db.query(`UPDATE tratamientos SET ${campos} WHERE id = ?`, [...valores, id]);
};
const buscarTratamientos = async (search) => {
    const [resultados] = await db.query(
      `SELECT id, nombre FROM tratamientos WHERE nombre LIKE ?`,
      [`%${search}%`]
    );
  
    // Añadir el hash a cada resultado
    return resultados.map((resultado) => ({
      ...resultado,
      hash: generarHash(resultado.id),
    }));
  };
  const obtenerTratamientoPorHash = async (hash) => {
    const [resultados] = await db.query(`SELECT * FROM tratamientos`);

    // Comparar el hash con cada tratamiento
    const tratamiento = resultados.find((trat) => verificarHash(trat.id, hash));
    return tratamiento || null;
};

module.exports = { 
    
    crearTratamiento, 
    obtenerTratamientos, 
    actualizarEstadoTratamiento, 
    actualizarTratamiento,
    buscarTratamientos, 
    obtenerTratamientoPorHash
};
