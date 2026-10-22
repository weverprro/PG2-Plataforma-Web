const pool = require("../config/database");
const cloudinary = require("../config/cloudinary");

const tiposPermitidos = [
    "HeroInicio",
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
UTILIDADES DE IMAGEN
=========================================
*/
function esUrlCloudinary(url) {
    return (
        typeof url === "string" &&
        url.startsWith(
            "https://res.cloudinary.com/"
        )
    );
}

async function eliminarImagenCloudinary(
    publicId
) {
    if (!publicId) {
        return false;
    }

    try {
        const resultado =
            await cloudinary.uploader.destroy(
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
        /*
         * La información de MySQL ya puede
         * haberse actualizado correctamente.
         * No hacemos fallar la operación por
         * un problema de limpieza remota.
         */
        console.error(
            "No fue posible eliminar la imagen anterior de Cloudinary:",
            error.message
        );

        return false;
    }
}

/*
=========================================
PUBLICO
=========================================
*/
async function listarContenidos(
    req,
    res
) {
    try {
        const [contenidos] =
            await pool.execute(
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

        return res.json(
            contenidos
        );

    } catch (error) {console.error(
            "Error al listar contenidos:",
            error.message
        );

        return res
            .status(500)
            .json({
                mensaje:
                    "Ocurrió un error al obtener el contenido institucional."
            });
    }
}

async function obtenerContenidoPorId(
    req,
    res
) {
    try {
        const { id } =
            req.params;

        const [contenidos] =
            await pool.execute(
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
                [
                    id
                ]
            );

        if (
            contenidos.length === 0
        ) {
            return res
                .status(404)
                .json({
                    mensaje:
                        "Contenido no encontrado."
                });
        }

        return res.json(
            contenidos[0]
        );

    } catch (error) {console.error(
            "Error al obtener contenido:",
            error.message
        );

        return res
            .status(500)
            .json({
                mensaje:
                    "Ocurrió un error al obtener el contenido."
            });
    }}

async function obtenerContenidoPorTipo(
    req,
    res
) {try {
        const { tipo } =
            req.params;

        if (
            !tiposPermitidos.includes(
                tipo
            )
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "El tipo de contenido no es válido."
                });
        }

        const [contenidos] =
            await pool.execute(
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
                [
                    tipo
                ]
            );

        return res.json(
            contenidos
        );

    } catch (error) {console.error("Error al obtener contenido por tipo:", error.message);

        return res
            .status(500)
            .json({
                mensaje:
                    "Ocurrió un error al obtener el contenido."
            });
    }}

/*
=========================================
ADMINISTRADOR
=========================================
*/
async function listarContenidosAdmin(req,res) {
    try {
        const [contenidos] =
            await pool.execute(
                `SELECT
                    ci.id_contenido,
                    ci.titulo,
                    ci.contenido,
                    ci.tipo_contenido,
                    ci.imagen_url,
                    ci.imagen_public_id,
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

        return res.json(
            contenidos
        );

    } catch (error) {console.error(
            "Error al listar contenido administrativo:",
            error.message
        );

        return res
            .status(500)
            .json({
                mensaje:
                    "Ocurrió un error al obtener el contenido."
            });
    }
}

async function crearContenido(
    req,
    res
) {
    try {const {
            titulo,
            contenido,
            tipoContenido,
            imagenUrl = null,
            imagenPublicId = null,
            orden = 1 } = req.body;

        const esHeroInicio =
            tipoContenido === "HeroInicio";

        const tituloFinal =
            esHeroInicio
                ? "Imagen principal de inicio"
                : titulo;

        const contenidoFinal =
            esHeroInicio
                ? "Imagen utilizada como fondo del encabezado principal de la página de inicio."
                : contenido;

        if (
            !tituloFinal ||
            !contenidoFinal ||
            !tipoContenido
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "Título, contenido y tipo son obligatorios."
                });
        }

        if (!tiposPermitidos.includes(tipoContenido)
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "El tipo de contenido no es válido."
                });
        }

        const ordenNumerico =
            Number(
                orden
            );

        if (
            !Number.isInteger(
                ordenNumerico
            ) ||
            ordenNumerico < 1
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "El orden debe ser un número entero mayor que cero."
                });
        }

        /*
         * Si la imagen viene de Cloudinary,
         * debemos guardar también su public_id.
         */
        if (
            esUrlCloudinary(
                imagenUrl
            ) &&
            !imagenPublicId
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "No se recibió el identificador de la imagen de Cloudinary."
                });

        }

        if (
            imagenPublicId &&
            !imagenUrl
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "La imagen no contiene una URL válida."
                });

        }

        const [resultado] =
            await pool.execute(
                `INSERT INTO contenido_institucional
                (
                    titulo,
                    contenido,
                    tipo_contenido,
                    imagen_url,
                    imagen_public_id,
                    estado,
                    orden,
                    id_usuario
                )
                VALUES (?, ?, ?, ?, ?, TRUE, ?, ?)`,
                [
                    tituloFinal,
                    contenidoFinal,
                    tipoContenido,
                    imagenUrl || null,
                    imagenPublicId || null,
                    ordenNumerico,
                    req.usuario.idUsuario
                ]
            );

        return res
            .status(201)
            .json({
                mensaje:
                    "Contenido institucional creado correctamente.",

                idContenido:
                    resultado.insertId
            });

    } catch (error) {console.error(
            "Error al crear contenido:",
            error.message
        );

        return res
            .status(500)
            .json({
                mensaje:
                    "Ocurrió un error al crear el contenido."
            });
    }}

async function actualizarContenido(
    req,
    res
) {try {
        const { id } =
            req.params;

        const {
            titulo,
            contenido,
            tipoContenido,
            imagenUrl = null,
            imagenPublicId = null,
            orden = 1} = req.body;

        const esHeroInicio =
            tipoContenido === "HeroInicio";

        const tituloFinal =
            esHeroInicio
                ? "Imagen principal de inicio"
                : titulo;

        const contenidoFinal =
            esHeroInicio
                ? "Imagen utilizada como fondo del encabezado principal de la página de inicio."
                : contenido;

        if (
            !tituloFinal ||
            !contenidoFinal ||
            !tipoContenido
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "Título, contenido y tipo son obligatorios."
                });

        }if (
            !tiposPermitidos.includes(
                tipoContenido
            )
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "El tipo de contenido no es válido."
                });
        }

        const ordenNumerico =
            Number(
                orden
            );

        if (
            !Number.isInteger(
                ordenNumerico
            ) ||
            ordenNumerico < 1
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "El orden debe ser un número entero mayor que cero."
                });
        }

        /*
         * Primero obtenemos la imagen anterior.
         * Esto también permite comprobar que el
         * contenido realmente existe.
         */
        const [contenidosActuales] =
            await pool.execute(
                `SELECT
                    id_contenido,
                    imagen_url,
                    imagen_public_id
                 FROM contenido_institucional
                 WHERE id_contenido = ?
                 LIMIT 1`,
                [
                    id
                ]
            );

        if (
            contenidosActuales.length === 0
        ) {
            return res
                .status(404)
                .json({
                    mensaje:
                        "Contenido no encontrado."
                });
        }

        const contenidoActual =
            contenidosActuales[0];

        /*
         * Si no cambió la URL y el frontend no
         * manda nuevamente el public_id,
         * conservamos el existente.
         *
         * Esto mantiene compatibilidad con
         * contenidos ya guardados.
         */
        let publicIdFinal =
            imagenPublicId ||
            null;

        if (
            imagenUrl ===
                contenidoActual.imagen_url &&
            !publicIdFinal
        ) {
            publicIdFinal =
                contenidoActual.imagen_public_id ||
                null;
        }

        /*
         * Una URL nueva de Cloudinary siempre
         * debe venir acompañada de public_id.
         */
        if (
            esUrlCloudinary(
                imagenUrl
            ) &&
            !publicIdFinal &&
            imagenUrl !==
                contenidoActual.imagen_url
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "No se recibió el identificador de la nueva imagen de Cloudinary."
                });
        }

        if (
            publicIdFinal &&
            !imagenUrl
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "La imagen no contiene una URL válida."
                });
        }

        /*
         * Primero actualizamos MySQL.
         * La imagen anterior se elimina de
         * Cloudinary únicamente después de
         * una actualización satisfactoria.
         */
        await pool.execute(
            `UPDATE contenido_institucional
             SET
                titulo = ?,
                contenido = ?,
                tipo_contenido = ?,
                imagen_url = ?,
                imagen_public_id = ?,
                orden = ?,
                fecha_actualizacion =
                    CURRENT_TIMESTAMP,
                id_usuario = ?
             WHERE id_contenido = ?`,
            [
                tituloFinal,
                contenidoFinal,
                tipoContenido,
                imagenUrl || null,
                publicIdFinal,
                ordenNumerico,
                req.usuario.idUsuario,
                id
            ]
        );

        const imagenCambio =
            contenidoActual.imagen_url !==
                (imagenUrl || null) ||
            contenidoActual.imagen_public_id !==
                publicIdFinal;

        /*
         * Si había una imagen administrada por
         * Cloudinary y fue reemplazada o quitada,
         * eliminamos el archivo anterior.
         *
         * Las imágenes antiguas de /uploads no
         * tienen public_id, por lo que simplemente
         * se dejan intactas durante la migración.
         */
        if (
            imagenCambio &&
            contenidoActual.imagen_public_id &&
            contenidoActual.imagen_public_id !==
                publicIdFinal
        ) {
            await eliminarImagenCloudinary(
                contenidoActual.imagen_public_id
            );

        }

        return res.json({
            mensaje:
                "Contenido actualizado correctamente."
        });

    } catch (error) {
        console.error(
            "Error al actualizar contenido:",
            error.message
        );

        return res
            .status(500)
            .json({
                mensaje:
                    "Ocurrió un error al actualizar el contenido."
            });
    }}

async function cambiarEstadoContenido(req,res) {
    try {
        const { id } =
            req.params;
        const { estado } =
            req.body;

        if (
            typeof estado !==
                "boolean"
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "El estado debe ser true o false."
                });
        }

        const [resultado] =
            await pool.execute(
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

        if (
            resultado.affectedRows === 0
        ) {
            return res
                .status(404)
                .json({
                    mensaje:
                        "Contenido no encontrado."
                });
        }

        return res.json({
            mensaje:
                estado
                    ? "Contenido activado correctamente."
                    : "Contenido desactivado correctamente."
        });

    } catch (error) {console.error(
            "Error al cambiar estado:",error.message
        );

        return res
            .status(500)
            .json({
                mensaje:
                    "Ocurrió un error al cambiar el estado."
            });
    }
}

async function eliminarContenido(req,res) {
    try {
        const { id } =
            req.params;

        /*
         * Eliminación lógica.
         *
         * NO eliminamos la imagen de Cloudinary
         * porque este contenido puede reactivarse
         * posteriormente.
         */
        const [resultado] =
            await pool.execute(
                `UPDATE contenido_institucional
                 SET
                    estado = FALSE,
                    fecha_actualizacion =
                        CURRENT_TIMESTAMP
                 WHERE id_contenido = ?`,
                [
                    id
                ]
            );

        if (
            resultado.affectedRows === 0
        ) {
            return res
                .status(404)
                .json({
                    mensaje:
                        "Contenido no encontrado."
                });
        }

        return res.json({
            mensaje:
                "Contenido eliminado correctamente."
        });

    } catch (error) {console.error(
            "Error al eliminar contenido:",
            error.message
        );

        return res
            .status(500)
            .json({
                mensaje:
                    "Ocurrió un error al eliminar el contenido."
            });
    }}

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