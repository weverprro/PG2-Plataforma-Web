const pool = require("../config/database");

const tiposPermitidos = [
    "Necesidad",
    "Actividad",
    "Noticia",
    "Agradecimiento",
    "Campaña",
    "General"
];
const modosVideoPermitidos = [
    "Integrado",
    "Enlace"
];

const formatosVideoPermitidos = [
    "Horizontal",
    "Vertical",
    "Cuadrado"
];

async function agregarImagenes(
    conexion,
    idPublicacion,
    imagenes
) {
    if (!Array.isArray(imagenes)) {
        return;
    }

    for (let i = 0; i < imagenes.length; i++) {

        const imagen = imagenes[i];

        let url;
        let textoAlternativo = null;

        if (typeof imagen === "string") {
            url = imagen;
        } else {
            url = imagen.url;
            textoAlternativo =
                imagen.textoAlternativo || null;
        }

        if (!url) {
            continue;
        }

        await conexion.execute(
            `INSERT INTO publicacion_imagen
            (
                imagen_url,
                texto_alternativo,
                orden,
                id_publicacion
            )
            VALUES (?, ?, ?, ?)`,
            [
                url,
                textoAlternativo,
                i + 1,
                idPublicacion
            ]
        );
    }
}


async function obtenerImagenesPublicaciones(
    publicaciones
) {
    if (publicaciones.length === 0) {
        return publicaciones;
    }

    const ids = publicaciones.map(
        publicacion => publicacion.id_publicacion
    );

    const placeholders =
        ids.map(() => "?").join(",");

    const [imagenes] = await pool.execute(
        `SELECT
            id_imagen,
            imagen_url,
            texto_alternativo,
            orden,
            id_publicacion
         FROM publicacion_imagen
         WHERE id_publicacion IN (${placeholders})
         ORDER BY id_publicacion, orden`,
        ids
    );

    return publicaciones.map(publicacion => ({
        ...publicacion,

        imagenes: imagenes.filter(
            imagen =>
                imagen.id_publicacion ===
                publicacion.id_publicacion
        )
    }));
}


/*
=========================================
PUBLICO
=========================================
*/

async function listarPublicaciones(req, res) {
    try {

        const {
            tipo,
            destacadas
        } = req.query;

        let consulta = `
            SELECT
                p.id_publicacion,
                p.titulo,
                p.contenido,
                p.tipo_publicacion,
                p.video_url,
                p.video_modo,
                p.video_formato,
                p.destacada,
                p.fecha_publicacion,
                p.fecha_expiracion,

                p.id_necesidad,

                n.titulo AS necesidad_titulo,
                n.prioridad AS necesidad_prioridad,

                ua.nombre AS autor

            FROM publicacion p

            INNER JOIN usuario_administrativo ua
                ON p.id_usuario = ua.id_usuario

            LEFT JOIN necesidad n
                ON p.id_necesidad = n.id_necesidad

            WHERE p.estado = TRUE

            AND (
                p.fecha_expiracion IS NULL
                OR p.fecha_expiracion > NOW()
            )
        `;

        const parametros = [];

        if (tipo) {
            consulta += `
                AND p.tipo_publicacion = ?
            `;

            parametros.push(tipo);
        }

        if (destacadas === "true") {
            consulta += `
                AND p.destacada = TRUE
            `;
        }

        consulta += `
            ORDER BY p.fecha_publicacion DESC
        `;

        const [publicaciones] =
            await pool.execute(
                consulta,
                parametros
            );

        const resultado =
            await obtenerImagenesPublicaciones(
                publicaciones
            );

        res.json(resultado);

    } catch (error) {

        console.error(
            "Error al listar publicaciones:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al obtener las publicaciones."
        });
    }
}


async function obtenerPublicacion(req, res) {
    try {

        const { id } = req.params;

        const [publicaciones] =
            await pool.execute(
                `SELECT
                    p.id_publicacion,
                    p.titulo,
                    p.contenido,
                    p.tipo_publicacion,
                    p.video_url,
                    p.video_modo,
                    p.video_formato,
                    p.destacada,
                    p.fecha_publicacion,
                    p.fecha_expiracion,

                    p.id_necesidad,

                    n.titulo AS necesidad_titulo,
                    n.descripcion AS necesidad_descripcion,
                    n.prioridad AS necesidad_prioridad,

                    ua.nombre AS autor

                 FROM publicacion p

                 INNER JOIN usuario_administrativo ua
                    ON p.id_usuario = ua.id_usuario

                 LEFT JOIN necesidad n
                    ON p.id_necesidad = n.id_necesidad

                 WHERE p.id_publicacion = ?

                 AND p.estado = TRUE

                 AND (
                    p.fecha_expiracion IS NULL
                    OR p.fecha_expiracion > NOW()
                 )

                 LIMIT 1`,
                [id]
            );

        if (publicaciones.length === 0) {

            return res.status(404).json({
                mensaje:
                    "Publicación no encontrada."
            });
        }

        const resultado =
            await obtenerImagenesPublicaciones(
                publicaciones
            );

        res.json(resultado[0]);

    } catch (error) {

        console.error(
            "Error al obtener publicación:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al obtener la publicación."
        });
    }
}


