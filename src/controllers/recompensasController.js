const db = require('../db');
const recompensasModel = require('../models/recompensasModel');
const puntosModel = require('../models/puntosModel'); // ya lo tienes

// GET /api/recompensas/catalogo
exports.obtenerCatalogoRecompensas = async (req, res) => {
    try {
        const recompensas = await recompensasModel.obtenerCatalogo();

        if (!recompensas || recompensas.length === 0) {
            return res.status(200).json({
                mensaje: "No hay recompensas disponibles en este momento",
                recompensas: []
            });
        }

        return res.status(200).json(recompensas);
    } catch (error) {
        console.error("Error al obtener catálogo de recompensas:", error);
        return res.status(500).json({
            mensaje: "Error interno al obtener el catálogo de recompensas"
        });
    }
};

// POST /api/recompensas/canjear
// Body: { usuarioId, recompensaId }
exports.solicitarCanje = async (req, res) => {
    const { usuarioId, recompensaId } = req.body;

    if (!usuarioId || !recompensaId) {
        return res.status(400).json({ mensaje: "Faltan datos (usuarioId o recompensaId)" });
    }

    // abrimos conexión transaccional
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Info de la recompensa (dentro de la misma conexión)
        const recompensa = await recompensasModel.obtenerRecompensaPorId(recompensaId, conn);
        if (!recompensa || !recompensa.activo || recompensa.stock <= 0) {
            await conn.rollback();
            return res.status(400).json({ mensaje: "Recompensa no disponible" });
        }

        // 2. Saldo del usuario (ojo: este usa puntosModel que lee con db global)
        const saldo = await puntosModel.obtenerSaldoPuntos(usuarioId);
        const puntosDisponibles = saldo.puntos_disponibles || 0;

        if (puntosDisponibles < recompensa.costo_puntos) {
            await conn.rollback();
            return res.status(400).json({ mensaje: "No tienes puntos suficientes" });
        }

        // 3. No permitir canje duplicado pendiente para la MISMA recompensa
        const yaPendiente = await recompensasModel.tieneCanjePendiente(
            { usuarioId, recompensaId },
            conn
        );
        if (yaPendiente) {
            await conn.rollback();
            return res.status(400).json({
                mensaje: "Ya tienes una solicitud pendiente para esta recompensa."
            });
        }

        // 4. Apartar puntos (bajar disponibles, subir en_pausa)
        await recompensasModel.apartarPuntosTx({
            usuarioId,
            puntos: recompensa.costo_puntos
        }, conn);

        // 5. Crear solicitud pendiente
        const canjeId = await recompensasModel.crearSolicitudCanjeTx({
            usuarioId,
            recompensaId,
            puntosCobrados: recompensa.costo_puntos
        }, conn);

        await conn.commit();

        return res.status(201).json({
            mensaje: "Solicitud creada. Tus puntos quedaron reservados.",
            canjeId
        });
    } catch (error) {
        console.error("Error al solicitar canje:", error);
        await conn.rollback();
        return res.status(500).json({
            mensaje: "Error interno al solicitar canje"
        });
    } finally {
        conn.release();
    }
};

// GET /api/recompensas/mis-solicitudes/:usuarioId
exports.obtenerMisSolicitudes = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const solicitudes = await recompensasModel.obtenerSolicitudesUsuario(usuarioId);
        return res.status(200).json(solicitudes);
    } catch (error) {
        console.error("Error al obtener solicitudes del usuario:", error);
        return res.status(500).json({
            mensaje: "Error interno al obtener solicitudes"
        });
    }
};

// GET /api/recompensas/pendientes  (admin)
exports.obtenerPendientes = async (req, res) => {
    try {
        const solicitudes = await recompensasModel.obtenerSolicitudesPendientes();
        return res.status(200).json(solicitudes);
    } catch (error) {
        console.error("Error al obtener solicitudes pendientes:", error);
        return res.status(500).json({
            mensaje: "Error interno al obtener solicitudes pendientes"
        });
    }
};

exports.resolverCanje = async (req, res) => {
    const { canjeId } = req.params;
    const { estado, observaciones } = req.body;

    // Normalizamos a MAYÚSCULAS para que haga match con la BD
    const estadoUpper = (estado || "").toUpperCase(); // "APROBADO", "RECHAZADO", "ENTREGADO"

    // Validar estado permitido
    if (!['APROBADO', 'RECHAZADO', 'ENTREGADO'].includes(estadoUpper)) {
        return res.status(400).json({ mensaje: "Estado inválido" });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Obtener el canje con bloqueo
        const canje = await recompensasModel.obtenerCanjeByIdForUpdate(canjeId, conn);
        if (!canje) {
            await conn.rollback();
            return res.status(404).json({ mensaje: "Canje no encontrado" });
        }

        // OJO: en la BD tu estado inicial es "PENDIENTE"
        if (canje.estado !== 'PENDIENTE') {
            await conn.rollback();
            return res.status(400).json({ mensaje: "Este canje ya fue resuelto" });
        }

        // 2. Actualizar estado del canje
        await recompensasModel.actualizarEstadoCanjeTx({
            canjeId,
            nuevoEstado: estadoUpper,
            observaciones
        }, conn);

        // 3. Lógica de puntos / stock:
        if (estadoUpper === 'APROBADO' || estadoUpper === 'ENTREGADO') {
            // consumir puntos en pausa (se gastan definitivamente)
            await recompensasModel.consumirPuntosPausadosTx({
                usuarioId: canje.usuario_id,
                puntos: canje.puntos_cobrados
            }, conn);

            // restar stock
            const okStock = await recompensasModel.reducirStockRecompensaTx(
                canje.recompensa_id,
                conn
            );

            if (!okStock) {
                await conn.rollback();
                return res.status(409).json({
                    mensaje: "No hay stock suficiente para aprobar este canje."
                });
            }
        }

        if (estadoUpper === 'RECHAZADO') {
            // devolver puntos al disponible
            await recompensasModel.devolverPuntosPausadosTx({
                usuarioId: canje.usuario_id,
                puntos: canje.puntos_cobrados
            }, conn);
        }

        await conn.commit();

        return res.status(200).json({ mensaje: `Canje ${estadoUpper} correctamente` });
    } catch (error) {
        console.error("Error al resolver canje:", error);
        await conn.rollback();
        return res.status(500).json({
            mensaje: "Error interno al resolver el canje"
        });
    } finally {
        conn.release();
    }
};

// NUEVO: Marcar como ENTREGADO (solo desde APROBADO)
exports.marcarEntregado = async (req, res) => {
    const { canjeId } = req.params;
    const { observaciones } = req.body;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Obtener canje con lock
        const canje = await recompensasModel.obtenerCanjeByIdForUpdate(canjeId, conn);
        if (!canje) {
            await conn.rollback();
            return res.status(404).json({ mensaje: "Canje no encontrado" });
        }

        // 2. Validar que esté APROBADO
        if (canje.estado !== 'APROBADO') {
            await conn.rollback();
            return res.status(400).json({
                mensaje: "Solo se puede marcar como ENTREGADO si está APROBADO"
            });
        }

        // 3. Actualizar a ENTREGADO + fecha
        await recompensasModel.marcarComoEntregadoTx({
            canjeId,
            observaciones: observaciones || "Entregado en recepción"
        }, conn);

        await conn.commit();
        return res.status(200).json({ mensaje: "Cupón marcado como ENTREGADO" });
    } catch (error) {
        console.error("Error al marcar como entregado:", error);
        await conn.rollback();
        return res.status(500).json({ mensaje: "Error interno al entregar el cupón" });
    } finally {
        conn.release();
    }
};