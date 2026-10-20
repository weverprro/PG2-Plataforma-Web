const pool = require("../config/database");
const { enviarCorreo } = require("../services/emailService");
const {
    normalizarTexto,
    tieneLongitudValida,
    correoValido,
    telefonoValido,
    enteroEnRango,
    idValido,
    contieneCaracteresControl
} = require("../utils/validation");

function fechaValida(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }

    const [anio, mes, dia] =
        fecha.split("-").map(Number);

    const fechaObjeto =
        new Date(Date.UTC(anio, mes - 1, dia));

    return (
        fechaObjeto.getUTCFullYear() === anio &&
        fechaObjeto.getUTCMonth() === mes - 1 &&
        fechaObjeto.getUTCDate() === dia
    );
}

function horaValida(hora) {
    if (
        typeof hora !== "string" ||
        !/^\d{2}:\d{2}(:\d{2})?$/.test(hora)
    ) {
        return false;
    }

    const [horas, minutos, segundos = "00"] =
        hora.split(":").map(Number);

    return (
        horas >= 0 &&
        horas <= 23 &&
        minutos >= 0 &&
        minutos <= 59 &&
        segundos >= 0 &&
        segundos <= 59
    );
}

function estadoBooleanoValido(valor) {
    return [
        true,
        false,
        1,
        0,
        "1",
        "0",
        "true",
        "false"
    ].includes(valor);
}

function convertirEstadoBooleano(valor) {
    return (
        valor === true ||
        valor === 1 ||
        valor === "1" ||
        valor === "true"
    )
        ? 1
        : 0;
}

