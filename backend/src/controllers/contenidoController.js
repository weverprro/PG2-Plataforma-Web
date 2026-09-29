const pool = require("../config/database");


const tiposPermitidos = [
    "QuienesSomos",
    "Historia",
    "Mision",
    "Vision",
    "Valores",
    "ComoAyudar",
    "Visitas",
    "Voluntariado",
    "Donaciones",
    "Contacto"
];


/*
=========================================
PUBLICO
=========================================
*/

async function listarContenidos(req, res) {

    try {

        const [contenidos] = await pool.execute(
            `SELECT
                id_contenido,
                titulo,
                contenido,
                tipo_contenido,
                imagen_url,
                orden,
                fecha_publicacion,
                fecha_actualizacion

             FROM contenido_institucional

             WHERE estado = TRUE

             ORDER BY
                tipo_contenido,
                orden,
                id_contenido`
        );

        res.json(contenidos);

    } catch (error) {

        console.error(
            "Error al listar contenidos:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al obtener el contenido institucional."
        });
    }
}


async function obtenerContenidoPorId(req, res) {

    try {

        const { id } = req.params;

        const [contenidos] = await pool.execute(
            `SELECT
                id_contenido,
                titulo,
                contenido,
                tipo_contenido,
                imagen_url,
                orden,
                fecha_publicacion,
                fecha_actualizacion

             FROM contenido_institucional

             WHERE id_contenido = ?
             AND estado = TRUE

             LIMIT 1`,
            [id]
        );

        if (contenidos.length === 0) {

            return res.status(404).json({
                mensaje:
                    "Contenido no encontrado."
            });
        }

        res.json(contenidos[0]);

    } catch (error) {

        console.error(
            "Error al obtener contenido:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al obtener el contenido."
        });
    }
}


async function obtenerContenidoPorTipo(
    req,
    res
) {

    try {

        const { tipo } = req.params;

        if (!tiposPermitidos.includes(tipo)) {

            return res.status(400).json({
                mensaje:
                    "El tipo de contenido no es válido."
            });
        }

        const [contenidos] = await pool.execute(
            `SELECT
                id_contenido,
                titulo,
                contenido,
                tipo_contenido,
                imagen_url,
                orden,
                fecha_publicacion,
                fecha_actualizacion

             FROM contenido_institucional

             WHERE tipo_contenido = ?
             AND estado = TRUE

             ORDER BY
                orden,
                id_contenido`,
            [tipo]
        );

        res.json(contenidos);

    } catch (error) {

        console.error(
            "Error al obtener contenido por tipo:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al obtener el contenido."
        });
    }
}


/*
=========================================
ADMINISTRADOR
=========================================
*/

async function listarContenidosAdmin(
    req,
    res
) {

    try {

        const [contenidos] = await pool.execute(
            `SELECT
                ci.id_contenido,
                ci.titulo,
                ci.contenido,
                ci.tipo_contenido,
                ci.imagen_url,
                ci.estado,
                ci.orden,
                ci.fecha_publicacion,
                ci.fecha_actualizacion,

                ua.nombre AS autor

             FROM contenido_institucional ci

             LEFT JOIN usuario_administrativo ua
                ON ci.id_usuario = ua.id_usuario

             ORDER BY
                ci.tipo_contenido,
                ci.orden,
                ci.id_contenido`
        );

        res.json(contenidos);

    } catch (error) {

        console.error(
            "Error al listar contenido administrativo:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al obtener el contenido."
        });
    }
}


