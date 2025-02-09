const tratamientoModel = require('../models/tratamientoModel');
const {
    validarCampoNoVacio,
    validarDuracion,
    validarPrecio,
    validarCitasRequeridas
} = require('../utils/validations');
const cloudinary = require('../utils/cloudinaryConfig');
const { verificarHash } = require('../../src/utils/hashUtils');
const { subirImagen } = require('../utils/fileUploadConfig');


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
            // Validar formato de la imagen
            const allowedMimeTypes = ['image/jpeg', 'image/png'];
            if (!allowedMimeTypes.includes(req.file.mimetype)) {
                return res.status(400).json({ error: 'Formato de imagen no permitido. Solo se aceptan JPEG y PNG.' });
            }

            // Subir imagen a Hostinger
            imagen_url = await subirImagen(req.file.path);
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
const actualizarTratamiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion, duracion_minutos, precio, citas_requeridas } = req.body;

        const camposActualizados = { descripcion, duracion_minutos };
        if (precio !== undefined) camposActualizados.precio = precio;
        if (citas_requeridas !== undefined) camposActualizados.citas_requeridas = citas_requeridas;

        await tratamientoModel.actualizarTratamiento(id, camposActualizados);

        res.status(200).json({ mensaje: "Tratamiento actualizado con éxito." });
    } catch (error) {
        console.error("Error al actualizar tratamiento:", error);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
};
const buscarTratamientos = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search) {
      return res.status(400).json({ mensaje: 'El término de búsqueda está vacío.' });
    }

    const resultados = await tratamientoModel.buscarTratamientos(search);

    res.status(200).json(resultados);
  } catch (error) {
    console.error('Error en la búsqueda de tratamientos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};
const obtenerTratamientoPorHash = async (req, res) => {
    try {
        const { hash } = req.params;

        // Obtener todos los tratamientos y buscar el que coincida con el hash
        const tratamiento = await tratamientoModel.obtenerTratamientoPorHash(hash);

        if (!tratamiento) {
            return res.status(404).json({ mensaje: 'Tratamiento no encontrado.' });
        }

        res.status(200).json(tratamiento);
    } catch (error) {
        console.error('Error al obtener tratamiento por hash:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};


module.exports = { 

    crearTratamiento, 
    obtenerTratamientos, 
    actualizarEstadoTratamiento, 
    actualizarTratamiento, 
    buscarTratamientos,
    obtenerTratamientoPorHash 
};
