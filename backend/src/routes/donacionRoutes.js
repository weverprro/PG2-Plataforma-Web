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
    "/paypal/retorno",
    (req, res) => {

        const {
            token,
            PayerID
        } = req.query;


        const frontend =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";


        const destino =
            `${frontend}/donaciones` +
            `?paypal=aprobado` +
            `&token=${encodeURIComponent(token || "")}` +
            `&payerId=${encodeURIComponent(PayerID || "")}`;


        return res.redirect(
            destino
        );
    }
);

router.get(
    "/paypal/cancelado",
    (req, res) => {

        const frontend =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";


        return res.redirect(
            `${frontend}/donaciones?paypal=cancelado`
        );
    }
);

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
    permitirRoles(
        "Administrador",
        "Secretaria",
        "Contador"
    ),
    actualizarEstadoDonacion
);


module.exports = router;