/*
=========================================
ADMINISTRACION
=========================================
*/

async function listarPublicacionesAdmin(
    req,
    res
) {
    try {

        const [publicaciones] =
            await pool.execute(
                `SELECT
                    p.id_publicacion,
                    p.titulo,
                    p.contenido,
                    p.tipo_publicacion,
                    p.video_url,
                    p.video_modo,
                    p.video_formato,
                    p.destacada,
                    p.estado,
                    p.fecha_publicacion,
                    p.fecha_expiracion,
                    p.id_necesidad,

                    n.titulo AS necesidad_titulo,

                    ua.nombre AS autor

                 FROM publicacion p

                 INNER JOIN usuario_administrativo ua
                    ON p.id_usuario = ua.id_usuario

                 LEFT JOIN necesidad n
                    ON p.id_necesidad = n.id_necesidad

                 ORDER BY
                    p.fecha_publicacion DESC`
            );

        const resultado =
            await obtenerImagenesPublicaciones(
                publicaciones
            );

        res.json(resultado);

    } catch (error) {

        console.error(
            "Error al listar publicaciones administrativas:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al obtener las publicaciones."
        });
    }
}


async function crearPublicacion(req, res) {

    const conexion =
        await pool.getConnection();

    try {

        const {
            titulo,
            contenido,
            tipoPublicacion = "General",
            videoUrl = null,
            modoVideo = "Integrado",
            formatoVideo = "Horizontal",
            destacada = false,
            fechaExpiracion = null,
            idNecesidad = null,
            imagenes = []
        } = req.body;
        
        if (!titulo || !contenido) {

            return res.status(400).json({
                mensaje:
                    "El título y el contenido son obligatorios."
            });
        }

        if (
            !tiposPermitidos.includes(
                tipoPublicacion
            )
        ) {

            return res.status(400).json({
                mensaje:
                    "El tipo de publicación no es válido."
            });
        }

        if (
            !modosVideoPermitidos.includes(
                modoVideo
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "El modo de visualización del video no es válido."
            });
        }

        if (
            !formatosVideoPermitidos.includes(
                formatoVideo
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "El formato del video no es válido."
            });
        }

        /*
         * Si se relaciona con una necesidad,
         * comprobamos que exista.
         */
        if (idNecesidad) {

            const [necesidades] =
                await conexion.execute(
                    `SELECT id_necesidad
                     FROM necesidad
                     WHERE id_necesidad = ?
                     LIMIT 1`,
                    [idNecesidad]
                );

            if (necesidades.length === 0) {

                return res.status(404).json({
                    mensaje:
                        "La necesidad indicada no existe."
                });
            }
        }

        await conexion.beginTransaction();

        const [resultado] =
            await conexion.execute(
                `INSERT INTO publicacion
                (
                    titulo,
                    contenido,
                    tipo_publicacion,
                    video_url,
                    video_modo,
                    video_formato,
                    destacada,
                    fecha_expiracion,
                    id_usuario,
                    id_necesidad
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    titulo,
                    contenido,
                    tipoPublicacion,
                    videoUrl || null,
                    modoVideo,
                    formatoVideo,
                    destacada ? 1 : 0,
                    fechaExpiracion || null,
                    req.usuario.idUsuario,
                    idNecesidad || null
                ]
            );

        const idPublicacion =
            resultado.insertId;

        await agregarImagenes(
            conexion,
            idPublicacion,
            imagenes
        );

        await conexion.commit();

        res.status(201).json({
            mensaje:
                "Publicación creada correctamente.",
            idPublicacion
        });

    } catch (error) {

        try {
            await conexion.rollback();
        } catch (_) {}

        console.error(
            "Error al crear publicación:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al crear la publicación."
        });

    } finally {

        conexion.release();
    }
}


async function editarPublicacion(req, res) {

    const conexion =
        await pool.getConnection();

    try {

        const { id } = req.params;

        const {
            titulo,
            contenido,
            tipoPublicacion,
            videoUrl = null,
            modoVideo = "Integrado",
            formatoVideo = "Horizontal",
            destacada = false,
            fechaExpiracion = null,
            idNecesidad = null,
            imagenes
        } = req.body;

        if (
            !titulo ||
            !contenido ||
            !tipoPublicacion
        ) {

            return res.status(400).json({
                mensaje:
                    "Título, contenido y tipo son obligatorios."
            });
        }

        if (
            !tiposPermitidos.includes(
                tipoPublicacion
            )
        ) {

            return res.status(400).json({
                mensaje:
                    "El tipo de publicación no es válido."
            });
        }

        if (
            !modosVideoPermitidos.includes(
                modoVideo
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "El modo de visualización del video no es válido."
            });
        }

        if (
            !formatosVideoPermitidos.includes(
                formatoVideo
            )
        ) {
            return res.status(400).json({
                mensaje:
                    "El formato del video no es válido."
            });
        }
                        
        const [existente] =
            await conexion.execute(
                `SELECT id_publicacion
                 FROM publicacion
                 WHERE id_publicacion = ?
                 LIMIT 1`,
                [id]
            );

        if (existente.length === 0) {

            return res.status(404).json({
                mensaje:
                    "Publicación no encontrada."
            });
        }

        if (idNecesidad) {

            const [necesidades] =
                await conexion.execute(
                    `SELECT id_necesidad
                     FROM necesidad
                     WHERE id_necesidad = ?
                     LIMIT 1`,
                    [idNecesidad]
                );

            if (necesidades.length === 0) {

                return res.status(404).json({
                    mensaje:
                        "La necesidad indicada no existe."
                });
            }
        }

        await conexion.beginTransaction();

        await conexion.execute(
            `UPDATE publicacion
             SET
                titulo = ?,
                contenido = ?,
                tipo_publicacion = ?,
                video_url = ?,
                video_modo = ?,
                video_formato = ?,
                destacada = ?,
                fecha_expiracion = ?,
                id_necesidad = ?
             WHERE id_publicacion = ?`,
            [
                titulo,
                contenido,
                tipoPublicacion,
                videoUrl || null,
                modoVideo,
                formatoVideo,
                destacada ? 1 : 0,
                fechaExpiracion || null,
                idNecesidad || null,
                id
            ]
        );

        /*
         * Solamente reemplazamos imágenes
         * cuando el frontend envía "imagenes".
         */
        if (Array.isArray(imagenes)) {

            await conexion.execute(
                `DELETE FROM publicacion_imagen
                 WHERE id_publicacion = ?`,
                [id]
            );

            await agregarImagenes(
                conexion,
                id,
                imagenes
            );
        }

        await conexion.commit();

        res.json({
            mensaje:
                "Publicación actualizada correctamente."
        });

    } catch (error) {

        try {
            await conexion.rollback();
        } catch (_) {}

        console.error(
            "Error al editar publicación:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al actualizar la publicación."
        });

    } finally {

        conexion.release();
    }
}


async function cambiarEstadoPublicacion(
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

        const [resultado] =
            await pool.execute(
                `UPDATE publicacion
                 SET estado = ?
                 WHERE id_publicacion = ?`,
                [
                    estado,
                    id
                ]
            );

        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                mensaje:
                    "Publicación no encontrada."
            });
        }

        res.json({
            mensaje: estado
                ? "Publicación activada correctamente."
                : "Publicación desactivada correctamente."
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


async function eliminarPublicacion(
    req,
    res
) {
    try {

        const { id } = req.params;

        /*
         * Eliminación lógica.
         * No destruimos el historial.
         */
        const [resultado] =
            await pool.execute(
                `UPDATE publicacion
                 SET estado = FALSE
                 WHERE id_publicacion = ?`,
                [id]
            );

        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                mensaje:
                    "Publicación no encontrada."
            });
        }

        res.json({
            mensaje:
                "Publicación eliminada correctamente."
        });

    } catch (error) {

        console.error(
            "Error eliminando publicación:",
            error.message
        );

        res.status(500).json({
            mensaje:
                "Ocurrió un error al eliminar la publicación."
        });
    }
}


module.exports = {
    listarPublicaciones,
    obtenerPublicacion,
    listarPublicacionesAdmin,
    crearPublicacion,
    editarPublicacion,
    cambiarEstadoPublicacion,
    eliminarPublicacion
};