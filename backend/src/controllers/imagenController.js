const cloudinary = require("../config/cloudinary");

/*
=========================================
VALIDAR FIRMA REAL DE LA IMAGEN
=========================================
No confiamos únicamente en file.mimetype.
Comprobamos los primeros bytes para
JPG, PNG y WEBP.
*/
function imagenValida(
    buffer,
    mimetype
) {
    if (
        !buffer ||
        buffer.length < 12
    ) {return false;}

    /*
     * JPEG
     * FF D8 FF
     */
    if (mimetype === "image/jpeg") {
        return (
            buffer[0] === 0xff &&
            buffer[1] === 0xd8 &&
            buffer[2] === 0xff
        );
    }

    /*
     * PNG
     * 89 50 4E 47 0D 0A 1A 0A
     */
    if (mimetype === "image/png") {
        return (
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4e &&
            buffer[3] === 0x47 &&
            buffer[4] === 0x0d &&
            buffer[5] === 0x0a &&
            buffer[6] === 0x1a &&
            buffer[7] === 0x0a
        );
    }

    /*
     * WEBP
     * RIFF .... WEBP
     */
    if (mimetype === "image/webp") {
        return (
            buffer
                .subarray(
                    0,
                    4
                )
                .toString() === "RIFF" &&
            buffer
                .subarray(
                    8,
                    12
                )
                .toString() === "WEBP"
        );
    }

    return false;
}

/*
=========================================
SUBIR BUFFER A CLOUDINARY
=========================================
*/
function subirBufferCloudinary(
    buffer,
    carpeta
) {
    return new Promise(( resolve, reject) => {const stream =cloudinary.uploader.upload_stream(
                        {
                            folder: carpeta,
                            resource_type: "image",
                            unique_filename: true,
                            overwrite: false
                        },

                        (error,resultado) => {
                            if (error) {
                                return reject(error);
                            }

                            resolve(
                                resultado
                            );
                        }
                    );

            stream.end(
                buffer
            );
        }
    );
}

/*
=========================================
PUBLICACIONES
Todavía utiliza el sistema anterior.
Lo migraremos después.
=========================================
*/
async function subirImagenes(req, res) {
    const archivos = req.files || [];

    if (archivos.length === 0) { return res.status(400).json({
            mensaje: "Debes seleccionar al menos una imagen."
        });
    }

    const imagenesSubidas = [];

    try {
        for (const archivo of archivos) {
            if (!imagenValida(archivo.buffer, archivo.mimetype)) {
                const error = new Error(
                    "Una de las imágenes no corresponde a un archivo JPG, PNG o WEBP válido."
                );

                error.tipo = "IMAGEN_INVALIDA";
                throw error;
            }

            const resultado = await subirBufferCloudinary(
                archivo.buffer,
                "meson-buen-samaritano/publicaciones"
            );

            if (!resultado?.secure_url || !resultado?.public_id) {
                throw new Error(
                    "Cloudinary no devolvió los datos esperados."
                );
            }

            imagenesSubidas.push({
                url: resultado.secure_url,
                publicId: resultado.public_id,
                textoAlternativo: null
            });
        }

        return res.status(201).json({
            mensaje: "Imágenes subidas correctamente.",
            imagenes: imagenesSubidas
        });
    } catch (error) {
        
        /*
         * Si falló la segunda, tercera, etc.,
         * eliminamos las que ya habían subido
         * para evitar archivos huérfanos.
         */
        await Promise.allSettled(
            imagenesSubidas.map(imagen =>
                cloudinary.uploader.destroy(
                    imagen.publicId,
                    {
                        resource_type: "image",
                        invalidate: true
                    }
                )
            )
        );

        if (error.tipo === "IMAGEN_INVALIDA") {
            return res.status(400).json({
                mensaje: error.message
            });
        }

        console.error(
            "Error al subir imágenes de publicación a Cloudinary:",
            error.message
        );

        return res.status(500).json({
            mensaje: "No fue posible almacenar las imágenes. Intenta nuevamente."
        });
    }
}

/*
=========================================
CONTENIDO INSTITUCIONAL
CLOUDINARY
=========================================
*/
async function subirImagenContenido(req,res) {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "No se recibió ninguna imagen."
                });
        }

        /*
         * Validación adicional del
         * contenido real del archivo.
         */
        if (
            !imagenValida(
                req.file.buffer,
                req.file.mimetype
            )
        ) {
            return res
                .status(400)
                .json({
                    mensaje:
                        "El archivo recibido no corresponde a una imagen JPG, PNG o WEBP válida."
                });
        }

        /*
         * Subimos directamente desde
         * memoria hacia Cloudinary.
         */
        const resultado =
            await subirBufferCloudinary(
                req.file.buffer,
                "meson-buen-samaritano/contenidos"
            );

        if (
            !resultado ||
            !resultado.secure_url ||
            !resultado.public_id
        ) {
            throw new Error(
                "Cloudinary no devolvió los datos esperados."
            );
        }

        return res
            .status(201)
            .json({

                mensaje:
                    "Imagen cargada correctamente.",
                imagen: {
                    url: resultado.secure_url,
                    publicId: resultado.public_id,
                    formato: resultado.format,
                    ancho: resultado.width,
                    alto: resultado.height,
                    bytes: resultado.bytes
                }
            });

    } catch (error) {
        console.error(
            "Error al subir imagen a Cloudinary:",
            error.message
        );

        return res
            .status(500)
            .json({
                mensaje:
                    "No fue posible almacenar la imagen. Intenta nuevamente."
            });
    }
}

module.exports = { subirImagenes, subirImagenContenido};