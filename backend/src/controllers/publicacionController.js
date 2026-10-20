const pool = require("../config/database");
const cloudinary = require("../config/cloudinary");

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

const tiposVigenciaPermitidos = [
    "Permanente",
    "Temporal",
    "Programada"
];

function esUrlCloudinary(url) {
    return typeof url === "string" &&
        url.startsWith("https://res.cloudinary.com/");
}

function obtenerUrlImagen(imagen) {
    if (typeof imagen === "string") {
        return imagen;
    }

    return imagen?.url ||
        imagen?.imagen_url ||
        null;
}

function obtenerPublicIdImagen(imagen) {
    if (!imagen || typeof imagen === "string") {
        return null;
    }

    return imagen.publicId ||
        imagen.imagen_public_id ||
        null;
}

function obtenerTextoAlternativo(imagen) {
    if (!imagen || typeof imagen === "string") {
        return null;
    }

    return imagen.textoAlternativo ||
        imagen.texto_alternativo ||
        null;
}

function resolverTipoVigencia(tipoVigencia, fechaExpiracion) {
    if (tipoVigencia) {
        return tiposVigenciaPermitidos.includes(tipoVigencia)
            ? tipoVigencia
            : null;
    }

    return fechaExpiracion
        ? "Programada"
        : "Permanente";
}

async function calcularFechaTemporal(conexion) {
    const [resultado] = await conexion.execute(
        `SELECT DATE_ADD(NOW(), INTERVAL 1 MONTH) AS fecha_expiracion`
    );

    return resultado[0].fecha_expiracion;
}

async function fechaProgramadaEsFutura(conexion, fechaExpiracion) {
    const [resultado] = await conexion.execute(
        `SELECT ? > NOW() AS es_futura`,
        [fechaExpiracion]
    );

    return Boolean(resultado[0].es_futura);
}

async function temporalSigueActiva(conexion, fechaExpiracion) {
    if (!fechaExpiracion) {
        return false;
    }

    const [resultado] = await conexion.execute(
        `SELECT ? > NOW() AS sigue_activa`,
        [fechaExpiracion]
    );

    return Boolean(resultado[0].sigue_activa);
}

async function resolverFechaExpiracion(
    conexion,
    tipoVigencia,
    fechaExpiracion,
    publicacionExistente = null
) {
    if (tipoVigencia === "Permanente") {
        return null;
    }

    if (tipoVigencia === "Programada") {
        if (!fechaExpiracion) {
            const error = new Error(
                "Debes indicar la fecha de expiración de la publicación programada."
            );
            error.tipo = "VALIDACION";
            throw error;
        }

        const esFutura = await fechaProgramadaEsFutura(
            conexion,
            fechaExpiracion
        );

        if (!esFutura) {
            const error = new Error(
                "La fecha de expiración debe ser posterior a la fecha actual."
            );
            error.tipo = "VALIDACION";
            throw error;
        }

        return fechaExpiracion;
    }

    if (tipoVigencia === "Temporal") {
        if (
            publicacionExistente?.tipo_vigencia === "Temporal" &&
            publicacionExistente?.fecha_expiracion
        ) {
            const sigueActiva = await temporalSigueActiva(
                conexion,
                publicacionExistente.fecha_expiracion
            );

            if (sigueActiva) {
                return publicacionExistente.fecha_expiracion;
            }
        }

        return calcularFechaTemporal(conexion);
    }

    return null;
}

async function eliminarImagenCloudinary(publicId) {
    if (!publicId) {
        return false;
    }

    try {
        const resultado = await cloudinary.uploader.destroy(
            publicId,
            {
                resource_type: "image",
                invalidate: true
            }
        );

        if (
            resultado?.result !== "ok" &&
            resultado?.result !== "not found"
        ) {
            console.warn(
                "Cloudinary respondió al eliminar imagen:",
                resultado
            );
        }

        return true;
    } catch (error) {
        console.error(
            "No fue posible eliminar una imagen de Cloudinary:",
            error.message
        );

        return false;
    }
}

