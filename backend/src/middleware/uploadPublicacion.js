const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");


const carpetaUploads = path.join(
    __dirname,
    "../../uploads/publicaciones"
);


/*
 * Si la carpeta no existe,
 * la creamos automáticamente.
 */
fs.mkdirSync(
    carpetaUploads,
    {
        recursive: true
    }
);


const extensiones = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
};


const storage = multer.diskStorage({

    destination: function (
        req,
        file,
        cb
    ) {
        cb(
            null,
            carpetaUploads
        );
    },


    filename: function (
        req,
        file,
        cb
    ) {

        const extension =
            extensiones[file.mimetype];

        const nombre =
            `${Date.now()}-${crypto.randomUUID()}${extension}`;

        cb(
            null,
            nombre
        );
    }

});


function filtroArchivo(
    req,
    file,
    cb
) {

    const permitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (
        !permitidos.includes(
            file.mimetype
        )
    ) {

        return cb(
            new Error(
                "Solo se permiten imágenes JPG, JPEG, PNG o WEBP."
            )
        );
    }

    cb(
        null,
        true
    );
}


const upload = multer({

    storage,

    fileFilter:
        filtroArchivo,

    limits: {

        /*
         * Máximo 5 MB
         * por fotografía.
         */
        fileSize:
            5 * 1024 * 1024,

        /*
         * Máximo 8 archivos.
         */
        files: 8
    }

});


function subirImagenesPublicacion(
    req,
    res,
    next
) {

    const middleware =
        upload.array(
            "imagenes",
            8
        );


    middleware(
        req,
        res,
        function (error) {

            if (
                error instanceof
                multer.MulterError
            ) {

                if (
                    error.code ===
                    "LIMIT_FILE_SIZE"
                ) {

                    return res.status(400).json({
                        mensaje:
                            "Una de las imágenes supera el límite de 5 MB."
                    });
                }


                if (
                    error.code ===
                    "LIMIT_FILE_COUNT"
                ) {

                    return res.status(400).json({
                        mensaje:
                            "Solo puedes subir un máximo de 8 imágenes."
                    });
                }


                return res.status(400).json({
                    mensaje:
                        "Ocurrió un error al subir las imágenes."
                });
            }


            if (error) {

                return res.status(400).json({
                    mensaje:
                        error.message
                });
            }


            next();
        }
    );
}


module.exports =
    subirImagenesPublicacion;