async function crearContenido(req, res) {

    try {

        const {
            titulo,
            contenido,
            tipoContenido,
            imagenUrl = null,
            orden = 1
        } = req.body;


        if (
            !titulo ||
            !contenido ||
            !tipoContenido
        ) {

            return res.status(400).json({
                mensaje:
                    "Título, contenido y tipo son obligatorios."
            });
        }


        if (
            !tiposPermitidos.includes(
                tipoContenido
            )
        ) {

            return res.status(400).json({
                mensaje:
                    "El tipo de contenido no es válido."
            });
        }


        const ordenNumerico = Number(orden);

        if (
            !Number.isInteger(ordenNumerico) ||
            ordenNumerico < 1
        ) {

            return res.status(400).json({
                mensaje:
                    "El orden debe ser un número entero mayor que cero."
            });
        }


        const [resultado] = await pool.execute(
            `INSERT INTO contenido_institucional
            (
                titulo,
                contenido,
                tipo_contenido,
                imagen_url,
                estado,
                orden,
                id_usuario
            )
            VALUES (?, ?, ?, ?, TRUE, ?, ?)`,
            [
                titulo,
                contenido,
                tipoContenido,
                imagenUrl || null,
                ordenNumerico,
                req.usuario.idUsuario
            ]
        );


        res.status(201).json({
            mensaje:
                "Contenido institucional creado correctamente.",

            idContenido:
                resultado.insertId
        });

    } catch (error) {

        console.error(
            "Error al crear contenido:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al crear el contenido."
        });
    }
}


async function actualizarContenido(
    req,
    res
) {

    try {

        const { id } = req.params;

        const {
            titulo,
            contenido,
            tipoContenido,
            imagenUrl = null,
            orden = 1
        } = req.body;


        if (
            !titulo ||
            !contenido ||
            !tipoContenido
        ) {

            return res.status(400).json({
                mensaje:
                    "Título, contenido y tipo son obligatorios."
            });
        }


        if (
            !tiposPermitidos.includes(
                tipoContenido
            )
        ) {

            return res.status(400).json({
                mensaje:
                    "El tipo de contenido no es válido."
            });
        }


        const ordenNumerico = Number(orden);

        if (
            !Number.isInteger(ordenNumerico) ||
            ordenNumerico < 1
        ) {

            return res.status(400).json({
                mensaje:
                    "El orden debe ser un número entero mayor que cero."
            });
        }


        const [resultado] = await pool.execute(
            `UPDATE contenido_institucional

             SET
                titulo = ?,
                contenido = ?,
                tipo_contenido = ?,
                imagen_url = ?,
                orden = ?,
                fecha_actualizacion =
                    CURRENT_TIMESTAMP,
                id_usuario = ?

             WHERE id_contenido = ?`,
            [
                titulo,
                contenido,
                tipoContenido,
                imagenUrl || null,
                ordenNumerico,
                req.usuario.idUsuario,
                id
            ]
        );


        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                mensaje:
                    "Contenido no encontrado."
            });
        }


        res.json({
            mensaje:
                "Contenido actualizado correctamente."
        });

    } catch (error) {

        console.error(
            "Error al actualizar contenido:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al actualizar el contenido."
        });
    }
}


async function cambiarEstadoContenido(
    req,
    res
) {

    try {

        const { id } = req.params;
        const { estado } = req.body;


        if (typeof estado !== "boolean") {

            return res.status(400).json({
                mensaje:
                    "El estado debe ser true o false."
            });
        }


        const [resultado] = await pool.execute(
            `UPDATE contenido_institucional

             SET
                estado = ?,
                fecha_actualizacion =
                    CURRENT_TIMESTAMP

             WHERE id_contenido = ?`,
            [
                estado,
                id
            ]
        );


        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                mensaje:
                    "Contenido no encontrado."
            });
        }


        res.json({
            mensaje: estado
                ? "Contenido activado correctamente."
                : "Contenido desactivado correctamente."
        });

    } catch (error) {

        console.error(
            "Error al cambiar estado:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al cambiar el estado."
        });
    }
}


async function eliminarContenido(req, res) {

    try {

        const { id } = req.params;

        /*
         * Eliminación lógica.
         */
        const [resultado] = await pool.execute(
            `UPDATE contenido_institucional

             SET
                estado = FALSE,
                fecha_actualizacion =
                    CURRENT_TIMESTAMP

             WHERE id_contenido = ?`,
            [id]
        );


        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                mensaje:
                    "Contenido no encontrado."
            });
        }


        res.json({
            mensaje:
                "Contenido eliminado correctamente."
        });

    } catch (error) {

        console.error(
            "Error al eliminar contenido:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al eliminar el contenido."
        });
    }
}


module.exports = {
    listarContenidos,
    obtenerContenidoPorId,
    obtenerContenidoPorTipo,
    listarContenidosAdmin,
    crearContenido,
    actualizarContenido,
    cambiarEstadoContenido,
    eliminarContenido
};