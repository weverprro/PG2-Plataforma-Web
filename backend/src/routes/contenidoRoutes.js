const express = require("express");
const verificarToken = require("../middleware/authMiddleware");
const permitirRoles = require("../middleware/roleMiddleware");

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
    permitirRoles("Administrador"),
    crearContenido
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

module.exports = router;