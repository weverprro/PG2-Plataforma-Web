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
    listarRoles
} = require(
    "../controllers/rolController"
);


const router =
    express.Router();


router.get(
    "/",
    verificarToken,
    permitirRoles(
        "Administrador"
    ),
    listarRoles
);


module.exports =
    router;