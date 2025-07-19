const Valores = require('../models/valoresModel');

const getValores = async (req, res) => {
  try {
    const valores = await Valores.obtenerValores();
    res.json(valores);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los valores' });
  }
};

const postValor = async (req, res) => {
  const { valor, descripcion } = req.body;
  try {
    const resultado = await Valores.crearValor(valor, descripcion);
    res.status(201).json({ id: resultado.insertId, valor, descripcion });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el valor' });
  }
};

const putValor = async (req, res) => {
  const { id } = req.params;
  const { valor, descripcion } = req.body;
  try {
    await Valores.actualizarValor(id, valor, descripcion);
    res.json({ mensaje: 'Valor actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el valor' });
  }
};

const deleteValor = async (req, res) => {
  const { id } = req.params;
  try {
    await Valores.eliminarValor(id);
    res.json({ mensaje: 'Valor eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el valor' });
  }
};

module.exports = {
  getValores,
  postValor,
  putValor,
  deleteValor,
};
