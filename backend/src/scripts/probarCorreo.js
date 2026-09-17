require("dotenv").config();

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

async function probarCorreo() {
    try {
        await transporter.verify();

        console.log("Conexión SMTP correcta.");

        const info = await transporter.sendMail({
            from: `"PG2 - Prueba" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER,
            subject: "Prueba de correo PG2",
            text: "Si recibiste este mensaje, Nodemailer está funcionando correctamente."
        });

        console.log("Correo aceptado por Gmail.");
        console.log("Message ID:", info.messageId);

    } catch (error) {
        console.error("Error SMTP:");
        console.error(error);
    }
}

probarCorreo();