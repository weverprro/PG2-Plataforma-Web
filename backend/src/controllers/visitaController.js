const pool = require("../config/database");

async function listarDisponibilidades(req, res) {
    try {
        const [disponibilidades] = await pool.execute(
            `SELECT
                id_disponibilidad,
                fecha,
                hora_inicio,
                hora_fin,
                cupos_disponibles,
                estado
             FROM disponibilidad_visita
             WHERE estado = TRUE
             AND fecha >= CURDATE()
             ORDER BY fecha ASC, hora_inicio ASC`
        );

        res.json(disponibilidades);

    } catch (error) {
        console.error("Error al listar disponibilidades:", error.message);

        res.status(500).json({
            mensaje: "Ocurrió un error al obtener las disponibilidades."
        });
    }
}

async function crearDisponibilidad(req, res) {
    try {
        const {
            fecha,
            horaInicio,
            horaFin,
            cuposDisponibles
        } = req.body;

        if (!fecha || !horaInicio || !horaFin || !cuposDisponibles) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios."
            });
        }

        if (cuposDisponibles <= 0) {
            return res.status(400).json({
                mensaje: "Los cupos disponibles deben ser mayores que cero."
            });
        }

        const [resultado] = await pool.execute(
            `INSERT INTO disponibilidad_visita
            (
                fecha,
                hora_inicio,
                hora_fin,
                cupos_disponibles
            )
            VALUES (?, ?, ?, ?)`,
            [
                fecha,
                horaInicio,
                horaFin,
                cuposDisponibles
            ]
        );

        res.status(201).json({
            mensaje: "Disponibilidad creada correctamente.",
            idDisponibilidad: resultado.insertId
        });

    } catch (error) {
        console.error("Error al crear disponibilidad:", error.message);

        res.status(500).json({
            mensaje: "Ocurrió un error al crear la disponibilidad."
        });
    }
}

async function actualizarDisponibilidad(req, res) {
    try {
        const { id } = req.params;

        const {
            fecha,
            horaInicio,
            horaFin,
            cuposDisponibles,
            estado
        } = req.body;

        const [resultado] = await pool.execute(
            `UPDATE disponibilidad_visita
             SET fecha = ?,
                 hora_inicio = ?,
                 hora_fin = ?,
                 cupos_disponibles = ?,
                 estado = ?
             WHERE id_disponibilidad = ?`,
            [
                fecha,
                horaInicio,
                horaFin,
                cuposDisponibles,
                estado,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Disponibilidad no encontrada."
            });
        }

        res.json({
            mensaje: "Disponibilidad actualizada correctamente."
        });

    } catch (error) {
        console.error("Error al actualizar disponibilidad:", error.message);

        res.status(500).json({
            mensaje: "Ocurrió un error al actualizar la disponibilidad."
        });
    }
}

