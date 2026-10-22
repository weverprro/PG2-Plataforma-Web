const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const pool = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const necesidadRoutes = require("./routes/necesidadRoutes");
const contenidoRoutes = require("./routes/contenidoRoutes");
const visitaRoutes = require("./routes/visitaRoutes");
const voluntariadoRoutes = require("./routes/voluntariadoRoutes");
const donacionRoutes = require("./routes/donacionRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const publicacionRoutes = require("./routes/publicacionRoutes");
const transaccionRoutes = require("./routes/transaccionRoutes");
const rolRoutes = require("./routes/rolRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const contactoRoutes = require("./routes/contactoRoutes");
const recurrenteRoutes = require("./routes/recurrenteRoutes");

const app = express();

const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

app.use(
    cors({
        origin: frontendUrl,
        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "../uploads"
        )
    )
);

/*
 * El webhook de Recurrente necesita
 * recibir el body original para validar
 * correctamente la firma de Svix.
 *
 * Debe estar antes de express.json().
 */
app.use(
    "/api/recurrente/webhook",
    express.raw({
        type: "application/json"
    })
);

app.use(express.json());

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/necesidades",
    necesidadRoutes
);

app.use(
    "/api/contenidos",
    contenidoRoutes
);

app.use(
    "/api/donaciones",
    donacionRoutes
);

app.use(
    "/api/visitas",
    visitaRoutes
);

app.use(
    "/api/voluntariado",
    voluntariadoRoutes
);

app.use(
    "/api/usuarios",
    usuarioRoutes
);

app.use(
    "/api/publicaciones",
    publicacionRoutes
);

app.use(
    "/api/transacciones",
    transaccionRoutes
);

app.use(
    "/api/roles",
    rolRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);

app.use(
    "/api/contacto",
    contactoRoutes
);

app.use(
    "/api/recurrente",
    recurrenteRoutes
);

const PORT =
    process.env.PORT ||
    3000;

app.get(
    "/",
    (req, res) => {
        res.json({
            mensaje:
                "API del proyecto PG2 funcionando correctamente"
        });
    }
);

app.get(
    "/api/test-db",
    async (req, res) => {
        try {
            const [resultado] =
                await pool.query(
                    "SELECT DATABASE() AS baseDatos, NOW() AS fechaServidor"
                );

            res.json({
                conexion:
                    "correcta",
                baseDatos:
                    resultado[0].baseDatos,
                fechaServidor:
                    resultado[0].fechaServidor
            });

        } catch (error) {
            console.error(
                "Error de conexión con MySQL:",
                error.message
            );

            res.status(500).json({
                conexion:
                    "fallida",
                mensaje:
                    "No fue posible conectar con la base de datos"
            });
        }
    }
);

app.listen(
    PORT,
    () => {
        console.log(
            `Servidor ejecutándose en el puerto ${PORT}`
        );
    }
);