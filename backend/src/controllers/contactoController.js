const {
    enviarCorreo
} = require("../services/emailService");


async function enviarMensajeContacto(req, res) {

    try {

        const {
            nombre,
            correo,
            telefono,
            asunto,
            mensaje
        } = req.body;


        if (
            !nombre ||
            !correo ||
            !asunto ||
            !mensaje
        ) {

            return res.status(400).json({
                mensaje:
                    "Nombre, correo, asunto y mensaje son obligatorios."
            });

        }


        const correoValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (
            !correoValido.test(
                correo
            )
        ) {

            return res.status(400).json({
                mensaje:
                    "El correo electrónico no tiene un formato válido."
            });

        }


        if (
            mensaje.trim().length < 10
        ) {

            return res.status(400).json({
                mensaje:
                    "El mensaje debe contener al menos 10 caracteres."
            });

        }


        /*
         * Enviar mensaje al correo
         * configurado para el asilo.
         */
        await enviarCorreo({

            para:
                process.env.SMTP_USER,

            asunto:
                `Contacto web: ${asunto}`,

            texto:
`Se recibió un nuevo mensaje desde la página web.

Nombre:
${nombre}

Correo:
${correo}

Teléfono:
${telefono || "No proporcionado"}

Asunto:
${asunto}

Mensaje:
${mensaje}

Este mensaje fue enviado desde el formulario de contacto de la plataforma web.`

        });


        /*
         * Confirmación al visitante.
         * Si esta confirmación falla,
         * el mensaje principal ya fue
         * recibido por el asilo.
         */
        let confirmacionEnviada =
            false;


        try {

            await enviarCorreo({

                para:
                    correo,

                asunto:
                    "Hemos recibido tu mensaje",

                texto:
`Hola ${nombre},

Hemos recibido correctamente tu mensaje enviado al Mesón Buen Samaritano.

Asunto:
${asunto}

Nuestro personal podrá comunicarse contigo utilizando los datos proporcionados.

Gracias por comunicarte con nosotros.

Mesón Buen Samaritano`

            });


            confirmacionEnviada =
                true;


        } catch (
            errorConfirmacion
        ) {

            console.error(
                "El mensaje fue recibido, pero no se pudo enviar la confirmación:",
                errorConfirmacion
            );

        }


        return res.status(201).json({

            mensaje:
                confirmacionEnviada
                    ? "Mensaje enviado correctamente. Te enviamos un correo de confirmación."
                    : "Mensaje enviado correctamente.",

            confirmacionEnviada

        });


    } catch (error) {

        console.error(
            "Error al enviar mensaje de contacto:",
            error
        );


        return res.status(500).json({
            mensaje:
                "No fue posible enviar el mensaje. Intenta nuevamente."
        });

    }

}


module.exports = {
    enviarMensajeContacto
};