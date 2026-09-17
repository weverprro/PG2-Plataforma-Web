const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            mensaje: "Token de acceso no proporcionado."
        });
    }

    const partes = authHeader.split(" ");

    if (partes.length !== 2 || partes[0] !== "Bearer") {
        return res.status(401).json({
            mensaje: "Formato de token inválido."
        });
    }

    const token = partes[1];

    try {
        const datos = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario = datos;

        next();

    } catch (error) {
        return res.status(401).json({
            mensaje: "Token inválido o expirado."
        });
    }
}

module.exports = verificarToken;