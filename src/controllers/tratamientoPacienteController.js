const db = require('../db'); // 🔹 Importar la conexión a la base de datos
const tratamientoPacienteModel = require('../models/tratamientoPacienteModel');
const citaModel = require('../models/citaModel');
const pagoModel = require('../models/pagoModel');

exports.crearTratamientoCompleto = async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const { usuarioId, pacienteId, tratamientoId, citasTotales, fechaInicio, precio, requiereEvaluacion } = req.body;

        console.log("📌 Iniciando creación de tratamiento...");
        console.log("📥 Datos recibidos:", { usuarioId, pacienteId, tratamientoId, citasTotales, fechaInicio, precio, requiereEvaluacion });

        // ✅ Validación correcta de datos obligatorios
        if ((usuarioId === null && pacienteId === null) || !tratamientoId || !precio || (!requiereEvaluacion && citasTotales < 1)) {
            throw new Error("❌ Datos inválidos: Se requiere un usuario o un paciente sin plataforma.");
        }

        // 1️⃣ **Crear el tratamiento del paciente o paciente sin plataforma**
        const tratamientoPacienteId = await tratamientoPacienteModel.crearTratamientoPaciente({
            usuarioId: usuarioId || null,
            pacienteId: pacienteId || null,
            tratamientoId,
            citasTotales: requiereEvaluacion ? 0 : citasTotales,
            citasAsistidas: 0,
            fechaInicio,
            estado: requiereEvaluacion ? 'pendiente' : 'en progreso'
        }, connection);

        if (!tratamientoPacienteId) {
            throw new Error("❌ Error: No se pudo crear el tratamiento.");
        }

        console.log(`✔️ Tratamiento creado con ID: ${tratamientoPacienteId}`);

        // 2️⃣ **Crear las citas**
        let citas = [{
            tratamientoPacienteId,
            fechaHora: fechaInicio,
            estado: 'pendiente',
            pagada: 0
        }];

        if (!requiereEvaluacion) {
            for (let i = 1; i < citasTotales; i++) {
                citas.push({
                    tratamientoPacienteId,
                    fechaHora: null,
                    estado: 'pendiente',
                    pagada: 0
                });
            }
        }

        console.log("📅 Citas a crear:", citas);

        await citaModel.crearCitas(citas, connection);
        console.log(`✔️ ${citas.length} citas creadas.`);

        // 3️⃣ **Confirmar transacción antes de obtener citas**
        await connection.commit();

        // 4️⃣ **Obtener citas creadas**
        const citasCreadas = await citaModel.obtenerCitasPorTratamiento(tratamientoPacienteId, connection);

        if (citasCreadas.length === 0) {
            throw new Error("❌ No se obtuvieron citas después de la inserción.");
        }

        console.log("📌 Citas creadas después de la inserción:", citasCreadas);

        // 5️⃣ **Crear pagos para TODAS las citas**
        const pagos = citasCreadas.map(cita => ({
            usuarioId: usuarioId || null,
            pacienteId: pacienteId || null,
            citaId: cita.id,
            monto: precio,
            metodo: null,
            estado: 'pendiente',
            fechaPago: null
        }));

        if (pagos.length > 0) {
            console.log("📌 Generando pagos para citas:", pagos);
            await pagoModel.crearPagos(pagos, connection);
            console.log(`✔️ ${pagos.length} pagos creados correctamente.`);
        } else {
            console.warn("⚠️ No hay pagos para insertar.");
        }

        res.status(201).json({
            mensaje: requiereEvaluacion
                ? 'Tratamiento creado con cita de evaluación.'
                : 'Tratamiento, citas y pagos creados exitosamente',
            tratamientoPacienteId
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al crear el tratamiento:', error.message);
        res.status(500).json({ mensaje: error.message });
    } finally {
        connection.release();
    }
};