function estadoEstaActivo(valor) {
    return (
        valor === true ||
        valor === 1 ||
        valor === "1" ||
        valor === "true"
    );
}

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
             AND cupos_disponibles > 0
             AND COALESCE(
                    TIMESTAMP(fecha, hora_fin),
                    DATE_ADD(fecha, INTERVAL 1 DAY)
                 ) > NOW()
             ORDER BY fecha ASC, hora_inicio ASC`
        );

        res.json(actividades);
    } catch (error) {
        console.error(
            "Error al listar actividades:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al obtener las actividades."
        });
    }
}

async function crearActividad(req, res) {
    try {
        const titulo =
            normalizarTexto(req.body.titulo);

        const descripcion =
            normalizarTexto(req.body.descripcion);

        const fecha =
            normalizarTexto(req.body.fecha);

        const horaInicio =
            normalizarTexto(req.body.horaInicio);

        const horaFin =
            normalizarTexto(req.body.horaFin);

        const { cuposDisponibles } =
            req.body;

        if (
            !titulo ||
            !descripcion ||
            !fecha ||
            cuposDisponibles === undefined
        ) {
            return res.status(400).json({
                mensaje:
                    "Título, descripción, fecha y cupos son obligatorios."
            });
        }

        if (
            contieneCaracteresControl(titulo) ||
            contieneCaracteresControl(descripcion)
        ) {
            return res.status(400).json({
                mensaje:
                    "Uno o más campos contienen caracteres no permitidos."
            });
        }

        if (
            !tieneLongitudValida(
                titulo,
                3,
                150
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "El título debe contener entre 3 y 150 caracteres."
            });
        }

        if (
            !tieneLongitudValida(
                descripcion,
                10,
                2000
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "La descripción debe contener entre 10 y 2000 caracteres."
            });
        }

        if (!fechaValida(fecha)) {
            return res.status(400).json({
                mensaje:
                    "La fecha no tiene un formato válido."
            });
        }

        const tieneHoraInicio =
            Boolean(horaInicio);

        const tieneHoraFin =
            Boolean(horaFin);

        if (tieneHoraInicio !== tieneHoraFin) {
            return res.status(400).json({
                mensaje:
                    "Si colocas un horario, debes indicar tanto la hora de inicio como la hora de finalización."
            });
        }

        if (
            tieneHoraInicio &&
            (
                !horaValida(horaInicio) ||
                !horaValida(horaFin)
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "El horario no tiene un formato válido."
            });
        }

        if (
            tieneHoraInicio &&
            horaInicio >= horaFin
        ) {
            return res.status(400).json({
                mensaje:
                    "La hora de finalización debe ser posterior a la hora de inicio."
            });
        }

        if (
            !enteroEnRango(
                cuposDisponibles,
                1,
                1000
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "Los cupos deben ser un número entero entre 1 y 1000."
            });
        }

        const horaFinNormalizada =
            horaFin || null;

        const [validacionFecha] =
            await pool.execute(
                `SELECT
                    COALESCE(
                        TIMESTAMP(?, ?),
                        DATE_ADD(?, INTERVAL 1 DAY)
                    ) <= NOW() AS vencida`,
                [
                    fecha,
                    horaFinNormalizada,
                    fecha
                ]
            );

        if (validacionFecha[0]?.vencida) {
            return res.status(400).json({
                mensaje:
                    "No se puede crear una actividad cuya fecha u hora de finalización ya hayan pasado."
            });
        }

        const [resultado] =
            await pool.execute(
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
                    horaFinNormalizada,
                    Number(cuposDisponibles)
                ]
            );

        res.status(201).json({
            mensaje:
                "Actividad de voluntariado creada correctamente.",
            idActividad:
                resultado.insertId
        });
    } catch (error) {
        console.error(
            "Error al crear actividad:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al crear la actividad."
        });
    }
}

async function actualizarActividad(req, res) {
    try {
        const id =
            Number(req.params.id);

        const titulo =
            normalizarTexto(req.body.titulo);

        const descripcion =
            normalizarTexto(req.body.descripcion);

        const fecha =
            normalizarTexto(req.body.fecha);

        const horaInicio =
            normalizarTexto(req.body.horaInicio);

        const horaFin =
            normalizarTexto(req.body.horaFin);

        const {
            cuposDisponibles,
            estado
        } = req.body;

        if (!idValido(id)) {
            return res.status(400).json({
                mensaje:
                    "El identificador de la actividad no es válido."
            });
        }

        if (
            !titulo ||
            !descripcion ||
            !fecha ||
            cuposDisponibles === undefined ||
            estado === undefined
        ) {
            return res.status(400).json({
                mensaje:
                    "Título, descripción, fecha, cupos y estado son obligatorios."
            });
        }

        if (
            contieneCaracteresControl(titulo) ||
            contieneCaracteresControl(descripcion)
        ) {
            return res.status(400).json({
                mensaje:
                    "Uno o más campos contienen caracteres no permitidos."
            });
        }

        if (
            !tieneLongitudValida(
                titulo,
                3,
                150
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "El título debe contener entre 3 y 150 caracteres."
            });
        }

        if (
            !tieneLongitudValida(
                descripcion,
                10,
                2000
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "La descripción debe contener entre 10 y 2000 caracteres."
            });
        }

        if (!fechaValida(fecha)) {
            return res.status(400).json({
                mensaje:
                    "La fecha no tiene un formato válido."
            });
        }

        const tieneHoraInicio =
            Boolean(horaInicio);

        const tieneHoraFin =
            Boolean(horaFin);

        if (tieneHoraInicio !== tieneHoraFin) {
            return res.status(400).json({
                mensaje:
                    "Si colocas un horario, debes indicar tanto la hora de inicio como la hora de finalización."
            });
        }

        if (
            tieneHoraInicio &&
            (
                !horaValida(horaInicio) ||
                !horaValida(horaFin)
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "El horario no tiene un formato válido."
            });
        }

        if (
            tieneHoraInicio &&
            horaInicio >= horaFin
        ) {
            return res.status(400).json({
                mensaje:
                    "La hora de finalización debe ser posterior a la hora de inicio."
            });
        }

        if (
            !enteroEnRango(
                cuposDisponibles,
                0,
                1000
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "Los cupos deben ser un número entero entre 0 y 1000."
            });
        }

        if (!estadoBooleanoValido(estado)) {
            return res.status(400).json({
                mensaje:
                    "El estado de la actividad no es válido."
            });
        }

        const estadoNormalizado =
            convertirEstadoBooleano(estado);

        const horaFinNormalizada =
            horaFin || null;

        if (estadoNormalizado === 1) {
            const [validacionFecha] =
                await pool.execute(
                    `SELECT
                        COALESCE(
                            TIMESTAMP(?, ?),
                            DATE_ADD(?, INTERVAL 1 DAY)
                        ) <= NOW() AS vencida`,
                    [
                        fecha,
                        horaFinNormalizada,
                        fecha
                    ]
                );

            if (validacionFecha[0]?.vencida) {
                return res.status(400).json({
                    mensaje:
                        "No se puede mantener activa una actividad cuya fecha u hora de finalización ya hayan vencido."
                });
            }
        }

        const [resultado] =
            await pool.execute(
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
                    horaFinNormalizada,
                    Number(cuposDisponibles),
                    estadoNormalizado,
                    id
                ]
            );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje:
                    "Actividad no encontrada."
            });
        }

        res.json({
            mensaje:
                "Actividad actualizada correctamente."
        });
    } catch (error) {
        console.error(
            "Error al actualizar actividad:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al actualizar la actividad."
        });
    }
}

async function crearSolicitudVoluntariado(req, res) {
    try {
        const nombreVoluntario =
            normalizarTexto(
                req.body.nombreVoluntario
            );

        const correoVoluntario =
            normalizarTexto(
                req.body.correoVoluntario
            ).toLowerCase();

        const telefono =
            normalizarTexto(
                req.body.telefono
            );

        const observaciones =
            normalizarTexto(
                req.body.observaciones
            );

        const { idActividad } =
            req.body;

        if (
            !nombreVoluntario ||
            !correoVoluntario ||
            !telefono ||
            idActividad === undefined
        ) {
            return res.status(400).json({
                mensaje:
                    "Nombre, correo, teléfono y actividad son obligatorios."
            });
        }

        if (
            contieneCaracteresControl(
                nombreVoluntario
            ) ||
            contieneCaracteresControl(
                correoVoluntario
            ) ||
            contieneCaracteresControl(
                telefono
            ) ||
            (
                observaciones &&
                contieneCaracteresControl(
                    observaciones
                )
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "Uno o más campos contienen caracteres no permitidos."
            });
        }

        if (
            !tieneLongitudValida(
                nombreVoluntario,
                2,
                100
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "El nombre debe contener entre 2 y 100 caracteres."
            });
        }

        if (!correoValido(correoVoluntario)) {
            return res.status(400).json({
                mensaje:
                    "El correo electrónico no tiene un formato válido."
            });
        }

        if (!telefonoValido(telefono)) {
            return res.status(400).json({
                mensaje:
                    "El teléfono debe contener entre 8 y 30 caracteres y solo puede incluir números, espacios, +, -, paréntesis."
            });
        }

        if (
            observaciones &&
            !tieneLongitudValida(
                observaciones,
                1,
                1000
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "Las observaciones no pueden superar los 1000 caracteres."
            });
        }

        if (!idValido(idActividad)) {
            return res.status(400).json({
                mensaje:
                    "La actividad seleccionada no es válida."
            });
        }

        const idNormalizado =
            Number(idActividad);

        const [actividades] =
            await pool.execute(
                `SELECT
                    id_actividad,
                    cupos_disponibles,
                    estado,
                    fecha,
                    hora_inicio,
                    hora_fin,
                    COALESCE(
                        TIMESTAMP(fecha, hora_fin),
                        DATE_ADD(fecha, INTERVAL 1 DAY)
                    ) <= NOW() AS vencida
                 FROM actividad_voluntariado
                 WHERE id_actividad = ?
                 LIMIT 1`,
                [idNormalizado]
            );

        if (actividades.length === 0) {
            return res.status(404).json({
                mensaje:
                    "La actividad seleccionada no existe."
            });
        }

        const actividad =
            actividades[0];

        if (!actividad.estado) {
            return res.status(400).json({
                mensaje:
                    "La actividad seleccionada no está disponible."
            });
        }

        if (actividad.vencida) {
            return res.status(400).json({
                mensaje:
                    "La actividad seleccionada ya venció. Selecciona otra actividad disponible."
            });
        }

        if (
            Number(
                actividad.cupos_disponibles
            ) <= 0
        ) {
            return res.status(400).json({
                mensaje:
                    "La actividad ya no tiene cupos disponibles."
            });
        }

        const [resultado] =
            await pool.execute(
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
                    telefono,
                    observaciones || null,
                    idNormalizado
                ]
            );

        res.status(201).json({
            mensaje:
                "Solicitud de voluntariado enviada correctamente. Queda pendiente de aprobación. Nos comunicaremos contigo por correo electrónico o llamada telefónica para confirmar tu voluntariado.",
            idSolicitud:
                resultado.insertId
        });
    } catch (error) {
        console.error(
            "Error al crear solicitud de voluntariado:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al enviar la solicitud."
        });
    }
}

async function listarSolicitudesVoluntariado(req, res) {
    try {
        const [solicitudes] =
            await pool.execute(
                `SELECT
                    sv.id_solicitud,
                    sv.nombre_voluntario,
                    sv.correo_voluntario,
                    sv.telefono,
                    sv.observaciones,
                    sv.estado,
                    sv.fecha_solicitud,
                    av.titulo AS actividad,
                    av.fecha,
                    av.hora_inicio,
                    av.hora_fin,
                    CASE
                        WHEN COALESCE(
                            TIMESTAMP(
                                av.fecha,
                                av.hora_fin
                            ),
                            DATE_ADD(
                                av.fecha,
                                INTERVAL 1 DAY
                            )
                        ) <= NOW()
                        THEN TRUE
                        ELSE FALSE
                    END AS vencida
                 FROM solicitud_voluntariado sv
                 INNER JOIN actividad_voluntariado av
                    ON sv.id_actividad =
                       av.id_actividad
                 ORDER BY sv.fecha_solicitud DESC`
            );

        res.json(solicitudes);
    } catch (error) {
        console.error(
            "Error al listar solicitudes de voluntariado:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al obtener las solicitudes."
        });
    }
}

async function actualizarEstadoSolicitud(req, res) {
    const id =
        Number(req.params.id);

    const estado =
        normalizarTexto(
            req.body.estado
        );

    const estadosPermitidos = [
        "Pendiente",
        "Aprobada",
        "Rechazada",
        "Cancelada"
    ];

    if (!idValido(id)) {
        return res.status(400).json({
            mensaje:
                "El identificador de la solicitud no es válido."
        });
    }

    if (
        !estadosPermitidos.includes(
            estado
        )
    ) {
        return res.status(400).json({
            mensaje:
                "Estado de solicitud no válido."
        });
    }

    let conexion;

    try {
        conexion =
            await pool.getConnection();

        await conexion.beginTransaction();

        const [solicitudes] =
            await conexion.execute(
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
                mensaje:
                    "Solicitud de voluntariado no encontrada."
            });
        }

        const solicitud =
            solicitudes[0];

        if (
            solicitud.estado === estado
        ) {
            await conexion.rollback();

            return res.status(400).json({
                mensaje:
                    `La solicitud ya se encuentra en estado ${estado}.`
            });
        }

        if (
            estado === "Aprobada" &&
            solicitud.estado !== "Aprobada"
        ) {
            const [actividades] =
                await conexion.execute(
                    `SELECT
                        cupos_disponibles,
                        estado,
                        fecha,
                        hora_inicio,
                        hora_fin,
                        COALESCE(
                            TIMESTAMP(
                                fecha,
                                hora_fin
                            ),
                            DATE_ADD(
                                fecha,
                                INTERVAL 1 DAY
                            )
                        ) <= NOW() AS vencida
                     FROM actividad_voluntariado
                     WHERE id_actividad = ?
                     FOR UPDATE`,
                    [
                        solicitud.id_actividad
                    ]
                );

            if (
                actividades.length === 0
            ) {
                await conexion.rollback();

                return res.status(404).json({
                    mensaje:
                        "Actividad no encontrada."
                });
            }

            const actividad =
                actividades[0];

            if (!actividad.estado) {
                await conexion.rollback();

                return res.status(400).json({
                    mensaje:
                        "No se puede aprobar la solicitud porque la actividad ya no está activa."
                });
            }

            if (actividad.vencida) {
                await conexion.rollback();

                return res.status(400).json({
                    mensaje:
                        "No se puede aprobar esta solicitud porque la actividad de voluntariado ya venció."
                });
            }

            if (
                Number(
                    actividad.cupos_disponibles
                ) <= 0
            ) {
                await conexion.rollback();

                return res.status(400).json({
                    mensaje:
                        "No existen cupos disponibles para aprobar esta solicitud."
                });
            }

            await conexion.execute(
                `UPDATE actividad_voluntariado
                 SET cupos_disponibles =
                     cupos_disponibles - 1
                 WHERE id_actividad = ?`,
                [
                    solicitud.id_actividad
                ]
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
                [
                    solicitud.id_actividad
                ]
            );
        }

        await conexion.execute(
            `UPDATE solicitud_voluntariado
             SET estado = ?
             WHERE id_solicitud = ?`,
            [
                estado,
                id
            ]
        );

        await conexion.commit();

        let correoEnviado = false;

        try {
            const [datosSolicitud] =
                await conexion.execute(
                    `SELECT
                        sv.nombre_voluntario,
                        sv.correo_voluntario,
                        sv.telefono,
                        sv.observaciones,
                        sv.estado,

                        av.titulo AS actividad,

                        DATE_FORMAT(
                            av.fecha,
                            '%d/%m/%Y'
                        ) AS fecha_actividad,

                        TIME_FORMAT(
                            av.hora_inicio,
                            '%H:%i'
                        ) AS hora_inicio,

                        TIME_FORMAT(
                            av.hora_fin,
                            '%H:%i'
                        ) AS hora_fin

                     FROM solicitud_voluntariado sv

                     INNER JOIN actividad_voluntariado av
                        ON av.id_actividad =
                           sv.id_actividad

                     WHERE sv.id_solicitud = ?
                     LIMIT 1`,
                    [id]
                );

            const datos =
                datosSolicitud[0];

            if (
                datos &&
                datos.correo_voluntario
            ) {
                let asunto = "";
                let textoCorreo = "";

                if (
                    estado === "Aprobada"
                ) {
                    asunto =
                        "Solicitud de voluntariado aprobada";

                    textoCorreo =
`Hola ${datos.nombre_voluntario},

