const express = require('express');
const router = express.Router();
const citaModel = require('../models/citaModel');

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

    const mensaje = citas.map(cita => {
      const hora = new Date(cita.fecha_hora).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${cita.nombre_paciente} tiene cita para ${cita.tratamiento} a las ${hora}`;
    }).join('. ');

    res.json({ response: mensaje });

  } catch (error) {
    console.error('❌ Error en Alexa:', error);
    res.status(500).json({ response: 'Ocurrió un error al consultar las citas.' });
  }
});

module.exports = router;
