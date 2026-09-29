const express =
    require("express");

const {
    enviarMensajeContacto
} = require(
    "../controllers/contactoController"
);


const router =
    express.Router();


/*
 * Ruta pública:
 * no requiere iniciar sesión.
 */
router.post(
    "/",
    enviarMensajeContacto
);


module.exports =
    router;