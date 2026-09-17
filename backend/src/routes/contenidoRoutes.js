const express = require("express");

const verificarToken = require(
    "../middleware/authMiddleware"
);

const {
    listarContenidos,
    obtenerContenido,
    crearContenido,
    actualizarContenido,
    eliminarContenido
} = require("../controllers/contenidoController");

const router = express.Router();

router.get("/", listarContenidos);

router.get("/:id", obtenerContenido);

router.post(
    "/",
    verificarToken,
    crearContenido
);

router.put(
    "/:id",
    verificarToken,
    actualizarContenido
);

router.delete(
    "/:id",
    verificarToken,
    eliminarContenido
);

module.exports = router;