const express = require("express");
const verificarToken = require("../middleware/authMiddleware");

const {
    listarDisponibilidades,
    crearDisponibilidad,
    actualizarDisponibilidad,
    crearSolicitudVisita,
    listarSolicitudesVisita,
    actualizarEstadoSolicitud
} = require("../controllers/visitaController");

const router = express.Router();

router.get(
    "/disponibilidades",
    listarDisponibilidades
);

router.post(
    "/disponibilidades",
    verificarToken,
    crearDisponibilidad
);

router.put(
    "/disponibilidades/:id",
    verificarToken,
    actualizarDisponibilidad
);

router.post(
    "/solicitudes",
    crearSolicitudVisita
);

router.get(
    "/solicitudes",
    verificarToken,
    listarSolicitudesVisita
);

router.put(
    "/solicitudes/:id/estado",
    verificarToken,
    actualizarEstadoSolicitud
);

module.exports = router;