const path = require("path");
const fs = require("fs");
require("dotenv").config({
    path: path.join(__dirname, "../../.env")
});

const pool = require("../config/database");
const cloudinary = require("../config/cloudinary");

const carpetaPublicaciones = path.join(
    __dirname,
    "../../uploads/publicaciones"
);

function obtenerNombreArchivo(imagenUrl) {
    if (
        typeof imagenUrl !== "string" ||
        !imagenUrl.startsWith("/uploads/publicaciones/")
    ) {
        return null;
    }

    const nombre = path.basename(imagenUrl);

    if (
        !nombre ||
        nombre === "." ||
        nombre === ".."
    ) {
        return null;
    }

    return nombre;
}

async function migrarImagen(imagen) {
    const nombreArchivo =
        obtenerNombreArchivo(imagen.imagen_url);

    if (!nombreArchivo) {
        console.warn(
            `Imagen ${imagen.id_imagen}: ruta local no válida.`
        );
        return "omitida";
    }

    const rutaArchivo = path.join(
        carpetaPublicaciones,
        nombreArchivo
    );

    if (!fs.existsSync(rutaArchivo)) {
        console.warn(
            `Imagen ${imagen.id_imagen}: archivo no encontrado: ${nombreArchivo}`
        );
        return "faltante";
    }

    let resultadoCloudinary = null;

    try {
        resultadoCloudinary =
            await cloudinary.uploader.upload(
                rutaArchivo,
                {
                    folder:
                        "meson-buen-samaritano/publicaciones",
                    resource_type: "image"
                }
            );

        if (
            !resultadoCloudinary?.secure_url ||
            !resultadoCloudinary?.public_id
        ) {
            throw new Error(
                "Cloudinary no devolvió los datos esperados."
            );
        }

        const [resultadoDb] = await pool.execute(
            `UPDATE publicacion_imagen
             SET
                imagen_url = ?,
                imagen_public_id = ?
             WHERE id_imagen = ?
             AND imagen_url = ?
             AND imagen_public_id IS NULL`,
            [
                resultadoCloudinary.secure_url,
                resultadoCloudinary.public_id,
                imagen.id_imagen,
                imagen.imagen_url
            ]
        );

        if (resultadoDb.affectedRows !== 1) {
            await cloudinary.uploader.destroy(
                resultadoCloudinary.public_id,
                {
                    resource_type: "image",
                    invalidate: true
                }
            );

            console.warn(
                `Imagen ${imagen.id_imagen}: la fila cambió durante la migración. No se modificó.`
            );

            return "omitida";
        }

        try {
            await fs.promises.unlink(rutaArchivo);
        } catch (error) {
            console.warn(
                `Imagen ${imagen.id_imagen}: migrada, pero no se pudo borrar el archivo local: ${error.message}`
            );
        }

        console.log(
            `Imagen ${imagen.id_imagen}: migrada correctamente.`
        );

        return "migrada";
    } catch (error) {
        if (resultadoCloudinary?.public_id) {
            try {
                await cloudinary.uploader.destroy(
                    resultadoCloudinary.public_id,
                    {
                        resource_type: "image",
                        invalidate: true
                    }
                );
            } catch (_) {}
        }

        console.error(
            `Imagen ${imagen.id_imagen}: error: ${error.message}`
        );

        return "error";
    }
}

async function ejecutar() {
    try {
        const [imagenes] = await pool.execute(
            `SELECT
                id_imagen,
                imagen_url
             FROM publicacion_imagen
             WHERE imagen_url LIKE '/uploads/publicaciones/%'
             AND imagen_public_id IS NULL
             ORDER BY id_imagen`
        );

        if (imagenes.length === 0) {
            console.log(
                "No hay imágenes locales pendientes de migración."
            );
            return;
        }

        console.log(
            `Se encontraron ${imagenes.length} imágenes locales para migrar.`
        );

        const resumen = {
            migrada: 0,
            faltante: 0,
            omitida: 0,
            error: 0
        };

        for (const imagen of imagenes) {
            const estado = await migrarImagen(imagen);
            resumen[estado]++;
        }

        const [pendientes] = await pool.execute(
            `SELECT COUNT(*) AS total
             FROM publicacion_imagen
             WHERE imagen_url LIKE '/uploads/publicaciones/%'`
        );

        console.log("");
        console.log("Migración terminada:");
        console.log(`Migradas: ${resumen.migrada}`);
        console.log(`Archivos faltantes: ${resumen.faltante}`);
        console.log(`Omitidas: ${resumen.omitida}`);
        console.log(`Errores: ${resumen.error}`);
        console.log(
            `Filas locales pendientes en MySQL: ${pendientes[0].total}`
        );
    } catch (error) {
        console.error(
            "Error general de migración:",
            error.message
        );
    } finally {
        await pool.end();
    }
}

ejecutar();
