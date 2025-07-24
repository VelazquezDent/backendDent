const db = require('../db');

exports.existeCodigo = async (codigo) => {
  const query = 'SELECT * FROM codigo_sesion WHERE codigo = ?';
  const [rows] = await db.query(query, [codigo]);
  return rows.length > 0;
};
