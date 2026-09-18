const express = require("express");

const verificarToken = require(
    "../middleware/authMiddleware"
);

const permitirRoles = require(
    "../middleware/roleMiddleware"
);

const {
    crearUsuario,
    listarUsuarios, 
    cambiarEstadoUsuario,
    restablecerContrasena
} = require("../controllers/usuarioController");

const router = express.Router();

router.post(
    "/",
    verificarToken,
    permitirRoles("Administrador"),
    crearUsuario
);
    
router.get(
    "/",
    verificarToken,
    permitirRoles("Administrador"),
    listarUsuarios
);

router.put(
    "/:id/estado",
    verificarToken,
    permitirRoles("Administrador"),
    cambiarEstadoUsuario
);

router.put(
    "/:id/contrasena",
    verificarToken,
    permitirRoles("Administrador"),
    restablecerContrasena
);
module.exports = router;