const express =
    require("express");

const verificarToken =
    require(
        "../middleware/authMiddleware"
    );

const permitirRoles =
    require(
        "../middleware/roleMiddleware"
    );

const {
    listarTransacciones,
    obtenerTransaccion
} = require(
    "../controllers/transaccionController"
);


const router =
    express.Router();


router.get(
    "/",
    verificarToken,
    permitirRoles(
        "Administrador",
        "Secretaria",
        "Contador"
    ),
    listarTransacciones
);


router.get(
    "/:id",
    verificarToken,
    permitirRoles(
        "Administrador",
        "Secretaria",
        "Contador"
    ),
    obtenerTransaccion
);


module.exports =
    router;