exports.obtenerTratamientosEnProgreso = async (req, res) => {
    try {
        const tratamientos = await tratamientoPacienteModel.obtenerTratamientosEnProgreso();
        res.status(200).json(tratamientos);
    } catch (error) {
        console.error('Error al obtener tratamientos en progreso:', error);
        res.status(500).json({ mensaje: 'Error al obtener tratamientos en progreso' });
    }
};
exports.obtenerTratamientosPendientes = async (req, res) => {
    try {
        const tratamientos = await tratamientoPacienteModel.obtenerTratamientosPendientes();
        res.status(200).json(tratamientos);
    } catch (error) {
        console.error('Error al obtener tratamientos pendientes:', error);
        res.status(500).json({ mensaje: 'Error al obtener tratamientos pendientes' });
    }
};
exports.verificarTratamientoActivo = async (req, res) => {
    const { usuarioId } = req.params;

    try {
        // 1️⃣ Verificar si el usuario tiene un tratamiento activo
        const tratamientoActivo = await tratamientoPacienteModel.tieneTratamientoActivo(usuarioId);

        if (tratamientoActivo) {
            return res.status(200).json({
                tieneTratamientoActivo: true,
                mensaje: "El usuario ya tiene un tratamiento activo.",
                tratamiento: tratamientoActivo
            });
        }

        // 2️⃣ Verificar si el usuario ha completado un tratamiento anteriormente
        const haCompletado = await tratamientoPacienteModel.haCompletadoTratamiento(usuarioId);

        res.status(200).json({
            tieneTratamientoActivo: false,
            puedeCrearNuevo: haCompletado,
            mensaje: haCompletado 
                ? "El usuario ya ha completado un tratamiento y puede crear uno nuevo."
                : "El usuario no tiene registros de tratamientos."
        });

    } catch (error) {
        console.error("❌ Error al verificar tratamiento activo:", error);
        res.status(500).json({ mensaje: "Error al verificar el tratamiento activo." });
    }
};
exports.verificarTratamientoActivoTipo = async (req, res) => {
    const { tipo, id } = req.params;

    try {
        let tratamientoActivo = null;
        let haCompletado = false;

        if (tipo === 'usuario') {
            // 🔹 Verificar si el usuario de la tabla `usuarios` tiene un tratamiento activo
            tratamientoActivo = await tratamientoPacienteModel.tieneTratamientoActivoTipo(id, 'usuario');
            haCompletado = await tratamientoPacienteModel.haCompletadoTratamientoTipo(id, 'usuario');
        } else if (tipo === 'paciente_sin_plataforma') {
            // 🔹 Verificar si el paciente de la tabla `pacientes_sin_plataforma` tiene un tratamiento activo
            tratamientoActivo = await tratamientoPacienteModel.tieneTratamientoActivoTipo(id, 'paciente_sin_plataforma');
            haCompletado = await tratamientoPacienteModel.haCompletadoTratamientoTipo(id, 'paciente_sin_plataforma');
        } else {
            return res.status(400).json({ mensaje: "❌ Tipo de usuario no válido." });
        }

        if (tratamientoActivo) {
            return res.status(200).json({
                tieneTratamientoActivo: true,
                mensaje: "El usuario ya tiene un tratamiento activo.",
                tratamiento: tratamientoActivo
            });
        }

        res.status(200).json({
            tieneTratamientoActivo: false,
            puedeCrearNuevo: haCompletado,
            mensaje: haCompletado 
                ? "El usuario ya ha completado un tratamiento y puede crear uno nuevo."
                : "El usuario no tiene registros de tratamientos."
        });

    } catch (error) {
        console.error("❌ Error al verificar tratamiento activo:", error);
        res.status(500).json({ mensaje: "Error al verificar el tratamiento activo." });
    }
};

