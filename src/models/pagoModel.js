const db = require('../db');

exports.crearPagos = async (pagos) => {
    const query = `INSERT INTO pagos (usuario_id, paciente_id, cita_id, monto, metodo, estado, fecha_pago) VALUES ?`;
    await db.query(query, [pagos]);
};
