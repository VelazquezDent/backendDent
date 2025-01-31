const tratamientoModel = require('../models/tratamientoModel');
const {
    validarCampoNoVacio,
    validarDuracion,
    validarPrecio,
    validarCitasRequeridas
} = require('../utils/validations');
const cloudinary = require('../utils/cloudinaryConfig');

const crearTratamiento = async (req, res) => {
    try {
        const { nombre, descripcion, duracion_minutos, precio, tipo_citas, citas_requeridas } = req.body;

        // Validaciones de los campos
        const errores = [];

        const errorNombre = validarCampoNoVacio(nombre, "Nombre");
        if (errorNombre) errores.push(errorNombre);

        const errorDescripcion = validarCampoNoVacio(descripcion, "Descripción");
        if (errorDescripcion) errores.push(errorDescripcion);

        const errorDuracion = validarDuracion(duracion_minutos);
        if (errorDuracion) errores.push(errorDuracion);

        if (tipo_citas !== 'requiere_evaluacion') {
            const errorPrecio = validarPrecio(precio);
            if (errorPrecio) errores.push(errorPrecio);

            const errorCitasRequeridas = validarCitasRequeridas(citas_requeridas);
            if (errorCitasRequeridas) errores.push(errorCitasRequeridas);
        }

        if (errores.length > 0) {
            return res.status(400).json({ errores });
        }

        // Subida de imagen (si existe)
        let imagen_url = '';
        if (req.file) {
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
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
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
