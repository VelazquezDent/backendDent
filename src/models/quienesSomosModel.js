const db = require('../db');

exports.insertar = async (contenido) => {
  // Desactivar todos los anteriores
  await db.execute(`UPDATE quienes_somos SET vigente = 0`);
  const query = `INSERT INTO quienes_somos (contenido, vigente) VALUES (?, 1)`;
  const [result] = await db.execute(query, [contenido]);
  return result.insertId;
};

exports.obtenerTodo = async () => {
  const query = `SELECT * FROM quienes_somos ORDER BY fecha_creacion DESC`;
  const [rows] = await db.execute(query);
  return rows;
};

exports.obtenerVigente = async () => {
  const query = `SELECT * FROM quienes_somos WHERE vigente = 1 ORDER BY fecha_creacion DESC LIMIT 1`;
  const [rows] = await db.execute(query);
  return rows[0];
};

exports.editarPorId = async (id, contenido) => {
  const query = `UPDATE quienes_somos SET contenido = ? WHERE id = ?`;
  const [result] = await db.execute(query, [contenido, id]);
  return result.affectedRows > 0;
};

exports.activarComoVigente = async (id) => {
  await db.execute(`UPDATE quienes_somos SET vigente = 0`);
  const [result] = await db.execute(`UPDATE quienes_somos SET vigente = 1 WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};
