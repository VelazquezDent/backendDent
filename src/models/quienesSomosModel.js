const db = require('../db');

exports.insertar = async (contenido) => {
  const query = `INSERT INTO quienes_somos (contenido) VALUES (?)`;
  const [result] = await db.execute(query, [contenido]);
  return result.insertId;
};

exports.obtenerTodo = async () => {
  const query = `SELECT * FROM quienes_somos ORDER BY fecha_creacion DESC`;
  const [rows] = await db.execute(query);
  return rows;
};

exports.editarPorId = async (id, contenido) => {
  const query = `UPDATE quienes_somos SET contenido = ? WHERE id = ?`;
  const [result] = await db.execute(query, [contenido, id]);
  return result.affectedRows > 0;
};
