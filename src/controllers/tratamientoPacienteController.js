const db = require('../db'); // 🔹 Importar la conexión a la base de datos
const tratamientoPacienteModel = require('../models/tratamientoPacienteModel');
const citaModel = require('../models/citaModel');
const pagoModel = require('../models/pagoModel');

exports.crearTratamientoCompleto = async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const { usuarioId, tratamientoId, citasTotales, fechaInicio, precio, requiereEvaluacion } = req.body;

        console.log("📌 Iniciando creación de tratamiento...");

        // 1️⃣ **Crear el tratamiento del paciente**
        const tratamientoPacienteId = await tratamientoPacienteModel.crearTratamientoPaciente({
            usuarioId,
            tratamientoId,
            citasTotales: requiereEvaluacion ? 0 : citasTotales,
            citasAsistidas: 0,
            fechaInicio,
            estado: requiereEvaluacion ? 'pendiente' : 'en progreso'
        }, connection);

        console.log(`✔️ Tratamiento creado con ID: ${tratamientoPacienteId}`);

        // 2️⃣ **Crear la primera cita**
        const primeraCita = await citaModel.crearCita({
            tratamientoPacienteId,
            fechaHora: fechaInicio,
            estado: 'pendiente',
            pagada: 0
        }, connection);

        console.log(`✔️ Primera cita creada con ID: ${primeraCita.id}`);

        // 3️⃣ **Crear el pago para la primera cita**
        const primerPago = {
            usuarioId,
            pacienteId: null,
            citaId: primeraCita.id,
            monto: precio,
            metodo: null,
            estado: 'pendiente',
            fechaPago: null
        };

        await pagoModel.crearPago(primerPago, connection);
        console.log(`✔️ Primer pago registrado para la cita ID: ${primeraCita.id}`);

        // 4️⃣ **Si el tratamiento NO requiere evaluación, generar citas y pagos restantes**
        if (!requiereEvaluacion) {
            let citasRestantes = [];
            for (let i = 1; i < citasTotales; i++) {
                citasRestantes.push({
                    tratamientoPacienteId,
                    fechaHora: null,
                    estado: 'pendiente',
                    pagada: 0
                });
            }

            await citaModel.crearCitas(citasRestantes, connection);
            console.log(`✔️ ${citasRestantes.length} citas adicionales creadas.`);

            // 🔹 Obtener todas las citas creadas (incluye la primera)
            const citasCreadas = await citaModel.obtenerCitasPorTratamiento(tratamientoPacienteId, connection);

            // **Excluir la primera cita para evitar pagos duplicados**
            const citasRestantesConPago = citasCreadas.filter(cita => cita.id !== primeraCita.id);

            console.log("📌 Citas obtenidas para pagos (excluyendo la primera):", citasRestantesConPago);

            if (citasRestantesConPago.length > 0) {
                const pagos = citasRestantesConPago.map(cita => ({
                    usuarioId,
                    pacienteId: null,
                    citaId: cita.id,
                    monto: precio,
                    metodo: null,
                    estado: 'pendiente',
                    fechaPago: null
                }));

                console.log("📌 Pagos a insertar:", pagos);

                await pagoModel.crearPagos(pagos, connection);
            } else {
                console.warn("⚠️ No se encontraron citas restantes para generar pagos.");
            }
        }

        // 5️⃣ **Confirmar la transacción**
        await connection.commit();

        res.status(201).json({
            mensaje: requiereEvaluacion
                ? 'Tratamiento creado con cita de evaluación y un pago asociado. El médico determinará cuántas citas necesitas.'
                : 'Tratamiento, citas y pagos creados exitosamente',
            tratamientoPacienteId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error al crear el tratamiento completo:', error);
        res.status(500).json({ mensaje: 'Error al crear el tratamiento completo' });
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
