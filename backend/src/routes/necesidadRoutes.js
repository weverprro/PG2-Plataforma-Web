const express = require("express");
const verificarToken = require("../middleware/authMiddleware");
const permitirRoles = require("../middleware/roleMiddleware");
const {
    listarNecesidades,
    listarNecesidadesAdmin,
    obtenerNecesidad,
    crearNecesidad,
    actualizarNecesidad,
    cambiarEstadoNecesidad,
    eliminarNecesidad
} = require("../controllers/necesidadController");

const router = express.Router();
const autorizar = [verificarToken, permitirRoles("Administrador", "Secretaria")];

// Declarar la ruta específica antes de /:id.
router.get("/admin/listado", ...autorizar, listarNecesidadesAdmin);
router.get("/", listarNecesidades);
router.get("/:id", obtenerNecesidad);
router.post("/", ...autorizar, crearNecesidad);
router.put("/:id/estado", ...autorizar, cambiarEstadoNecesidad);
router.put("/:id", ...autorizar, actualizarNecesidad);
router.delete("/:id", ...autorizar, eliminarNecesidad);

module.exports = router;
