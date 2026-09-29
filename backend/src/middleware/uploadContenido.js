const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");


const carpetaDestino =
    path.join(
        __dirname,
        "../../uploads/contenidos"
    );


fs.mkdirSync(
    carpetaDestino,
    {
        recursive: true
    }
);


const storage =
    multer.diskStorage({

        destination:
            function (
                req,
                file,
                cb
            ) {

                cb(
                    null,
                    carpetaDestino
                );
            },


        filename:
            function (
                req,
                file,
                cb
            ) {

                const extension =
                    path.extname(
                        file.originalname
                    )
                    .toLowerCase();


                const nombre =
                    `${Date.now()}-${crypto.randomUUID()}${extension}`;


                cb(
                    null,
                    nombre
                );
            }

    });


const filtroArchivo =
    function (
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
            permitidos.includes(
                file.mimetype
            )
        ) {

            cb(
                null,
                true
            );

        } else {

            cb(
                new Error(
                    "Solo se permiten imágenes JPG, PNG o WEBP."
                )
            );
        }
    };


const upload =
    multer({

        storage,

        fileFilter:
            filtroArchivo,

        limits: {
            fileSize:
                5 * 1024 * 1024
        }

    });


function subirImagenContenido(
    req,
    res,
    next
) {

    const carga =
        upload.single(
            "imagen"
        );


    carga(
        req,
        res,
        function (error) {

            if (error) {

                return res
                    .status(400)
                    .json({
                        mensaje:
                            error.message
                    });
            }


            next();
        }
    );
}


module.exports = {
    subirImagenContenido
};