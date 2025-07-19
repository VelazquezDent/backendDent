const db = require('../db');


const obtenerValores = async () => {
  const [rows] = await db.query('SELECT * FROM valores ORDER BY fecha_creacion DESC');
  return rows;
};

const crearValor = async (valor, descripcion) => {
  const [result] = await db.query(
    'INSERT INTO valores (valor, descripcion) VALUES (?, ?)',
    [valor, descripcion]
  );
  return result;
};

const actualizarValor = async (id, valor, descripcion) => {
  const [result] = await db.query(
    'UPDATE valores SET valor = ?, descripcion = ? WHERE id = ?',
    [valor, descripcion, id]
  );
  return result;
};

const eliminarValor = async (id) => {
  const [result] = await db.query('DELETE FROM valores WHERE id = ?', [id]);
  return result;
};

module.exports = {
  obtenerValores,
  crearValor,
  actualizarValor,
  eliminarValor,
};
