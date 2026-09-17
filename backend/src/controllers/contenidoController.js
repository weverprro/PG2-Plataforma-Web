const pool = require("../config/database");

async function listarContenidos(req, res) {
    try {
        const [contenidos] = await pool.execute(
            `SELECT
                ci.id_contenido,
                ci.titulo,
                ci.contenido,
                ci.tipo_contenido,
                ci.imagen_url,
                ci.estado,
                ci.fecha_publicacion,
                ci.fecha_actualizacion,
                ua.nombre AS autor
             FROM contenido_institucional ci
             LEFT JOIN usuario_administrativo ua
                ON ci.id_usuario = ua.id_usuario
             WHERE ci.estado = TRUE
             ORDER BY ci.fecha_publicacion DESC`
        );

        res.json(contenidos);

    } catch (error) {
        console.error(
            "Error al listar contenidos:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al obtener los contenidos."
        });
    }
}

async function obtenerContenido(req, res) {
    try {
        const { id } = req.params;

        const [contenidos] = await pool.execute(
            `SELECT
                ci.id_contenido,
                ci.titulo,
                ci.contenido,
                ci.tipo_contenido,
                ci.imagen_url,
                ci.estado,
                ci.fecha_publicacion,
                ci.fecha_actualizacion,
                ua.nombre AS autor
             FROM contenido_institucional ci
             LEFT JOIN usuario_administrativo ua
                ON ci.id_usuario = ua.id_usuario
             WHERE ci.id_contenido = ?
             AND ci.estado = TRUE`,
            [id]
        );

        if (contenidos.length === 0) {
            return res.status(404).json({
                mensaje: "Contenido no encontrado."
            });
        }

        res.json(contenidos[0]);

    } catch (error) {
        console.error(
            "Error al obtener contenido:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al obtener el contenido."
        });
    }
}

async function crearContenido(req, res) {
    try {
        const {
            titulo,
            contenido,
            tipoContenido,
            imagenUrl
        } = req.body;

        if (!titulo || !contenido || !tipoContenido) {
            return res.status(400).json({
                mensaje: "Título, contenido y tipo de contenido son obligatorios."
            });
        }

        const [resultado] = await pool.execute(
            `INSERT INTO contenido_institucional
            (
                titulo,
                contenido,
                tipo_contenido,
                imagen_url,
                id_usuario
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                titulo,
                contenido,
                tipoContenido,
                imagenUrl || null,
                req.usuario.idUsuario
            ]
        );

        res.status(201).json({
            mensaje: "Contenido creado correctamente.",
            idContenido: resultado.insertId
        });

    } catch (error) {
        console.error(
            "Error al crear contenido:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al crear el contenido."
        });
    }
}

async function actualizarContenido(req, res) {
    try {
        const { id } = req.params;

        const {
            titulo,
            contenido,
            tipoContenido,
            imagenUrl
        } = req.body;

        const [resultado] = await pool.execute(
            `UPDATE contenido_institucional
             SET titulo = ?,
                 contenido = ?,
                 tipo_contenido = ?,
                 imagen_url = ?,
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id_contenido = ?`,
            [
                titulo,
                contenido,
                tipoContenido,
                imagenUrl || null,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Contenido no encontrado."
            });
        }

        res.json({
            mensaje: "Contenido actualizado correctamente."
        });

    } catch (error) {
        console.error(
            "Error al actualizar contenido:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al actualizar el contenido."
        });
    }
}

async function eliminarContenido(req, res) {
    try {
        const { id } = req.params;

        const [resultado] = await pool.execute(
            `UPDATE contenido_institucional
             SET estado = FALSE,
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id_contenido = ?`,
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Contenido no encontrado."
            });
        }

        res.json({
            mensaje: "Contenido desactivado correctamente."
        });

    } catch (error) {
        console.error(
            "Error al eliminar contenido:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al eliminar el contenido."
        });
    }
}

module.exports = {
    listarContenidos,
    obtenerContenido,
    crearContenido,
    actualizarContenido,
    eliminarContenido
};