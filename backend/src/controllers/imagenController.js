function subirImagenes(req, res) {

    const archivos =
        req.files || [];


    if (archivos.length === 0) {

        return res.status(400).json({
            mensaje:
                "Debes seleccionar al menos una imagen."
        });
    }


    const imagenes =
        archivos.map(
            archivo => ({
                url:
                    `/uploads/publicaciones/${archivo.filename}`,

                textoAlternativo:
                    null
            })
        );


    res.status(201).json({

        mensaje:
            "Imágenes subidas correctamente.",

        imagenes

    });
}

function subirImagenContenido(
    req,
    res
) {

    if (!req.file) {

        return res
            .status(400)
            .json({
                mensaje:
                    "No se recibió ninguna imagen."
            });
    }


    return res.json({

        mensaje:
            "Imagen cargada correctamente.",

        imagen: {
            url:
                `/uploads/contenidos/${req.file.filename}`
        }

    });
}

module.exports = {
    subirImagenes,
    subirImagenContenido
};

