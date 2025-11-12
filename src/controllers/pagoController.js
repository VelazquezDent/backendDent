const pagoModel = require('../models/pagoModel');
require('dotenv').config();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // desde .env

exports.crearCheckoutStripe = async (req, res) => {
  try {
    const { pagos } = req.body;

    if (!pagos || pagos.length === 0) {
      return res.status(400).json({ mensaje: "Pagos inválidos." });
    }

    const line_items = pagos.map(p => ({
      price_data: {
        currency: 'mxn',
        product_data: {
          name: `Pago ID ${p.id}`
        },
        unit_amount: Math.round(p.monto * 100)
      },
      quantity: 1
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `https://consultoriovelazquezmcd.com/pagos-exito?ids=${pagos.map(p => p.id).join(",")}`,
      cancel_url: 'https://consultoriovelazquezmcd.com/pagos-cancelado',
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Error al crear sesión de Stripe:", error);
    res.status(500).json({ mensaje: "Error al iniciar pago con Stripe" });
  }
};
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
exports.obtenerPacientesConTratamientoActivo = async (req, res) => {
  try {
    const datos = await pagoModel.obtenerPacientesConTratamientoActivo();

    const pacientes = datos.map((paciente) => ({
      tratamiento_paciente_id: paciente.tratamiento_paciente_id,
      tipo_paciente: paciente.tipo_paciente,
      paciente_id: paciente.usuario_id || paciente.paciente_id,
      nombre_completo: `${paciente.nombre} ${paciente.apellido_paterno} ${paciente.apellido_materno}`
    }));

    res.status(200).json(pacientes);
  } catch (error) {
    console.error('Error al obtener pacientes con tratamiento activo:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};
exports.actualizarPagosYMarcarCitas = async (req, res) => {
  const connection = await require('../db').getConnection();
  try {
    const { ids, metodo, fecha_pago } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ mensaje: 'IDs de pagos no válidos.' });
    }

    if (!metodo || !fecha_pago) {
      return res.status(400).json({ mensaje: 'Faltan campos requeridos: método o fecha de pago.' });
    }

    await connection.beginTransaction();

    const resultado = await pagoModel.actualizarPagosYMarcarCitas(
      ids, metodo, fecha_pago, connection
    );

    await connection.commit();
    res.status(200).json({ mensaje: 'Pagos y citas actualizados correctamente.', resultado });
  } catch (error) {
    await connection.rollback();
    console.error(' Error al actualizar pagos y citas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
};
exports.obtenerHistorialPagosAdmin = async (req, res) => {
  try {
    const historial = await pagoModel.obtenerHistorialPagos();
    res.status(200).json(historial);
  } catch (error) {
    console.error('Error al obtener historial de pagos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};
exports.obtenerHistorialPagos = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (!usuarioId) {
      return res.status(400).json({ mensaje: 'Falta el ID del usuario' });
    }

    const historial = await pagoModel.obtenerHistorialPagosPorUsuario(usuarioId);
    res.status(200).json(historial);
  } catch (error) {
    console.error('Error al obtener historial de pagos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
};
exports.pagarPagosPorIds = async (req, res) => {
  const connection = await require('../db').getConnection();
  try {
    const { pagosIds } = req.body;

    if (!pagosIds || !Array.isArray(pagosIds) || pagosIds.length === 0) {
      return res.status(400).json({ mensaje: 'No se recibieron pagos válidos para procesar.' });
    }

    // Verificar el estado de la sesión de Stripe (opcional, si usas session_id)
    const sessionId = req.query.session_id; // Obtener session_id de la URL si está presente
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ mensaje: 'El pago no se completó en Stripe.' });
      }
    }

    await connection.beginTransaction();

    const resultado = await pagoModel.pagarPagosPorIds(pagosIds, connection);

    if (resultado.pagos.length === 0) {
      await connection.rollback();
      return res.status(404).json({ mensaje: 'No hay pagos pendientes con esos IDs.' });
    }

    await connection.commit();

    res.status(200).json({
      mensaje: `Pagos seleccionados procesados correctamente.`,
      totalPagado: resultado.pagos.length,
      fechaPago: resultado.fecha,
      pagosIds: resultado.pagos,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al pagar pagos por IDs:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
};
exports.confirmarPagoMovil = async (req, res) => {
  const connection = await require('../db').getConnection();

  try {
    const { pagosIds, sessionId } = req.body;

    if (!pagosIds || !Array.isArray(pagosIds) || pagosIds.length === 0) {
      return res.status(400).json({ mensaje: 'No se recibieron pagos válidos para procesar.' });
    }

    if (!sessionId) {
      return res.status(400).json({ mensaje: 'Falta el sessionId de Stripe.' });
    }

    //  Verificar en Stripe que la sesión está pagada
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ mensaje: 'El pago no está marcado como pagado en Stripe.' });
    }

    await connection.beginTransaction();

    //  Reutilizamos tu lógica de modelo
    const resultado = await pagoModel.pagarPagosPorIds(pagosIds, connection);

    if (resultado.pagos.length === 0) {
      await connection.rollback();
      return res.status(404).json({ mensaje: 'No hay pagos pendientes con esos IDs.' });
    }

    await connection.commit();

    return res.status(200).json({
      mensaje: 'Pagos móviles confirmados correctamente.',
      totalPagado: resultado.pagos.length,
      fechaPago: resultado.fecha,
      pagosIds: resultado.pagos,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al confirmar pagos móviles:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor al confirmar pagos móviles.' });
  } finally {
    connection.release();
  }
};