async function agregarImagenes(conexion, idPublicacion, imagenes) {
    if (!Array.isArray(imagenes)) {
        return;
    }

    for (let i = 0; i < imagenes.length; i++) {
        const imagen = imagenes[i];
        const url = obtenerUrlImagen(imagen);
        const publicId = obtenerPublicIdImagen(imagen);
        const textoAlternativo = obtenerTextoAlternativo(imagen);

        if (!url) {
            continue;
        }

        if (esUrlCloudinary(url) && !publicId) {
            throw new Error(
                "Una imagen de Cloudinary no contiene su public_id."
            );
        }

        await conexion.execute(
            `INSERT INTO publicacion_imagen
            (
                imagen_url,
                imagen_public_id,
                texto_alternativo,
                orden,
                id_publicacion
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                url,
                publicId,
                textoAlternativo,
                i + 1,
                idPublicacion
            ]
        );
    }
}

async function obtenerImagenesPublicaciones(
    publicaciones,
    incluirPublicId = false
) {
    if (publicaciones.length === 0) {
        return publicaciones;
    }

    const ids = publicaciones.map(
        publicacion => publicacion.id_publicacion
    );

    const placeholders = ids.map(() => "?").join(",");

    const [imagenes] = await pool.execute(
        `SELECT
            id_imagen,
            imagen_url,
            imagen_public_id,
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
        imagenes: imagenes
            .filter(
                imagen =>
                    imagen.id_publicacion ===
                    publicacion.id_publicacion
            )
            .map(imagen => {
                if (incluirPublicId) {
                    return imagen;
                }

                const {
                    imagen_public_id,
                    ...imagenPublica
                } = imagen;

                return imagenPublica;
            })
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
                p.tipo_vigencia,
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

        const [publicaciones] = await pool.execute(
            consulta,
            parametros
        );

        const resultado = await obtenerImagenesPublicaciones(
            publicaciones
        );

        return res.json(resultado);
    } catch (error) {
        console.error(
            "Error al listar publicaciones:",
            error.message
        );

        return res.status(500).json({
            mensaje:
                "Ocurrió un error al obtener las publicaciones."
        });
    }
}

async function obtenerPublicacion(req, res) {
    try {
        const {id} = req.params;

        const [publicaciones] = await pool.execute(
            `SELECT
                p.id_publicacion,
                p.titulo,
                p.contenido,
                p.tipo_publicacion,
                p.video_url,
                p.video_modo,
                p.video_formato,
                p.destacada,
                p.tipo_vigencia,
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
                mensaje: "Publicación no encontrada."
            });
        }

        const resultado = await obtenerImagenesPublicaciones(
            publicaciones
        );

        return res.json(resultado[0]);
    } catch (error) {
        console.error(
            "Error al obtener publicación:",
            error.message
        );

        return res.status(500).json({
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

async function listarPublicacionesAdmin(req, res) {
    try {
        const [publicaciones] = await pool.execute(
            `SELECT
                p.id_publicacion,
                p.titulo,
                p.contenido,
                p.tipo_publicacion,
                p.video_url,
                p.video_modo,
                p.video_formato,
                p.destacada,
                p.tipo_vigencia,
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
             ORDER BY p.fecha_publicacion DESC`
        );

        const resultado = await obtenerImagenesPublicaciones(
            publicaciones,
            true
        );

        return res.json(resultado);
    } catch (error) {
        console.error(
            "Error al listar publicaciones administrativas:",
            error.message
        );

        return res.status(500).json({
            mensaje:
                "Ocurrió un error al obtener las publicaciones."
        });
    }
}

async function crearPublicacion(req, res) {
    const conexion = await pool.getConnection();

    try {
        const {
            titulo,
            contenido,
            tipoPublicacion = "General",
            videoUrl = null,
            modoVideo = "Integrado",
            formatoVideo = "Horizontal",
            destacada = false,
            tipoVigencia,
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

        if (!tiposPermitidos.includes(tipoPublicacion)) {
            return res.status(400).json({
                mensaje:
                    "El tipo de publicación no es válido."
            });
        }

        if (!modosVideoPermitidos.includes(modoVideo)) {
            return res.status(400).json({
                mensaje:
                    "El modo de visualización del video no es válido."
            });
        }

        if (!formatosVideoPermitidos.includes(formatoVideo)) {
            return res.status(400).json({
                mensaje:
                    "El formato del video no es válido."
            });
        }

        const tipoVigenciaFinal = resolverTipoVigencia(
            tipoVigencia,
            fechaExpiracion
        );

        if (!tipoVigenciaFinal) {
            return res.status(400).json({
                mensaje:
                    "El tipo de vigencia no es válido."
            });
        }

        if (idNecesidad) {
            const [necesidades] = await conexion.execute(
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

        let fechaExpiracionFinal;

        try {
            fechaExpiracionFinal = await resolverFechaExpiracion(
                conexion,
                tipoVigenciaFinal,
                fechaExpiracion
            );
        } catch (error) {
            if (error.tipo === "VALIDACION") {
                return res.status(400).json({
                    mensaje: error.message
                });
            }

            throw error;
        }

        await conexion.beginTransaction();

        const [resultado] = await conexion.execute(
            `INSERT INTO publicacion
            (
                titulo,
                contenido,
                tipo_publicacion,
                video_url,
                video_modo,
                video_formato,
                destacada,
                tipo_vigencia,
                fecha_expiracion,
                id_usuario,
                id_necesidad
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                titulo,
                contenido,
                tipoPublicacion,
                videoUrl || null,
                modoVideo,
                formatoVideo,
                destacada ? 1 : 0,
                tipoVigenciaFinal,
                fechaExpiracionFinal,
                req.usuario.idUsuario,
                idNecesidad || null
            ]
        );

        const idPublicacion = resultado.insertId;

        await agregarImagenes(
            conexion,
            idPublicacion,
            imagenes
        );

        await conexion.commit();

        return res.status(201).json({
            mensaje:
                "Publicación creada correctamente.",
            idPublicacion,
            tipoVigencia:
                tipoVigenciaFinal,
            fechaExpiracion:
                fechaExpiracionFinal
        });
    } catch (error) {
        try {
            await conexion.rollback();
        } catch (_) {}

        console.error(
            "Error al crear publicación:",
            error.message
        );

        return res.status(500).json({
            mensaje:
                "Ocurrió un error al crear la publicación."
        });
    } finally {
        conexion.release();
    }
}

async function editarPublicacion(req, res) {
    const conexion = await pool.getConnection();

    try {
        const {id} = req.params;

        const {
            titulo,
            contenido,
            tipoPublicacion,
            videoUrl = null,
            modoVideo = "Integrado",
            formatoVideo = "Horizontal",
            destacada = false,
            tipoVigencia,
            fechaExpiracion = null,
            idNecesidad = null,
            imagenes
        } = req.body;

        if (!titulo || !contenido || !tipoPublicacion) {
            return res.status(400).json({
                mensaje:
                    "Título, contenido y tipo son obligatorios."
            });
        }

        if (!tiposPermitidos.includes(tipoPublicacion)) {
            return res.status(400).json({
                mensaje:
                    "El tipo de publicación no es válido."
            });
        }

        if (!modosVideoPermitidos.includes(modoVideo)) {
            return res.status(400).json({
                mensaje:
                    "El modo de visualización del video no es válido."
            });
        }

        if (!formatosVideoPermitidos.includes(formatoVideo)) {
            return res.status(400).json({
                mensaje:
                    "El formato del video no es válido."
            });
        }

        const [existente] = await conexion.execute(
            `SELECT
                id_publicacion,
                tipo_vigencia,
                fecha_expiracion
             FROM publicacion
             WHERE id_publicacion = ?
             LIMIT 1`,
            [id]
        );

        if (existente.length === 0) {
            return res.status(404).json({
                mensaje: "Publicación no encontrada."
            });
        }

        const tipoVigenciaFinal = resolverTipoVigencia(
            tipoVigencia,
            fechaExpiracion
        );

        if (!tipoVigenciaFinal) {
            return res.status(400).json({
                mensaje:
                    "El tipo de vigencia no es válido."
            });
        }

        if (idNecesidad) {
            const [necesidades] = await conexion.execute(
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

        let fechaExpiracionFinal;

        try {
            fechaExpiracionFinal = await resolverFechaExpiracion(
                conexion,
                tipoVigenciaFinal,
                fechaExpiracion,
                existente[0]
            );
        } catch (error) {
            if (error.tipo === "VALIDACION") {
                return res.status(400).json({
                    mensaje: error.message
                });
            }

            throw error;
        }

        let imagenesAnteriores = [];

        if (Array.isArray(imagenes)) {
            [imagenesAnteriores] = await conexion.execute(
                `SELECT
                    imagen_url,
                    imagen_public_id
                 FROM publicacion_imagen
                 WHERE id_publicacion = ?`,
                [id]
            );
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
                tipo_vigencia = ?,
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
                tipoVigenciaFinal,
                fechaExpiracionFinal,
                idNecesidad || null,
                id
            ]
        );

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

        if (Array.isArray(imagenes)) {
            const publicIdsActuales = new Set(
                imagenes
                    .map(obtenerPublicIdImagen)
                    .filter(Boolean)
            );

            const publicIdsAEliminar = imagenesAnteriores
                .map(
                    imagen =>
                        imagen.imagen_public_id
                )
                .filter(
                    publicId =>
                        publicId &&
                        !publicIdsActuales.has(publicId)
                );

            await Promise.allSettled(
                publicIdsAEliminar.map(
                    publicId =>
                        eliminarImagenCloudinary(publicId)
                )
            );
        }

        return res.json({
            mensaje:
                "Publicación actualizada correctamente.",
            tipoVigencia:
                tipoVigenciaFinal,
            fechaExpiracion:
                fechaExpiracionFinal
        });
    } catch (error) {
        try {
            await conexion.rollback();
        } catch (_) {}

        console.error(
            "Error al editar publicación:",
            error.message
        );

        return res.status(500).json({
            mensaje:
                "Ocurrió un error al actualizar la publicación."
        });
    } finally {
        conexion.release();
    }
}

async function cambiarEstadoPublicacion(req, res) {
    try {
        const {id} = req.params;
        const {estado} = req.body;

        if (typeof estado !== "boolean") {
            return res.status(400).json({
                mensaje:
                    "El estado debe ser true o false."
            });
        }

        const [resultado] = await pool.execute(
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
                mensaje: "Publicación no encontrada."
            });
        }

        return res.json({
            mensaje: estado
                ? "Publicación activada correctamente."
                : "Publicación desactivada correctamente."
        });
    } catch (error) {
        console.error(
            "Error al cambiar estado:",
            error.message
        );

        return res.status(500).json({
            mensaje:
                "Ocurrió un error al cambiar el estado."
        });
    }
}