Tu solicitud de voluntariado ha sido aprobada.

Actividad: ${datos.actividad}
Fecha: ${datos.fecha_actividad}
Horario: ${datos.hora_inicio || "Por confirmar"}${datos.hora_fin ? ` - ${datos.hora_fin}` : ""}

Gracias por ofrecer tu tiempo y apoyo a nuestros adultos mayores.

Si es necesario, personal del hogar podrá comunicarse contigo por teléfono.

Mesón Buen Samaritano`;
                } else if (
                    estado === "Rechazada"
                ) {
                    asunto =
                        "Actualización de solicitud de voluntariado";

                    textoCorreo =
`Hola ${datos.nombre_voluntario},

Te informamos que tu solicitud para participar en la actividad "${datos.actividad}" no pudo ser aprobada.

Puedes consultar otras actividades disponibles y enviar una nueva solicitud.

Gracias por tu interés en apoyar al Mesón Buen Samaritano.`;
                } else if (
                    estado === "Cancelada"
                ) {
                    asunto =
                        "Participación de voluntariado cancelada";

                    textoCorreo =
`Hola ${datos.nombre_voluntario},

Te informamos que tu participación en la actividad "${datos.actividad}" ha sido cancelada.

Fecha: ${datos.fecha_actividad}

Si deseas participar en otra actividad, puedes consultar nuevamente las opciones disponibles.

