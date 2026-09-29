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
    obtenerResumenDashboard
} = require(
    "../controllers/dashboardController"
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
    obtenerResumenDashboard
);


module.exports =
    router;