const db = require('../db');

exports.insertar = async (titulo, descripcion) => {
  const query = `INSERT INTO politicas (titulo, descripcion) VALUES (?, ?)`;
  const [result] = await db.execute(query, [titulo, descripcion]);
  return result.insertId;
};

exports.obtenerTodas = async () => {
  const query = `SELECT * FROM politicas ORDER BY fecha_creacion DESC`;
  const [rows] = await db.execute(query);
  return rows;
};

exports.editarPorId = async (id, titulo, descripcion) => {
  const query = `UPDATE politicas SET titulo = ?, descripcion = ? WHERE id = ?`;
  const [result] = await db.execute(query, [titulo, descripcion, id]);
  return result.affectedRows > 0;
};

exports.eliminarPorId = async (id) => {
  const query = `DELETE FROM politicas WHERE id = ?`;
  const [result] = await db.execute(query, [id]);
  return result.affectedRows > 0;
};
