const express = require("express");

const router = express.Router();

const {
    listarPublicaciones,
    obtenerPublicacion,
    listarPublicacionesAdmin,
    crearPublicacion,
    editarPublicacion,
    cambiarEstadoPublicacion,
    eliminarPublicacion
} = require("../controllers/publicacionController");

const verificarToken =
    require("../middleware/authMiddleware");

const permitirRoles =
    require("../middleware/roleMiddleware");

const {
    subirImagenes
} = require(
    "../controllers/imagenController"
);

const subirImagenesPublicacion =
    require(
        "../middleware/uploadPublicacion"
    );
/*
=========================================
RUTAS PUBLICAS
=========================================
*/

router.get(
    "/",
    listarPublicaciones
);


/*
=========================================
RUTAS ADMINISTRATIVAS
=========================================
*/

router.get(
    "/admin/listado",
    verificarToken,
    permitirRoles(
        "Administrador",
        "Secretaria"
    ),
    listarPublicacionesAdmin
);


router.post(
    "/",
    verificarToken,
    permitirRoles(
        "Administrador",
        "Secretaria"
    ),
    crearPublicacion
);

router.post(
    "/subir-imagenes",

    verificarToken,

    permitirRoles(
        "Administrador",
        "Secretaria"
    ),

    subirImagenesPublicacion,

    subirImagenes
);

router.put(
    "/:id/estado",
    verificarToken,
    permitirRoles(
        "Administrador",
        "Secretaria"
    ),
    cambiarEstadoPublicacion
);


router.put(
    "/:id",
    verificarToken,
    permitirRoles(
        "Administrador",
        "Secretaria"
    ),
    editarPublicacion
);


router.delete(
    "/:id",
    verificarToken,
    permitirRoles(
        "Administrador",
        "Secretaria"
    ),
    eliminarPublicacion
);



/*
=========================================
IMPORTANTE:
Esta ruta queda al final para que
"admin" no sea interpretado como ID.
=========================================
*/

router.get(
    "/:id",
    obtenerPublicacion
);


module.exports = router;