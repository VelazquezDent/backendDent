const tratamientoModel = require('../models/tratamientoModel');
const cloudinary = require('../utils/cloudinaryConfig');

const crearTratamiento = async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);

        const { nombre, descripcion, duracion_minutos, precio, tipo_citas, citas_requeridas } = req.body;
        let imagen_url = '';

        if (req.file) {
            console.log('Subiendo imagen a Cloudinary...');
            const resultado = await cloudinary.uploader.upload(req.file.path, { folder: 'tratamientos' });
            imagen_url = resultado.secure_url;
        }

        const requiere_evaluacion = tipo_citas === 'requiere_evaluacion' ? 1 : 0;

        const tratamiento_id = await tratamientoModel.crearTratamiento({
            nombre,
            descripcion,
            duracion_minutos,
            precio: requiere_evaluacion ? 0 : precio,
            citas_requeridas: requiere_evaluacion ? null : citas_requeridas,
            requiere_evaluacion,
            imagen_url,
            estado: false,
        });

        res.status(201).json({ mensaje: 'Tratamiento registrado con éxito.', id: tratamiento_id });
    } catch (error) {
        console.error('Error al registrar tratamiento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const obtenerTratamientos = async (req, res) => {
    try {
        const tratamientos = await tratamientoModel.obtenerTratamientos();
        res.status(200).json(tratamientos);
    } catch (error) {
        console.error('Error al obtener tratamientos:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const actualizarEstadoTratamiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        await tratamientoModel.actualizarEstadoTratamiento(id, estado);

        res.status(200).json({ mensaje: 'Estado del tratamiento actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar estado del tratamiento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};
module.exports = { crearTratamiento, obtenerTratamientos,actualizarEstadoTratamiento };
