const express = require("express");

const {
    pagoLimiter
} = require("../middleware/rateLimitMiddleware");

const {
    recibirWebhook,
    crearCheckoutDonacion,
    confirmarCheckout
} = require(
    "../controllers/recurrenteController"
);

const router = express.Router();

router.post(
    "/webhook",
    recibirWebhook
);

router.post(
    "/crear-checkout",
    pagoLimiter,
    crearCheckoutDonacion
);

router.post(
    "/confirmar-checkout",
    pagoLimiter,
    confirmarCheckout
);

module.exports = router;
