const pool = require("../config/database");

async function listarActividades(req, res) {
    try {
        const [actividades] = await pool.execute(
            `SELECT
                id_actividad,
                titulo,
                descripcion,
                fecha,
                hora_inicio,
                hora_fin,
                cupos_disponibles,
                estado
             FROM actividad_voluntariado
             WHERE estado = TRUE
             AND fecha >= CURDATE()
             ORDER BY fecha ASC, hora_inicio ASC`
        );

        res.json(actividades);

    } catch (error) {
        console.error(
            "Error al listar actividades:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al obtener las actividades."
        });
    }
}

async function crearActividad(req, res) {
    try {
        const {
            titulo,
            descripcion,
            fecha,
            horaInicio,
            horaFin,
            cuposDisponibles
        } = req.body;

        if (
            !titulo ||
            !descripcion ||
            !fecha ||
            !cuposDisponibles
        ) {
            return res.status(400).json({
                mensaje: "Título, descripción, fecha y cupos son obligatorios."
            });
        }

        if (cuposDisponibles <= 0) {
            return res.status(400).json({
                mensaje: "Los cupos deben ser mayores que cero."
            });
        }

        const [resultado] = await pool.execute(
            `INSERT INTO actividad_voluntariado
            (
                titulo,
                descripcion,
                fecha,
                hora_inicio,
                hora_fin,
                cupos_disponibles
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                titulo,
                descripcion,
                fecha,
                horaInicio || null,
                horaFin || null,
                cuposDisponibles
            ]
        );

        res.status(201).json({
            mensaje: "Actividad de voluntariado creada correctamente.",
            idActividad: resultado.insertId
        });

    } catch (error) {
        console.error(
            "Error al crear actividad:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al crear la actividad."
        });
    }
}

async function actualizarActividad(req, res) {
    try {
        const { id } = req.params;

        const {
            titulo,
            descripcion,
            fecha,
            horaInicio,
            horaFin,
            cuposDisponibles,
            estado
        } = req.body;

        const [resultado] = await pool.execute(
            `UPDATE actividad_voluntariado
             SET titulo = ?,
                 descripcion = ?,
                 fecha = ?,
                 hora_inicio = ?,
                 hora_fin = ?,
                 cupos_disponibles = ?,
                 estado = ?
             WHERE id_actividad = ?`,
            [
                titulo,
                descripcion,
                fecha,
                horaInicio || null,
                horaFin || null,
                cuposDisponibles,
                estado,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Actividad no encontrada."
            });
        }

        res.json({
            mensaje: "Actividad actualizada correctamente."
        });

    } catch (error) {
        console.error(
            "Error al actualizar actividad:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al actualizar la actividad."
        });
    }
}

async function crearSolicitudVoluntariado(req, res) {
    try {
        const {
            nombreVoluntario,
            correoVoluntario,
            telefono,
            observaciones,
            idActividad
        } = req.body;

        if (
            !nombreVoluntario ||
            !correoVoluntario ||
            !idActividad
        ) {
            return res.status(400).json({
                mensaje: "Nombre, correo y actividad son obligatorios."
            });
        }

        const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!correoValido.test(correoVoluntario)) {
            return res.status(400).json({
                mensaje: "El correo electrónico no tiene un formato válido."
            });
        }

        const [actividades] = await pool.execute(
            `SELECT
                id_actividad,
                cupos_disponibles,
                estado
             FROM actividad_voluntariado
             WHERE id_actividad = ?
             AND fecha >= CURDATE()
             LIMIT 1`,
            [idActividad]
        );

        if (actividades.length === 0) {
            return res.status(404).json({
                mensaje: "La actividad seleccionada no existe."
            });
        }

        const actividad = actividades[0];

        if (!actividad.estado) {
            return res.status(400).json({
                mensaje: "La actividad seleccionada no está disponible."
            });
        }

        if (actividad.cupos_disponibles <= 0) {
            return res.status(400).json({
                mensaje: "La actividad ya no tiene cupos disponibles."
            });
        }

        const [resultado] = await pool.execute(
            `INSERT INTO solicitud_voluntariado
            (
                nombre_voluntario,
                correo_voluntario,
                telefono,
                observaciones,
                id_actividad
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                nombreVoluntario,
                correoVoluntario,
                telefono || null,
                observaciones || null,
                idActividad
            ]
        );

        res.status(201).json({
            mensaje: "Solicitud de voluntariado enviada correctamente.",
            idSolicitud: resultado.insertId
        });

    } catch (error) {
        console.error(
            "Error al crear solicitud de voluntariado:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al enviar la solicitud."
        });
    }
}

