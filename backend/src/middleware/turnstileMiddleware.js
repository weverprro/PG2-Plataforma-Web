async function verificarTurnstile(req, res, next) {

    try {

        const token =
            req.body.turnstileToken;


        if (!token) {

            return res.status(400).json({
                mensaje:
                    "Completa la verificación de seguridad antes de continuar."
            });

        }


        const secretKey =
            process.env.TURNSTILE_SECRET_KEY;


        if (!secretKey) {

            console.error(
                "TURNSTILE_SECRET_KEY no está configurada."
            );

            return res.status(500).json({
                mensaje:
                    "La verificación de seguridad no está disponible."
            });

        }


        const respuesta =
            await fetch(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        secret:
                            secretKey,

                        response:
                            token,

                        remoteip:
                            req.ip
                    })
                }
            );


        const resultado =
            await respuesta.json();


        if (!resultado.success) {

            console.log(
                "Turnstile rechazado:",
                resultado["error-codes"]
            );


            return res.status(403).json({
                mensaje:
                    "No fue posible validar la verificación de seguridad. Intenta nuevamente."
            });

        }


        next();


    } catch (error) {

        console.error(
            "Error verificando Turnstile:",
            error
        );


        return res.status(500).json({
            mensaje:
                "Ocurrió un problema al realizar la verificación de seguridad."
        });

    }

}


module.exports = {
    verificarTurnstile
};