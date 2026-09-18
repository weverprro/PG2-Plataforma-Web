const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/database");
const app = express();
const authRoutes = require("./routes/authRoutes");
const necesidadRoutes = require("./routes/necesidadRoutes");
const contenidoRoutes = require("./routes/contenidoRoutes");
const visitaRoutes = require("./routes/visitaRoutes");
const voluntariadoRoutes = require("./routes/voluntariadoRoutes");
const donacionRoutes = require("./routes/donacionRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/necesidades", necesidadRoutes);
app.use("/api/contenidos", contenidoRoutes);
app.use("/api/donaciones", donacionRoutes);
app.use("/api/visitas", visitaRoutes);
app.use("/api/voluntariado", voluntariadoRoutes);
app.use("/api/usuarios", usuarioRoutes);
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.json({
        mensaje: "API del proyecto PG2 funcionando correctamente"
    });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [resultado] = await pool.query(
            "SELECT DATABASE() AS baseDatos, NOW() AS fechaServidor"
        );

        res.json({
            conexion: "correcta",
            baseDatos: resultado[0].baseDatos,
            fechaServidor: resultado[0].fechaServidor
        });
    } catch (error) {
        console.error("Error de conexión con MySQL:", error.message);

        res.status(500).json({
            conexion: "fallida",
            mensaje: "No fue posible conectar con la base de datos"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});