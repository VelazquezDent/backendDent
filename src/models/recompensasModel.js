const db = require('../db');

// Catálogo público
exports.obtenerCatalogo = async () => {
  const [rows] = await db.execute(`
    SELECT 
      id,
      clave,
      nombre,
      descripcion,
      costo_puntos,
      stock
    FROM recompensas_catalogo
    WHERE activo = 1
      AND stock > 0
    ORDER BY costo_puntos ASC
  `);
  return rows;
};

// Recompensa individual
exports.obtenerRecompensaPorId = async (id, conn = db) => {
  const [rows] = await conn.execute(`
    SELECT id, nombre, costo_puntos, stock, activo
    FROM recompensas_catalogo
    WHERE id = ?
    LIMIT 1
  `, [id]);
  return rows.length ? rows[0] : null;
};

// ¿ya tiene un canje pendiente de esta recompensa?
exports.tieneCanjePendiente = async ({ usuarioId, recompensaId }, conn = db) => {
  const [rows] = await conn.execute(
    `
    SELECT id
    FROM recompensas_canje
    WHERE usuario_id = ?
      AND recompensa_id = ?
      AND estado = 'pendiente'
    LIMIT 1
    `,
    [usuarioId, recompensaId]
  );
  return rows.length > 0;
};

// Crear solicitud de canje en estado 'pendiente'
exports.crearSolicitudCanjeTx = async ({ usuarioId, recompensaId, puntosCobrados }, conn) => {
  const [result] = await conn.execute(`
    INSERT INTO recompensas_canje
      (usuario_id, recompensa_id, estado, puntos_cobrados, solicitado_en)
    VALUES (?, ?, 'pendiente', ?, NOW())
  `, [usuarioId, recompensaId, puntosCobrados]);

  return result.insertId;
};

// Solicitudes de un usuario (historial del paciente)
exports.obtenerSolicitudesUsuario = async (usuarioId) => {
  const [rows] = await db.execute(`
    SELECT 
      rc.id,
      rc.estado,
      rc.puntos_cobrados,
      rc.solicitado_en,
      rc.resuelto_en,
      rc.entregado_en,
      rc.observaciones,
      c.nombre AS recompensa_nombre
    FROM recompensas_canje rc
    JOIN recompensas_catalogo c ON c.id = rc.recompensa_id
    WHERE rc.usuario_id = ?
    ORDER BY rc.solicitado_en DESC
  `, [usuarioId]);

  return rows;
};

// Solicitudes pendientes (panel admin)
exports.obtenerSolicitudesPendientes = async () => {
  const [rows] = await db.execute(`
    SELECT 
      rc.id,
      rc.usuario_id,
      u.nombre,
      u.apellido_paterno,
      rc.recompensa_id,
      c.nombre AS recompensa_nombre,
      rc.puntos_cobrados,
      rc.estado,
      rc.solicitado_en
    FROM recompensas_canje rc
    JOIN usuarios u ON u.id = rc.usuario_id
    JOIN recompensas_catalogo c ON c.id = rc.recompensa_id
    WHERE rc.estado = 'pendiente'
    ORDER BY rc.solicitado_en ASC
  `);

  return rows;
};

// Actualizar estado del canje ('aprobado' / 'rechazado' / 'entregado')
exports.actualizarEstadoCanjeTx = async ({ canjeId, nuevoEstado, observaciones }, conn) => {
  await conn.execute(`
    UPDATE recompensas_canje
    SET estado = ?,
        resuelto_en = NOW(),
        observaciones = ?
    WHERE id = ?
  `, [nuevoEstado, observaciones || null, canjeId]);
};

// Obtener canje (con lock FOR UPDATE durante la transacción en el resolver)
exports.obtenerCanjeByIdForUpdate = async (canjeId, conn) => {
  const [rows] = await conn.execute(`
    SELECT usuario_id,
           recompensa_id,
           puntos_cobrados,
           estado
    FROM recompensas_canje
    WHERE id = ?
    FOR UPDATE
  `, [canjeId]);

  return rows.length ? rows[0] : null;
};

// Reducir stock de la recompensa aprobada
exports.reducirStockRecompensaTx = async (recompensaId, conn) => {
  const [result] = await conn.execute(`
    UPDATE recompensas_catalogo
    SET stock = stock - 1
    WHERE id = ? AND stock > 0
  `, [recompensaId]);

  return result.affectedRows > 0;
};

/* ==========================
   Manejo de puntos
   ========================== */

// Apartar puntos al crear la solicitud:
// baja puntos_disponibles y sube puntos_en_pausa
exports.apartarPuntosTx = async ({ usuarioId, puntos }, conn) => {
  await conn.execute(
    `
    UPDATE puntos_saldos
    SET 
      puntos_disponibles = puntos_disponibles - ?,
      puntos_en_pausa   = puntos_en_pausa + ?
    WHERE usuario_id = ?
    `,
    [puntos, puntos, usuarioId]
  );
};

// Consumir puntos pausados cuando se aprueba:
// baja puntos_en_pausa, ya no vuelven
exports.consumirPuntosPausadosTx = async ({ usuarioId, puntos }, conn) => {
  await conn.execute(
    `
    UPDATE puntos_saldos
    SET 
      puntos_en_pausa = puntos_en_pausa - ?
    WHERE usuario_id = ?
    `,
    [puntos, usuarioId]
  );
};

// Rechazado: regresa los puntos_en_pausa a disponibles
exports.devolverPuntosPausadosTx = async ({ usuarioId, puntos }, conn) => {
  await conn.execute(
    `
    UPDATE puntos_saldos
    SET 
      puntos_en_pausa    = puntos_en_pausa - ?,
      puntos_disponibles = puntos_disponibles + ?
    WHERE usuario_id = ?
    `,
    [puntos, puntos, usuarioId]
  );
};
// NUEVO: Marcar como ENTREGADO (solo cambia estado y fecha)
exports.marcarComoEntregadoTx = async ({ canjeId, observaciones }, conn) => {
  await conn.execute(`
    UPDATE recompensas_canje
    SET 
      estado = 'ENTREGADO',
      entregado_en = NOW(),
      observaciones = COALESCE(?, observaciones)
    WHERE id = ?
  `, [observaciones, canjeId]);
};