const { rateLimit } = require("express-rate-limit");


const loginLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    limit: 10,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    skipSuccessfulRequests: true,

    message: {
        mensaje:
            "Demasiados intentos de inicio de sesión. Intenta nuevamente dentro de 15 minutos."
    }

});


const formularioPublicoLimiter = rateLimit({

    windowMs: 10 * 60 * 1000,

    limit: 5,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
        mensaje:
            "Se han realizado demasiadas solicitudes. Intenta nuevamente dentro de unos minutos."
    }

});

const pagoLimiter = rateLimit({

    windowMs: 10 * 60 * 1000,

    limit: 20,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
        mensaje:
            "Se han realizado demasiadas operaciones de pago. Intenta nuevamente dentro de unos minutos."
    }

});

module.exports = {
    loginLimiter,
    formularioPublicoLimiter,
    pagoLimiter
};
