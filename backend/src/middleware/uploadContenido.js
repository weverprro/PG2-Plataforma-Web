const multer = require("multer");


/*
=========================================
ALMACENAMIENTO TEMPORAL EN MEMORIA
=========================================
La imagen ya no se guarda en /uploads.
Multer la mantiene temporalmente en RAM
para enviarla después a Cloudinary.
*/
const storage = multer.memoryStorage();
/*
=========================================
FORMATOS PERMITIDOS
=========================================
Esta es una primera validación por MIME.
Después validaremos también el contenido
real del archivo.
*/
const filtroArchivo = function ( req, file, cb) {

        const permitidos = [ "image/jpeg", "image/png", "image/webp"];

        if (permitidos.includes(file.mimetype)
        ) {

            return cb(null, true);
        }

        return cb( new Error("Solo se permiten imágenes JPG, PNG o WEBP."));

    };
/*
=========================================
CONFIGURACIÓN DE MULTER
=========================================
Máximo:
5 MB por imagen.
*/
const upload =
    multer({
        storage,
        fileFilter:
            filtroArchivo,
        limits: {
            fileSize:
                5 * 1024 * 1024,
            files:
                1
        }
    });
/*
=========================================
MIDDLEWARE DE SUBIDA
=========================================
*/
function subirImagenContenido(req,res, next) {
    const carga =
        upload.single(
            "imagen"
        );
    carga(
        req,
        res,
        function (error) {
            if (error) {
                /*
                 * Archivo demasiado grande.
                 */
                if (
                    error instanceof
                        multer.MulterError &&
                    error.code ===
                        "LIMIT_FILE_SIZE"
                ) {

                    return res
                        .status(400)
                        .json({
                            mensaje:
                                "La imagen no puede superar los 5 MB."
                        });
                }
                /*
                 * Se enviaron más archivos
                 * de los permitidos o un
                 * campo inesperado.
                 */
                if (
                    error instanceof
                        multer.MulterError &&
                    error.code ===
                        "LIMIT_UNEXPECTED_FILE"
                ) {
                    return res
                        .status(400)
                        .json({
                            mensaje:
                                "Solo se permite subir una imagen."
                        });
                }

                return res
                    .status(400)
                    .json({
                        mensaje:
                            error.message ||
                            "No fue posible procesar la imagen."
                    });
            }

            next();
        }
    );
}
module.exports = {
    subirImagenContenido
};