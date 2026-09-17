const express = require("express");
const verificarToken = require("../middleware/authMiddleware");

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
    crearActividad
);

router.put(
    "/actividades/:id",
    verificarToken,
    actualizarActividad
);

router.post(
    "/solicitudes",
    crearSolicitudVoluntariado
);

router.get(
    "/solicitudes",
    verificarToken,
    listarSolicitudesVoluntariado
);

router.put(
    "/solicitudes/:id/estado",
    verificarToken,
    actualizarEstadoSolicitud
);

module.exports = router;