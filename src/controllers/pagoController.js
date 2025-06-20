const pagoModel = require('../models/pagoModel');

exports.crearPagos = async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);

        const { usuarioId, pacienteId, citas, precio, metodo } = req.body;

        if (!citas || citas.length === 0) {
            return res.status(400).json({ mensaje: 'No se recibieron citas para crear los pagos' });
        }

        const pagos = citas.map(cita => [
            usuarioId,
            pacienteId || null,
            cita.id,
            precio,
            metodo || null,
            'pendiente',
            null
        ]);

        await pagoModel.crearPagos(pagos);

        res.status(201).json({ mensaje: 'Pagos creados exitosamente' });
    } catch (error) {
        console.error('Error al crear los pagos:', error);
        res.status(500).json({ mensaje: 'Error al crear los pagos' });
    }
};
exports.obtenerPagosPendientes = async (req, res) => {
    const connection = await require('../db').getConnection();
    try {
        const { usuarioId } = req.params;

        if (!usuarioId) {
            return res.status(400).json({ mensaje: 'Falta el ID del usuario' });
        }

        const pagosPendientes = await pagoModel.obtenerPagosPendientesPorUsuario(usuarioId, connection);
        res.json(pagosPendientes);
    } catch (error) {
        console.error('Error al obtener pagos pendientes:', error);
        res.status(500).json({ mensaje: 'Error al obtener los pagos pendientes' });
    } finally {
        connection.release();
    }
};