async function listarSolicitudesVoluntariado(req, res) {
    try {
        const [solicitudes] = await pool.execute(
            `SELECT
                sv.id_solicitud,
                sv.nombre_voluntario,
                sv.correo_voluntario,
                sv.telefono,
                sv.observaciones,
                sv.estado,
                sv.fecha_solicitud,
                av.titulo AS actividad,
                av.fecha
             FROM solicitud_voluntariado sv
             INNER JOIN actividad_voluntariado av
                ON sv.id_actividad = av.id_actividad
             ORDER BY sv.fecha_solicitud DESC`
        );

        res.json(solicitudes);

    } catch (error) {
        console.error(
            "Error al listar solicitudes de voluntariado:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al obtener las solicitudes."
        });
    }
}

async function actualizarEstadoSolicitud(req, res) {
    const conexion = await pool.getConnection();

    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosPermitidos = [
            "Pendiente",
            "Aprobada",
            "Rechazada",
            "Cancelada"
        ];

        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                mensaje: "Estado de solicitud no válido."
            });
        }

        await conexion.beginTransaction();

        const [solicitudes] = await conexion.execute(
            `SELECT
                id_solicitud,
                estado,
                id_actividad
             FROM solicitud_voluntariado
             WHERE id_solicitud = ?
             FOR UPDATE`,
            [id]
        );

        if (solicitudes.length === 0) {
            await conexion.rollback();

            return res.status(404).json({
                mensaje: "Solicitud de voluntariado no encontrada."
            });
        }

        const solicitud = solicitudes[0];

        if (solicitud.estado === estado) {
            await conexion.rollback();

            return res.status(400).json({
                mensaje: `La solicitud ya se encuentra en estado ${estado}.`
            });
        }

        if (
            estado === "Aprobada" &&
            solicitud.estado !== "Aprobada"
        ) {
            const [actividades] = await conexion.execute(
                `SELECT cupos_disponibles
                 FROM actividad_voluntariado
                 WHERE id_actividad = ?
                 FOR UPDATE`,
                [solicitud.id_actividad]
            );

            if (actividades.length === 0) {
                await conexion.rollback();

                return res.status(404).json({
                    mensaje: "Actividad no encontrada."
                });
            }

            if (actividades[0].cupos_disponibles <= 0) {
                await conexion.rollback();

                return res.status(400).json({
                    mensaje: "No existen cupos disponibles para aprobar esta solicitud."
                });
            }

            await conexion.execute(
                `UPDATE actividad_voluntariado
                 SET cupos_disponibles =
                     cupos_disponibles - 1
                 WHERE id_actividad = ?`,
                [solicitud.id_actividad]
            );
        }

        if (
            solicitud.estado === "Aprobada" &&
            estado !== "Aprobada"
        ) {
            await conexion.execute(
                `UPDATE actividad_voluntariado
                 SET cupos_disponibles =
                     cupos_disponibles + 1
                 WHERE id_actividad = ?`,
                [solicitud.id_actividad]
            );
        }

        await conexion.execute(
            `UPDATE solicitud_voluntariado
             SET estado = ?
             WHERE id_solicitud = ?`,
            [estado, id]
        );

        await conexion.commit();

        res.json({
            mensaje: "Estado de la solicitud actualizado correctamente."
        });

    } catch (error) {
        await conexion.rollback();

        console.error(
            "Error al actualizar solicitud de voluntariado:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al actualizar la solicitud."
        });

    } finally {
        conexion.release();
    }
}

module.exports = {
    listarActividades,
    crearActividad,
    actualizarActividad,
    crearSolicitudVoluntariado,
    listarSolicitudesVoluntariado,
    actualizarEstadoSolicitud
};