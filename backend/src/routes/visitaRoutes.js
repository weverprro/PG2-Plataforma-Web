const express = require("express");
const verificarToken = require("../middleware/authMiddleware");
const permitirRoles = require("../middleware/roleMiddleware");

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
    permitirRoles("Administrador", "Secretaria"),
    crearDisponibilidad
);

router.put(
    "/disponibilidades/:id",
    verificarToken,
    permitirRoles("Administrador", "Secretaria"),
    actualizarDisponibilidad
);

router.post(
    "/solicitudes",
    crearSolicitudVisita
);

router.get(
    "/solicitudes",
    verificarToken,
    permitirRoles("Administrador", "Secretaria"),
    listarSolicitudesVisita
);

router.put(
    "/solicitudes/:id/estado",
    verificarToken,
    permitirRoles("Administrador", "Secretaria"),
    actualizarEstadoSolicitud
);

module.exports = router;