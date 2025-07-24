const express = require('express');
const router = express.Router();
const citaModel = require('../models/citaModel');
const userModel = require('../models/usuarioModel');
const codigoSesionModel = require('../models/codigoSesionModel');

const { validarCorreo } = require('../utils/validations');
const bcrypt = require('bcrypt');

// Endpoint existente para obtener citas
router.post('/proximas-citas', async (req, res) => {
  try {
    const fecha = req.body?.fecha;

    if (!fecha) {
      return res.json({ response: 'No entendí la fecha solicitada.' });
    }

    const citas = await citaModel.obtenerCitasPorFecha(fecha);

    if (!citas || citas.length === 0) {
      return res.json({ response: `No hay citas para el ${fecha}.` });
    }

    const cantidad = citas.length;
    const encabezado = cantidad === 1
      ? `Tienes una cita para el ${fecha}. `
      : `Tienes ${cantidad} citas para el ${fecha}. `;

    const detalles = citas.map(cita => {
      const hora = new Date(cita.fecha_hora).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const nombreCompleto = `${cita.nombre_paciente} ${cita.apellido_paterno} ${cita.apellido_materno}`.trim();
      return `${nombreCompleto} tiene cita para ${cita.tratamiento} a las ${hora}`;
    }).join('. ');

    const mensaje = encabezado + detalles + '.';

    res.json({ response: mensaje });

  } catch (error) {
    console.error('❌ Error en Alexa:', error);
    res.status(500).json({ response: 'Ocurrió un error al consultar las citas.' });
  }
});

// Nuevo endpoint para login de Alexa
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones de datos
    const errores = [];

    const errorCorreo = validarCorreo(email);
    if (errorCorreo) errores.push(errorCorreo);

    if (!password || !password.trim()) {
      errores.push("La contraseña no puede estar vacía.");
    }

    if (errores.length > 0) {
      return res.status(400).json({ success: false, mensaje: errores.join(' ') });
    }

    // Buscar al usuario en la base de datos
    const usuario = await userModel.obtenerUsuarioPorEmail(email);

    // Verificar si el usuario no existe o no está verificado
    if (!usuario || usuario.verificado !== 1) {
      return res.status(401).json({ success: false, mensaje: 'Usuario no verificado o inexistente.' });
    }

    // Comparar la contraseña ingresada con la almacenada
    const esValida = await bcrypt.compare(password, usuario.password);

    if (!esValida) {
      return res.status(401).json({ success: false, mensaje: 'Correo o contraseña incorrectos.' });
    }

    // Verificar si el usuario es administrador
    if (usuario.tipo !== 'admin') {
      return res.status(403).json({ success: false, mensaje: 'Solo los administradores pueden acceder.' });
    }

    // Respuesta exitosa
    res.status(200).json({ success: true, mensaje: 'Inicio de sesión exitoso.', tipo: usuario.tipo });

  } catch (error) {
    console.error('Error al autenticar usuario en Alexa:', error);
    res.status(500).json({ success: false, mensaje: 'Error interno del servidor.' });
  }
});

router.post('/login-codigo', async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo || !codigo.trim()) {
      return res.status(400).json({ success: false, mensaje: 'El código es obligatorio.' });
    }

    const existe = await codigoSesionModel.existeCodigo(codigo.trim());

    if (!existe) {
      return res.status(401).json({ success: false, mensaje: 'Código inválido o no autorizado.' });
    }

    res.status(200).json({ success: true, mensaje: 'Acceso autorizado con código.' });

  } catch (error) {
    console.error('Error en login con código:', error);
    res.status(500).json({ success: false, mensaje: 'Error interno del servidor.' });
  }
});


module.exports = router;