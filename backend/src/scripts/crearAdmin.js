require("dotenv").config();


const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("../config/database");
const { enviarCorreoVerificacion } = require("../services/emailService");

async function crearAdministrador() {
    try {
        const nombre = "Administrador Principal";
        const correo = "luisfearre14@gmail.com";
        const contrasena = "Cambiar123!";

        const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!correoValido.test(correo)) {
            console.log("El correo electrónico no tiene un formato válido.");
            process.exit(1);
        }

        const [usuariosExistentes] = await pool.execute(
            "SELECT id_usuario FROM usuario_administrativo WHERE correo = ?",
            [correo]
        );

        if (usuariosExistentes.length > 0) {
            console.log("Ya existe un usuario registrado con ese correo.");
            process.exit(1);
        }

        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        const tokenVerificacion = crypto
            .randomBytes(32)
            .toString("hex");

        const tokenExpira = new Date(
            Date.now() + 60 * 60 * 1000
        );

        const [resultado] = await pool.execute(
            `INSERT INTO usuario_administrativo
            (
                nombre,
                correo,
                contrasena_hash,
                id_rol,
                correo_verificado,
                token_verificacion,
                token_expira
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre,
                correo,
                contrasenaHash,
                1,
                false,
                tokenVerificacion,
                tokenExpira
            ]
        );

        await enviarCorreoVerificacion(
            correo,
            tokenVerificacion
        );

        console.log("Administrador creado correctamente.");
        console.log("ID:", resultado.insertId);
        console.log("Correo de verificación enviado.");

        process.exit(0);

    } catch (error) {
        console.error(
            "Error al crear administrador:",
            error.message
        );

        process.exit(1);
    }
}

crearAdministrador();