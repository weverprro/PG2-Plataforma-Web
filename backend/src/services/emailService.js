const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function enviarCorreoVerificacion(correo, token) {
    const enlaceVerificacion =
        `${process.env.BACKEND_URL}/api/auth/verificar-correo?token=${token}`;

    await transporter.sendMail({
        from: `"Plataforma PG2" <${process.env.SMTP_USER}>`,
        to: correo,
        subject: "Verificación de correo electrónico",

        text:
            `Para verificar tu correo electrónico, visita el siguiente enlace: ${enlaceVerificacion}`,

        html: `
            <h2>Verificación de correo electrónico</h2>

            <p>
                Se ha creado una cuenta administrativa en la plataforma.
            </p>

            <p>
                Para verificar el correo electrónico, utiliza el siguiente enlace:
            </p>

            <p>
                <a href="${enlaceVerificacion}">
                    Verificar correo electrónico
                </a>
            </p>

            <p>
                Este enlace tiene una duración limitada.
            </p>
        `
    });
}

module.exports = {
    enviarCorreoVerificacion
};