Mesón Buen Samaritano`;
                }

                if (
                    asunto &&
                    textoCorreo
                ) {
                    console.log(
                        "Intentando enviar correo de voluntariado a:",
                        datos.correo_voluntario
                    );

                    await enviarCorreo({
                        para:
                            datos.correo_voluntario,
                        asunto,
                        texto:
                            textoCorreo
                    });

                    correoEnviado = true;

                    console.log(
                        "Correo de voluntariado enviado correctamente a:",
                        datos.correo_voluntario
                    );
                }
            }
        } catch (errorCorreo) {
            console.error(
                "ERROR AL ENVIAR CORREO DE VOLUNTARIADO:"
            );

            console.error(
                errorCorreo
            );
        }

        return res.json({
            mensaje:
                correoEnviado
                    ? `Solicitud ${estado.toLowerCase()} correctamente. Se envió una notificación por correo electrónico.`
                    : `Solicitud ${estado.toLowerCase()} correctamente, pero no fue posible enviar la notificación por correo electrónico.`,

            correoEnviado
        });
    } catch (error) {
        if (conexion) {
            try {
                await conexion.rollback();
            } catch (errorRollback) {
                console.error(
                    "Error al revertir la transacción:",
                    errorRollback.message
                );
            }
        }

        console.error(
            "Error al actualizar solicitud de voluntariado:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al actualizar la solicitud."
        });
    } finally {
        if (conexion) {
            conexion.release();
        }
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