exports.obtenerTratamientosActivosPorUsuario = async (req, res) => {
    const { usuarioId } = req.params;

    try {
        // Validar que el usuarioId sea un número válido
        if (isNaN(usuarioId)) {
            return res.status(400).json({ mensaje: "El usuarioId no es válido." });
        }

        // Obtener tratamientos activos (en progreso o pendiente) para el usuario
        const tratamientos = await tratamientoPacienteModel.obtenerTratamientosActivosPorUsuario(usuarioId);

        if (tratamientos.length === 0) {
            return res.status(200).json({ mensaje: "No hay tratamientos activos para este usuario.", tratamientos: [] });
        }

        res.status(200).json(tratamientos);
    } catch (error) {
        console.error("Error al obtener tratamientos activos:", error);
        res.status(500).json({ mensaje: "Error al obtener tratamientos activos." });
    }
};
exports.crearNuevoTratamientoConCitasYPagos = async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const { tratamientoPacienteId, citasTotales, precioPorCita } = req.body;

        if (!tratamientoPacienteId || !citasTotales || !precioPorCita) {
            throw new Error("❌ Datos inválidos: Faltan campos obligatorios.");
        }

        console.log("📌 Verificando tratamiento, citas y pagos existentes...");

        // 1️⃣ Obtener el usuario/paciente y estado del tratamiento
        const tratamiento = await tratamientoPacienteModel.obtenerTratamientoPorId(tratamientoPacienteId, connection);
        if (!tratamiento) {
            throw new Error("❌ Error: No se encontró el tratamiento asociado.");
        }
        const { usuario_id, paciente_id, estado } = tratamiento;
        console.log(`🔍 Usuario asociado: ${usuario_id}, Paciente asociado: ${paciente_id}, Estado: ${estado}`);

        // ❌ Si el tratamiento ya está en progreso, no se deben agregar más citas ni pagos
        if (estado !== 'pendiente') {
            console.log("⚠️ El tratamiento ya está en progreso, no se agregarán más citas ni pagos.");
            await connection.commit();
            return res.status(200).json({
                mensaje: "El tratamiento ya está en progreso, no se generaron nuevas citas ni pagos.",
                tratamientoPacienteId
            });
        }

        // 2️⃣ Contar cuántas citas ya existen para este tratamiento
        const citasExistentes = await citaModel.obtenerNuevasCitasPorTratamiento(tratamientoPacienteId, connection);
        const totalCitasExistentes = citasExistentes.length;
        console.log(`🔍 Citas ya creadas: ${totalCitasExistentes}`);

        // 3️⃣ Obtener pagos existentes para estas citas
        const pagosExistentes = await pagoModel.obtenerPagosPorCitas(citasExistentes.map(cita => cita.id), connection);
        console.log(`🔍 Pagos ya creados: ${pagosExistentes.length}`);

        // 4️⃣ Calcular cuántas citas y pagos faltan por crear
        const citasFaltantes = citasTotales - totalCitasExistentes;
        const citasSinPago = citasExistentes.filter(cita => !pagosExistentes.some(pago => pago.cita_id === cita.id));
        console.log(`🔍 Citas sin pago: ${citasSinPago.length}`);

        // 5️⃣ Actualizar el monto de los pagos existentes al precio ingresado, incluso si no hay citas nuevas
        if (pagosExistentes.length > 0) {
            for (let pago of pagosExistentes) {
                await pagoModel.actualizarMontoPago(pago.id, precioPorCita, connection);
                console.log(`🔄 Monto del pago ${pago.id} actualizado a ${precioPorCita}.`);
            }
        }

        // 6️⃣ Crear citas y pagos adicionales si faltan
        if (citasFaltantes > 0 || citasSinPago.length > 0) {
            // Crear las citas faltantes
            let citasNuevas = [];
            for (let i = 0; i < citasFaltantes; i++) {
                citasNuevas.push({
                    tratamientoPacienteId,
                    fechaHora: null,
                    estado: 'pendiente',
                    pagada: 0
                });
            }

            if (citasNuevas.length > 0) {
                await citaModel.crearNuevasCitas(citasNuevas, connection);
                console.log(`✔️ ${citasNuevas.length} nuevas citas creadas.`);
            }

            // Obtener todas las citas nuevamente
            const citasActualizadas = await citaModel.obtenerNuevasCitasPorTratamiento(tratamientoPacienteId, connection);

            // Crear nuevos pagos solo para citas que no tenían uno
            const nuevosPagos = citasActualizadas
                .filter(cita => !pagosExistentes.some(pago => pago.cita_id === cita.id))
                .map(cita => ({
                    usuarioId: usuario_id,
                    pacienteId: paciente_id,
                    citaId: cita.id,
                    monto: precioPorCita,
                    metodo: null,
                    estado: 'pendiente',
                    fechaPago: null
                }));

            if (nuevosPagos.length > 0) {
                await pagoModel.crearNuevosPagos(nuevosPagos, connection);
                console.log(`✔️ ${nuevosPagos.length} nuevos pagos creados correctamente.`);
            }
        } else {
            console.log("✅ No es necesario crear nuevas citas o pagos, solo se actualizaron los montos existentes.");
        }

        // 7️⃣ Actualizar citas_totales y estado del tratamiento a "en progreso"
        await tratamientoPacienteModel.actualizarCitasTotalesYEstado(tratamientoPacienteId, citasTotales, 'en progreso', connection);
        console.log(`✔️ Tratamiento actualizado con citas_totales: ${citasTotales} y estado: 'en progreso'.`);

        await connection.commit();

        res.status(201).json({
            mensaje: "Citas y pagos creados/actualizados exitosamente. El tratamiento ahora está en progreso.",
            tratamientoPacienteId
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al verificar y crear/actualizar citas/pagos:', error.message);
        res.status(500).json({ mensaje: error.message });
    } finally {
        connection.release();
    }
};
exports.obtenerHistorialTratamientos = async (req, res) => {
    try {
        const historial = await tratamientoPacienteModel.obtenerHistorialTratamientos();
        res.status(200).json(historial);
    } catch (error) {
        console.error('Error al obtener historial de tratamientos:', error);
        res.status(500).json({ mensaje: 'Error al obtener historial de tratamientos' });
    }
};
exports.obtenerHistorialPorUsuario = async (req, res) => {
    const { usuario_id } = req.params;

    try {
        const historial = await tratamientoPacienteModel.obtenerHistorialPorUsuario(usuario_id);
        res.status(200).json(historial);
    } catch (error) {
        console.error('Error al obtener historial de tratamientos para usuario:', error);
        res.status(500).json({ mensaje: 'Error al obtener historial de tratamientos' });
    }
};
exports.obtenerCitasPorTratamiento = async (req, res) => {
    try {
        const { tratamiento_paciente_id } = req.params;

        const datos = await citaModel.obtenerCitaPorTratamiento(tratamiento_paciente_id);

        if (!datos.length) {
            return res.status(404).json({ mensaje: 'No se encontraron citas para este tratamiento.' });
        }

        const nombre_tratamiento = datos[0].nombre_tratamiento;

        const citas = datos.map(cita => ({
            cita_id: cita.cita_id,
            fecha_hora: cita.fecha_hora,
            comentario: cita.comentario,
            pagada: !!cita.pagada,
            estado_pago: cita.estado_pago,
            monto: cita.monto,
            metodo: cita.metodo,
            pago_id: cita.pago_id  // ✅ ¡Aquí estaba el detalle!


        }));

        res.status(200).json({
            tratamiento_paciente_id: parseInt(tratamiento_paciente_id),
            nombre_tratamiento,
            citas
        });
    } catch (error) {
        console.error('Error al obtener citas del tratamiento:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};