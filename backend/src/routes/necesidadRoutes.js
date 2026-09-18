const express = require("express");

const verificarToken = require(
    "../middleware/authMiddleware"
);

const permitirRoles = require(
    "../middleware/roleMiddleware"
);

const {
    listarNecesidades,
    obtenerNecesidad,
    crearNecesidad,
    actualizarNecesidad,
    eliminarNecesidad
} = require("../controllers/necesidadController");

const router = express.Router();

router.get("/", listarNecesidades);

router.get("/:id", obtenerNecesidad);

router.post(
    "/",
    verificarToken,
    permitirRoles("Administrador", "Secretaria"),
    crearNecesidad
);

router.put(
    "/:id",
    verificarToken,
    permitirRoles("Administrador", "Secretaria"),
    actualizarNecesidad
);

router.delete(
    "/:id",
    verificarToken,
    permitirRoles("Administrador", "Secretaria"),
    eliminarNecesidad
);

module.exports = router;