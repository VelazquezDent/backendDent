const db = require('../db');

exports.obtener = async () => {
  const query = `SELECT * FROM configuraciones LIMIT 1`;
  const [rows] = await db.execute(query);
  return rows[0];
};

exports.actualizar = async (max_intentos, tiempo_bloqueo) => {
  const query = `UPDATE configuraciones SET max_intentos = ?, tiempo_bloqueo = ? WHERE id = 1`;
  const [result] = await db.execute(query, [max_intentos, tiempo_bloqueo]);
  return result.affectedRows > 0;
};
