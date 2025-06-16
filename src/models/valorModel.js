const db = require('../db');

exports.insertar = async (valor, descripcion) => {
  const query = `INSERT INTO valores (valor, descripcion) VALUES (?, ?)`;
  const [result] = await db.execute(query, [valor, descripcion]);
  return result.insertId;
};

exports.obtenerTodos = async () => {
  const query = `SELECT * FROM valores ORDER BY fecha_creacion DESC`;
  const [rows] = await db.execute(query);
  return rows;
};

exports.editarPorId = async (id, valor, descripcion) => {
  const query = `UPDATE valores SET valor = ?, descripcion = ? WHERE id = ?`;
  const [result] = await db.execute(query, [valor, descripcion, id]);
  return result.affectedRows > 0;
};