async function crearSolicitudVisita(req, res) {
    try {
        const {
            nombreVisitante,
            correoVisitante,
            telefono,
            cantidadPersonas,
            motivo,
            idDisponibilidad
        } = req.body;

        if (
            !nombreVisitante ||
            !correoVisitante ||
            !cantidadPersonas ||
            !idDisponibilidad
        ) {
            return res.status(400).json({
                mensaje: "Nombre, correo, cantidad de personas y disponibilidad son obligatorios."
            });
        }

        if (cantidadPersonas <= 0) {
            return res.status(400).json({
                mensaje: "La cantidad de personas debe ser mayor que cero."
            });
        }

        const [disponibilidades] = await pool.execute(
            `SELECT
                id_disponibilidad,
                cupos_disponibles,
                estado
             FROM disponibilidad_visita
             WHERE id_disponibilidad = ?
             AND fecha >= CURDATE()
             LIMIT 1`,
            [idDisponibilidad]
        );

        if (disponibilidades.length === 0) {
            return res.status(404).json({
                mensaje: "La disponibilidad seleccionada no existe."
            });
        }

        const disponibilidad = disponibilidades[0];

        if (!disponibilidad.estado) {
            return res.status(400).json({
                mensaje: "La disponibilidad seleccionada no está activa."
            });
        }

        if (cantidadPersonas > disponibilidad.cupos_disponibles) {
            return res.status(400).json({
                mensaje: "No hay suficientes cupos disponibles."
            });
        }

        const [resultado] = await pool.execute(
            `INSERT INTO solicitud_visita
            (
                nombre_visitante,
                correo_visitante,
                telefono,
                cantidad_personas,
                motivo,
                id_disponibilidad
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                nombreVisitante,
                correoVisitante,
                telefono || null,
                cantidadPersonas,
                motivo || null,
                idDisponibilidad
            ]
        );

        res.status(201).json({
            mensaje: "Solicitud de visita enviada correctamente.",
            idSolicitud: resultado.insertId
        });

    } catch (error) {
        console.error("Error al crear solicitud de visita:", error.message);

        res.status(500).json({
            mensaje: "Ocurrió un error al enviar la solicitud de visita."
        });
    }
}

async function listarSolicitudesVisita(req, res) {
    try {
        const [solicitudes] = await pool.execute(
            `SELECT
                sv.id_solicitud,
                sv.nombre_visitante,
                sv.correo_visitante,
                sv.telefono,
                sv.cantidad_personas,
                sv.motivo,
                sv.estado,
                sv.fecha_solicitud,
                dv.fecha,
                dv.hora_inicio,
                dv.hora_fin
             FROM solicitud_visita sv
             INNER JOIN disponibilidad_visita dv
                ON sv.id_disponibilidad = dv.id_disponibilidad
             ORDER BY sv.fecha_solicitud DESC`
        );

        res.json(solicitudes);

    } catch (error) {
        console.error("Error al listar solicitudes:", error.message);

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
                cantidad_personas,
                id_disponibilidad
             FROM solicitud_visita
             WHERE id_solicitud = ?
             FOR UPDATE`,
            [id]
        );

        if (solicitudes.length === 0) {
            await conexion.rollback();

            return res.status(404).json({
                mensaje: "Solicitud de visita no encontrada."
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
            const [disponibilidades] = await conexion.execute(
                `SELECT cupos_disponibles
                 FROM disponibilidad_visita
                 WHERE id_disponibilidad = ?
                 FOR UPDATE`,
                [solicitud.id_disponibilidad]
            );

            if (disponibilidades.length === 0) {
                await conexion.rollback();

                return res.status(404).json({
                    mensaje: "Disponibilidad no encontrada."
                });
            }

            const cupos =
                disponibilidades[0].cupos_disponibles;

            if (cupos < solicitud.cantidad_personas) {
                await conexion.rollback();

                return res.status(400).json({
                    mensaje: "No existen suficientes cupos para aprobar esta solicitud."
                });
            }

            await conexion.execute(
                `UPDATE disponibilidad_visita
                 SET cupos_disponibles =
                     cupos_disponibles - ?
                 WHERE id_disponibilidad = ?`,
                [
                    solicitud.cantidad_personas,
                    solicitud.id_disponibilidad
                ]
            );
        }

        if (
            solicitud.estado === "Aprobada" &&
            estado !== "Aprobada"
        ) {
            await conexion.execute(
                `UPDATE disponibilidad_visita
                 SET cupos_disponibles =
                     cupos_disponibles + ?
                 WHERE id_disponibilidad = ?`,
                [
                    solicitud.cantidad_personas,
                    solicitud.id_disponibilidad
                ]
            );
        }

        await conexion.execute(
            `UPDATE solicitud_visita
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
            "Error al actualizar solicitud:",
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
    listarDisponibilidades,
    crearDisponibilidad,
    actualizarDisponibilidad,
    crearSolicitudVisita,
    listarSolicitudesVisita,
    actualizarEstadoSolicitud
};