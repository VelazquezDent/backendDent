const logrosModel = require("../models/logrosModel");

// 🔹 GET /api/logros/:usuarioId
exports.obtenerLogrosUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        if (!usuarioId) {
            return res.status(400).json({ mensaje: "Falta usuarioId" });
        }

        const logros = await logrosModel.obtenerLogrosUsuario(usuarioId);
        return res.status(200).json(logros);
    } catch (error) {
        console.error("Error al obtener logros:", error);
        return res.status(500).json({ mensaje: "Error al obtener logros del usuario" });
    }
};

// 🔹 POST /api/logros/evaluar/:usuarioId
exports.evaluarLogrosUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        if (!usuarioId) return res.status(400).json({ mensaje: "Falta usuarioId" });

        const catalogo = await logrosModel.obtenerCatalogoActivo();
        const nuevosLogros = [];

        for (const logro of catalogo) {
            const condicion = JSON.parse(logro.condicion_json);
            let cumple = false;

            if (condicion.tipo === "citas" && condicion.mes === "actual") {
                const { total, asistidas } = await logrosModel.consultaAsistenciaPerfecta(usuarioId);
                if (total > 0 && (asistidas * 100) / total >= (condicion.porcentaje_asistencia || 100)) {
                    cumple = true;
                }
            } else if (condicion.tipo === "citas" && condicion.consecutivas) {
                cumple = await logrosModel.consultaCitasPuntuales(usuarioId, condicion.consecutivas);
            } else if (condicion.tipo === "tratamiento") {
                cumple = await logrosModel.consultaTratamientoFinalizado(usuarioId);
            }
            else if (condicion.tipo === "usuario" && condicion["años_activo"]) {
                cumple = await logrosModel.consultaAniosActivo(usuarioId, condicion["años_activo"]);
            }

            if (cumple) {
                const yaTiene = await logrosModel.usuarioTieneLogro(usuarioId, logro.id);
                if (!yaTiene) {
                    await logrosModel.asignarLogroUsuario(usuarioId, logro.id);
                    nuevosLogros.push(logro.clave);
                }
            }
        }

        return res.status(200).json({
            mensaje: "Evaluación completada",
            nuevosLogros,
        });
    } catch (error) {
        console.error("Error al evaluar logros:", error);
        return res.status(500).json({ mensaje: "Error al evaluar logros del usuario" });
    }
};

// 🔹 GET /api/logros/admin/catalogo/listar
exports.listarLogrosCatalogo = async (req, res) => {
    try {
        const catalogo = await logrosModel.listarLogrosCatalogo();
        return res.status(200).json(catalogo);
    } catch (error) {
        console.error("Error al listar catálogo:", error);
        return res.status(500).json({ mensaje: "Error al listar catálogo de logros" });
    }
};

// 🔹 POST /api/logros/admin/catalogo
exports.crearLogroCatalogo = async (req, res) => {
    try {
        const { clave, nombre, descripcion, condicion_json, activo } = req.body;

        if (!clave || !nombre || !descripcion || !condicion_json) {
            return res.status(400).json({ mensaje: "Faltan campos obligatorios" });
        }

        const id = await logrosModel.crearLogroCatalogo({ clave, nombre, descripcion, condicion_json, activo });
        return res.status(201).json({ mensaje: "Logro creado correctamente", id });
    } catch (error) {
        console.error("Error al crear logro:", error);
        return res.status(500).json({ mensaje: "Error al crear logro" });
    }
};

// 🔹 PUT /api/logros/admin/catalogo/:logroId
exports.actualizarLogroCatalogo = async (req, res) => {
    try {
        const { logroId } = req.params;
        const { clave, nombre, descripcion, condicion_json, activo } = req.body;

        await logrosModel.actualizarLogroCatalogo(logroId, { clave, nombre, descripcion, condicion_json, activo });
        return res.status(200).json({ mensaje: "Logro actualizado correctamente" });
    } catch (error) {
        console.error("Error al actualizar logro:", error);
        return res.status(500).json({ mensaje: "Error al actualizar logro" });
    }
};
