const reportesModel = require('../models/reportesModel');

exports.obtenerResumenCitas = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        const data = await reportesModel.obtenerResumenCitas(desde, hasta);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error en resumen de citas:', error);
        res.status(500).json({ mensaje: 'Error al obtener resumen de citas' });
    }
};

exports.obtenerIngresosMensuales = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        const data = await reportesModel.obtenerIngresosMensuales(desde, hasta);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error en ingresos mensuales:', error);
        res.status(500).json({ mensaje: 'Error al obtener ingresos mensuales' });
    }
};

exports.obtenerTratamientosPopulares = async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        const data = await reportesModel.obtenerTratamientosPopulares(desde, hasta);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error en tratamientos populares:', error);
        res.status(500).json({ mensaje: 'Error al obtener tratamientos más solicitados' });
    }
};
