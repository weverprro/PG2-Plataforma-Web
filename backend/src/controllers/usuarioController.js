const pool = require("../config/database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const {
    enviarCorreoVerificacion
} = require("../services/emailService");

async function crearUsuario(req, res) {
    try {
        const {
            nombre,
            correo,
            contrasena,
            rol
        } = req.body;

        if (!nombre || !correo || !contrasena || !rol) {
            return res.status(400).json({
                mensaje: "Nombre, correo, contraseña y rol son obligatorios."
            });
        }

        const rolesPermitidos = [
            "Administrador",
            "Secretaria",
            "Contador"
        ];

        if (!rolesPermitidos.includes(rol)) {
            return res.status(400).json({
                mensaje: "El rol proporcionado no es válido."
            });
        }

        const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!correoValido.test(correo)) {
            return res.status(400).json({
                mensaje: "El correo electrónico no tiene un formato válido."
            });
        }

        const [usuariosExistentes] = await pool.execute(
            `SELECT id_usuario
             FROM usuario_administrativo
             WHERE correo = ?
             LIMIT 1`,
            [correo]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(409).json({
                mensaje: "Ya existe un usuario registrado con ese correo."
            });
        }

        const [roles] = await pool.execute(
            `SELECT id_rol
             FROM rol
             WHERE nombre = ?
             AND estado = TRUE
             LIMIT 1`,
            [rol]
        );

        if (roles.length === 0) {
            return res.status(400).json({
                mensaje: "El rol seleccionado no existe o está desactivado."
            });
        }

        const idRol = roles[0].id_rol;

        const contrasenaHash = await bcrypt.hash(
            contrasena,
            10
        );

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
                estado,
                id_rol,
                correo_verificado,
                token_verificacion,
                token_expira
            )
            VALUES (?, ?, ?, TRUE, ?, FALSE, ?, ?)`,
            [
                nombre,
                correo,
                contrasenaHash,
                idRol,
                tokenVerificacion,
                tokenExpira
            ]
        );

        await enviarCorreoVerificacion(
            correo,
            tokenVerificacion
        );

        res.status(201).json({
            mensaje: "Usuario creado correctamente. Se envió un correo de verificación.",
            usuario: {
                idUsuario: resultado.insertId,
                nombre,
                correo,
                rol
            }
        });

    } catch (error) {
        console.error(
            "Error al crear usuario:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al crear el usuario."
        });
    }
}

async function listarUsuarios(req, res) {
    try {
        const [usuarios] = await pool.execute(
            `SELECT
                ua.id_usuario,
                ua.nombre,
                ua.correo,
                ua.estado,
                ua.correo_verificado,
                ua.fecha_creacion,
                r.nombre AS rol
             FROM usuario_administrativo ua
             INNER JOIN rol r
                ON ua.id_rol = r.id_rol
             ORDER BY ua.fecha_creacion DESC`
        );

        res.json(usuarios);

    } catch (error) {
        console.error(
            "Error al listar usuarios:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al obtener los usuarios."
        });
    }
}
async function cambiarEstadoUsuario(req, res) {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (typeof estado !== "boolean") {
            return res.status(400).json({
                mensaje: "El estado debe ser true o false."
            });
        }

        if (Number(id) === req.usuario.idUsuario && estado === false) {
            return res.status(400).json({
                mensaje: "No puedes desactivar tu propia cuenta."
            });
        }

        const [resultado] = await pool.execute(
            `UPDATE usuario_administrativo
             SET estado = ?
             WHERE id_usuario = ?`,
            [estado, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado."
            });
        }

        res.json({
            mensaje: estado
                ? "Usuario activado correctamente."
                : "Usuario desactivado correctamente."
        });

    } catch (error) {
        console.error(
            "Error al cambiar estado del usuario:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al cambiar el estado del usuario."
        });
    }
}

async function restablecerContrasena(req, res) {
    try {
        const { id } = req.params;
        const { nuevaContrasena } = req.body;

        if (!nuevaContrasena) {
            return res.status(400).json({
                mensaje: "La nueva contraseña es obligatoria."
            });
        }

        if (nuevaContrasena.length < 8) {
            return res.status(400).json({
                mensaje: "La contraseña debe tener al menos 8 caracteres."
            });
        }

        const contrasenaHash = await bcrypt.hash(
            nuevaContrasena,
            10
        );

        const [resultado] = await pool.execute(
            `UPDATE usuario_administrativo
             SET contrasena_hash = ?
             WHERE id_usuario = ?`,
            [
                contrasenaHash,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado."
            });
        }

        res.json({
            mensaje: "Contraseña restablecida correctamente."
        });

    } catch (error) {
        console.error(
            "Error al restablecer contraseña:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al restablecer la contraseña."
        });
    }
}

module.exports = {
    crearUsuario,
    listarUsuarios,
    cambiarEstadoUsuario,
    restablecerContrasena
};
