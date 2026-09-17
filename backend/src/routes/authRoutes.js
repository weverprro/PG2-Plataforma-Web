const express = require("express");
const pool = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verificarToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/verificar-correo", async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                mensaje: "Token de verificación no proporcionado."
            });
        }

        const [usuarios] = await pool.execute(
            `SELECT id_usuario
             FROM usuario_administrativo
             WHERE token_verificacion = ?
             AND token_expira > NOW()
             AND correo_verificado = FALSE`,
            [token]
        );

        if (usuarios.length === 0) {
            return res.status(400).json({
                mensaje: "El enlace de verificación no es válido o ha expirado."
            });
        }

        const idUsuario = usuarios[0].id_usuario;

        await pool.execute(
            `UPDATE usuario_administrativo
             SET correo_verificado = TRUE,
                 token_verificacion = NULL,
                 token_expira = NULL
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        res.json({
            mensaje: "Correo electrónico verificado correctamente."
        });

    } catch (error) {
        console.error("Error verificando correo:", error.message);

        res.status(500).json({
            mensaje: "Ocurrió un error al verificar el correo."
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        if (!correo || !contrasena) {
            return res.status(400).json({
                mensaje: "Correo y contraseña son obligatorios."
            });
        }

        const [usuarios] = await pool.execute(
            `SELECT 
                ua.id_usuario,
                ua.nombre,
                ua.correo,
                ua.contrasena_hash,
                ua.estado,
                ua.correo_verificado,
                r.id_rol,
                r.nombre AS rol
             FROM usuario_administrativo ua
             INNER JOIN rol r
                ON ua.id_rol = r.id_rol
             WHERE ua.correo = ?
             LIMIT 1`,
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos."
            });
        }

        const usuario = usuarios[0];

        if (!usuario.estado) {
            return res.status(403).json({
                mensaje: "La cuenta se encuentra desactivada."
            });
        }

        if (!usuario.correo_verificado) {
            return res.status(403).json({
                mensaje: "Debes verificar tu correo electrónico antes de iniciar sesión."
            });
        }

        const contrasenaCorrecta = await bcrypt.compare(
            contrasena,
            usuario.contrasena_hash
        );

        if (!contrasenaCorrecta) {
            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos."
            });
        }

        const token = jwt.sign(
            {
                idUsuario: usuario.id_usuario,
                idRol: usuario.id_rol,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        res.json({
            mensaje: "Inicio de sesión correcto.",
            token,
            usuario: {
                idUsuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error("Error al iniciar sesión:", error.message);

        res.status(500).json({
            mensaje: "Ocurrió un error al iniciar sesión."
        });
    }
});

router.get("/perfil", verificarToken, async (req, res) => {
    try {
        const [usuarios] = await pool.execute(
            `SELECT
                ua.id_usuario,
                ua.nombre,
                ua.correo,
                ua.estado,
                ua.correo_verificado,
                r.nombre AS rol
             FROM usuario_administrativo ua
             INNER JOIN rol r
                ON ua.id_rol = r.id_rol
             WHERE ua.id_usuario = ?
             LIMIT 1`,
            [req.usuario.idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado."
            });
        }

        res.json({
            usuario: usuarios[0]
        });

    } catch (error) {
        console.error(
            "Error obteniendo perfil:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al obtener el perfil."
        });
    }
});
module.exports = router;