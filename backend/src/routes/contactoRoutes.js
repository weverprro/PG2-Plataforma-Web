const express =require("express");
const {enviarMensajeContacto} = require("../controllers/contactoController");
const { formularioPublicoLimiter } = require("../middleware/rateLimitMiddleware");
const { verificarTurnstile } =require("../middleware/turnstileMiddleware");

const router =express.Router();


/*
 * Ruta pública:
 * no requiere iniciar sesión.
 */
router.post("/", formularioPublicoLimiter, verificarTurnstile, enviarMensajeContacto);


module.exports =
    router;