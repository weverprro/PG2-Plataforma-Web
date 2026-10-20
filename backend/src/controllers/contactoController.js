const {
    enviarCorreo
} = require("../services/emailService");

const {
    normalizarTexto,
    tieneLongitudValida,
    correoValido,
    telefonoValido,
    contieneCaracteresControl
} = require("../utils/validation");


function contieneSaltosLinea(texto) {
    return (
        typeof texto === "string" &&
        /[\r\n]/.test(texto)
    );
}


async function enviarMensajeContacto(req, res) {

    try {

        const nombre =
            normalizarTexto(
                req.body.nombre
            );

        const correo =
            normalizarTexto(
                req.body.correo
            ).toLowerCase();

        const telefono =
            normalizarTexto(
                req.body.telefono
            );

        const asunto =
            normalizarTexto(
                req.body.asunto
            );

        const mensaje =
            normalizarTexto(
                req.body.mensaje
            );


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


        if (
            contieneCaracteresControl(
                nombre
            ) ||
            contieneCaracteresControl(
                correo
            ) ||
            contieneCaracteresControl(
                asunto
            ) ||
            contieneCaracteresControl(
                mensaje
            ) ||
            (
                telefono &&
                contieneCaracteresControl(
                    telefono
                )
            )
        ) {

            return res.status(400).json({
                mensaje:
                    "Uno o más campos contienen caracteres no permitidos."
            });

        }


        if (
            contieneSaltosLinea(
                nombre
            ) ||
            contieneSaltosLinea(
                correo
            ) ||
            contieneSaltosLinea(
                asunto
            ) ||
            (
                telefono &&
                contieneSaltosLinea(
                    telefono
                )
            )
        ) {

            return res.status(400).json({
                mensaje:
                    "Nombre, correo, teléfono y asunto deben escribirse en una sola línea."
            });

        }


        if (
            !tieneLongitudValida(
                nombre,
                2,
                100
            )
        ) {

            return res.status(400).json({
                mensaje:
                    "El nombre debe contener entre 2 y 100 caracteres."
            });

        }


        if (
            !correoValido(
                correo
            )
        ) {

            return res.status(400).json({
                mensaje:
                    "El correo electrónico no tiene un formato válido."
            });

        }


        if (
            telefono &&
            !telefonoValido(
                telefono
            )
        ) {

            return res.status(400).json({
                mensaje:
                    "El teléfono debe contener entre 8 y 30 caracteres y solo puede incluir números, espacios, +, -, paréntesis."
            });

        }


        if (
            !tieneLongitudValida(
                asunto,
                3,
                150
            )
        ) {

            return res.status(400).json({
                mensaje:
                    "El asunto debe contener entre 3 y 150 caracteres."
            });

        }


        if (
            !tieneLongitudValida(
                mensaje,
                10,
                3000
            )
        ) {

            return res.status(400).json({
                mensaje:
                    "El mensaje debe contener entre 10 y 3000 caracteres."
            });

        }


        if (
            !process.env.SMTP_USER
        ) {

            console.error(
                "SMTP_USER no está configurado."
            );

            return res.status(500).json({
                mensaje:
                    "No fue posible enviar el mensaje. Intenta nuevamente."
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