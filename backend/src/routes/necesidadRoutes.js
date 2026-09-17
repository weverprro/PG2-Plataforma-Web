const express = require("express");

const verificarToken = require(
    "../middleware/authMiddleware"
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
    crearNecesidad
);

router.put(
    "/:id",
    verificarToken,
    actualizarNecesidad
);

router.delete(
    "/:id",
    verificarToken,
    eliminarNecesidad
);

module.exports = router;