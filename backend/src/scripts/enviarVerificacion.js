require("dotenv").config();

const pool = require("../config/database");
const {
    enviarCorreoVerificacion
} = require("../services/emailService");

async function enviarVerificacion() {
    try {
        const [usuarios] = await pool.execute(
            `SELECT correo, token_verificacion
             FROM usuario_administrativo
             WHERE correo_verificado = FALSE
             LIMIT 1`
        );

        if (usuarios.length === 0) {
            console.log(
                "No existen usuarios pendientes de verificación."
            );
            process.exit(0);
        }

        const usuario = usuarios[0];

        if (!usuario.token_verificacion) {
            console.log(
                "El usuario no tiene un token de verificación."
            );
            process.exit(1);
        }

        console.log("Enviando correo de verificación a:", usuario.correo);

        await enviarCorreoVerificacion(
            usuario.correo,
            usuario.token_verificacion
        );

        console.log(
            "Correo de verificación enviado correctamente."
        );

        process.exit(0);

    } catch (error) {
        console.error(
            "Error al enviar el correo:",
            error.message
        );

        process.exit(1);
    }
}

enviarVerificacion();