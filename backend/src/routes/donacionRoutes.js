const express = require("express");
const verificarToken = require("../middleware/authMiddleware");

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
    obtenerDonacion
);

router.put(
    "/:id/estado",
    verificarToken,
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