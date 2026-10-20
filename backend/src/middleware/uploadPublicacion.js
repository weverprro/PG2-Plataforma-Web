const multer = require("multer");

const storage = multer.memoryStorage();

function filtroArchivo(req, file, cb) {
    const permitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!permitidos.includes(file.mimetype)) {
        return cb(
            new Error(
                "Solo se permiten imágenes JPG, JPEG, PNG o WEBP."
            )
        );
    }

    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter: filtroArchivo,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 8
    }
});

function subirImagenesPublicacion(req, res, next) {
    const middleware = upload.array("imagenes", 8);

    middleware(req, res, function(error) {
        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    mensaje: "Una de las imágenes supera el límite de 5 MB."
                });
            }

            if (error.code === "LIMIT_FILE_COUNT") {
                return res.status(400).json({
                    mensaje: "Solo puedes subir un máximo de 8 imágenes."
                });
            }

            if (error.code === "LIMIT_UNEXPECTED_FILE") {
                return res.status(400).json({
                    mensaje: "Solo puedes subir un máximo de 8 imágenes."
                });
            }

            return res.status(400).json({
                mensaje: "Ocurrió un error al procesar las imágenes."
            });
        }

        if (error) {
            return res.status(400).json({
                mensaje: error.message
            });
        }

        next();
    });
}

module.exports = subirImagenesPublicacion;