async function eliminarPublicacionDefinitiva(req, res) {
    const conexion = await pool.getConnection();

    try {
        const {id} = req.params;

        const [publicaciones] = await conexion.execute(
            `SELECT
                id_publicacion,
                titulo,
                fecha_expiracion
             FROM publicacion
             WHERE id_publicacion = ?
             LIMIT 1`,
            [id]
        );

        if (publicaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Publicación no encontrada."
            });
        }

        const publicacion = publicaciones[0];

        if (!publicacion.fecha_expiracion) {
            return res.status(400).json({
                mensaje:
                    "Solo se pueden eliminar definitivamente publicaciones expiradas."
            });
        }

        const [validacionExpiracion] = await conexion.execute(
            `SELECT ? <= NOW() AS expirada`,
            [publicacion.fecha_expiracion]
        );

        if (!Boolean(validacionExpiracion[0].expirada)) {
            return res.status(400).json({
                mensaje:
                    "La publicación todavía no ha expirado."
            });
        }

        const [imagenes] = await conexion.execute(
            `SELECT imagen_public_id
             FROM publicacion_imagen
             WHERE id_publicacion = ?`,
            [id]
        );

        const publicIds = imagenes
            .map(
                imagen =>
                    imagen.imagen_public_id
            )
            .filter(Boolean);

        await conexion.beginTransaction();

        await conexion.execute(
            `DELETE FROM publicacion_imagen
             WHERE id_publicacion = ?`,
            [id]
        );

        const [resultado] = await conexion.execute(
            `DELETE FROM publicacion
             WHERE id_publicacion = ?`,
            [id]
        );

        if (resultado.affectedRows === 0) {
            await conexion.rollback();

            return res.status(404).json({
                mensaje: "Publicación no encontrada."
            });
        }

        await conexion.commit();

        const resultadosCloudinary =
            await Promise.allSettled(
                publicIds.map(
                    publicId =>
                        cloudinary.uploader.destroy(
                            publicId,
                            {
                                resource_type: "image",
                                invalidate: true
                            }
                        )
                )
            );

        const erroresCloudinary =
            resultadosCloudinary.filter(
                resultado =>
                    resultado.status === "rejected" ||
                    (
                        resultado.status === "fulfilled" &&
                        resultado.value?.result !== "ok" &&
                        resultado.value?.result !== "not found"
                    )
            );

        if (erroresCloudinary.length > 0) {
            console.warn(
                `La publicación ${id} se eliminó de MySQL, pero ${erroresCloudinary.length} imagen(es) no pudieron eliminarse de Cloudinary.`
            );
        }

        return res.json({
            mensaje:
                "Publicación eliminada definitivamente.",
            imagenesEliminadas:
                publicIds.length - erroresCloudinary.length,
            imagenesPendientes:
                erroresCloudinary.length
        });
    } catch (error) {
        try {
            await conexion.rollback();
        } catch (_) {}

        console.error(
            "Error al eliminar definitivamente la publicación:",
            error.message
        );

        return res.status(500).json({
            mensaje:
                "Ocurrió un error al eliminar definitivamente la publicación."
        });
    } finally {
        conexion.release();
    }
}


async function eliminarPublicacion(req, res) {
    try {
        const {id} = req.params;

        const [resultado] = await pool.execute(
            `UPDATE publicacion
             SET estado = FALSE
             WHERE id_publicacion = ?`,
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Publicación no encontrada."
            });
        }

        return res.json({
            mensaje:
                "Publicación eliminada correctamente."
        });
    } catch (error) {
        console.error(
            "Error eliminando publicación:",
            error.message
        );

        return res.status(500).json({
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
    eliminarPublicacion,
    eliminarPublicacionDefinitiva
};
