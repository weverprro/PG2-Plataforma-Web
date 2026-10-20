const express = require("express");
const verificarToken = require("../middleware/authMiddleware");
const permitirRoles = require("../middleware/roleMiddleware");
const { formularioPublicoLimiter } = require("../middleware/rateLimitMiddleware");
const { verificarTurnstile } = require("../middleware/turnstileMiddleware");

const {
    listarActividades,
    crearActividad,
    actualizarActividad,
    crearSolicitudVoluntariado,
    listarSolicitudesVoluntariado,
    actualizarEstadoSolicitud
} = require("../controllers/voluntariadoController");

const router = express.Router();

router.get(
    "/actividades",
    listarActividades
);

router.post(
    "/actividades",
    verificarToken,
    permitirRoles("Administrador", "Secretaria"),
    crearActividad
);

router.put(
    "/actividades/:id",
    verificarToken,
    permitirRoles("Administrador", "Secretaria"),
    actualizarActividad
);

router.post(
    "/solicitudes",
    formularioPublicoLimiter,
    verificarTurnstile,
    crearSolicitudVoluntariado
);

router.get(
    "/solicitudes",
    verificarToken,
    permitirRoles("Administrador", "Secretaria"),
    listarSolicitudesVoluntariado
);

router.put(
    "/solicitudes/:id/estado",
    verificarToken,
    permitirRoles("Administrador", "Secretaria"),
    actualizarEstadoSolicitud
);

module.exports = router;