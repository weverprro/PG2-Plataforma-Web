const express = require("express");

const router = express.Router();

const {
    listarContenidos,
    obtenerContenidoPorId,
    obtenerContenidoPorTipo,
    listarContenidosAdmin,
    crearContenido,
    actualizarContenido,
    cambiarEstadoContenido,
    eliminarContenido
} = require("../controllers/contenidoController");

const authMiddleware =require("../middleware/authMiddleware");

const verificarToken =require("../middleware/authMiddleware");

const permitirRoles =require("../middleware/roleMiddleware");

const {subirImagenContenido} = require("../controllers/imagenController");

const {subirImagenContenido:middlewareImagenContenido} = require("../middleware/uploadContenido");

/*
=========================================
Subir imagen de contenido
=========================================
*/
router.post(
    "/subir-imagen",

    authMiddleware,

    permitirRoles(
        "Administrador"
    ),

    middlewareImagenContenido,

    subirImagenContenido
);

/*
=========================================
PUBLICO
=========================================
*/

router.get(
    "/",
    listarContenidos
);


router.get(
    "/tipo/:tipo",
    obtenerContenidoPorTipo
);


/*
=========================================
ADMINISTRADOR
=========================================
*/

router.get(
    "/admin/listado",
    verificarToken,
    permitirRoles("Administrador"),
    listarContenidosAdmin
);


router.post(
    "/",
    verificarToken,
    permitirRoles("Administrador"),
    crearContenido
);


router.put(
    "/:id/estado",
    verificarToken,
    permitirRoles("Administrador"),
    cambiarEstadoContenido
);


router.put(
    "/:id",
    verificarToken,
    permitirRoles("Administrador"),
    actualizarContenido
);


router.delete(
    "/:id",
    verificarToken,
    permitirRoles("Administrador"),
    eliminarContenido
);


/*
=========================================
Debe quedar al final.
=========================================
*/

router.get(
    "/:id",
    obtenerContenidoPorId
);


module.exports = router;