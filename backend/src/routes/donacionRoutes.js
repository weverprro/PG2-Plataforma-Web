const express = require("express");
const verificarToken = require("../middleware/authMiddleware");
const permitirRoles = require("../middleware/roleMiddleware");

const {
    obtenerTiposDonacion,
    crearDonacion,
    listarDonaciones,
    obtenerDonacion,
    actualizarEstadoDonacion,
    crearOrdenPago,
    capturarOrdenPago
} = require("../controllers/donacionController");

const router = express.Router();

router.get(
    "/tipos",
    obtenerTiposDonacion
);

router.post(
    "/",
    crearDonacion
);

router.get(
    "/",
    verificarToken,
    permitirRoles("Administrador", "Secretaria","Contador"),
    listarDonaciones
);
router.post(
    "/:id/paypal/crear-orden",
    crearOrdenPago
);
router.post(
    "/:id/paypal/capturar",
    capturarOrdenPago
);

router.get(
    "/:id",
    verificarToken,
    permitirRoles("Administrador", "Secretaria","Contador"),
    obtenerDonacion
);

router.put(
    "/:id/estado",
    verificarToken,
    permitirRoles("Administrador","Contador"),
    actualizarEstadoDonacion
);

router.get("/paypal/retorno", (req, res) => {
    res.json({
        mensaje: "Pago aprobado en PayPal.",
        token: req.query.token,
        payerId: req.query.PayerID
    });
});

router.get("/paypal/cancelado", (req, res) => {
    res.json({
        mensaje: "El pago fue cancelado."
    });
});

module.exports = router;