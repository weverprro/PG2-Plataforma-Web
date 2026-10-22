const pool = require("../config/database");

const proveedoresPermitidos = ["PayPal", "Recurrente"];

async function listarTransacciones(req, res) {
    try {
        const proveedor = req.query.proveedor;
        if (proveedor && !proveedoresPermitidos.includes(proveedor)) {
            return res.status(400).json({ mensaje: "Proveedor no válido." });
        }

        const parametros = [];
        let condicion = "";
        if (proveedor) {
            condicion = "WHERE tp.proveedor = ?";
            parametros.push(proveedor);
        }

        const [transacciones] = await pool.execute(
            `SELECT
                tp.id_transaccion, tp.orden_externa, tp.referencia_externa,
                tp.proveedor, tp.estado, tp.monto, tp.moneda,
                tp.fecha, tp.id_donacion,
                d.nombre_donante, d.correo_donante,
                d.tipo_donacion, d.estado AS estado_donacion
             FROM transaccion_pago tp
             INNER JOIN donacion d ON d.id_donacion = tp.id_donacion
             ${condicion}
             ORDER BY tp.fecha DESC, tp.id_transaccion DESC`,
            parametros
        );
        return res.json({ transacciones });
    } catch (error) {
        console.error("Error al listar transacciones:", error);
        return res.status(500).json({ mensaje: "Ocurrió un error al obtener las transacciones." });
    }
}

async function obtenerTransaccion(req, res) {
    try {
        const [transacciones] = await pool.execute(
            `SELECT
                tp.id_transaccion, tp.orden_externa, tp.referencia_externa,
                tp.proveedor, tp.estado, tp.monto, tp.moneda,
                tp.fecha, tp.id_donacion,
                d.nombre_donante, d.correo_donante,
                d.tipo_donacion, d.estado AS estado_donacion
             FROM transaccion_pago tp
             INNER JOIN donacion d ON d.id_donacion = tp.id_donacion
             WHERE tp.id_transaccion = ? LIMIT 1`,
            [req.params.id]
        );
        if (!transacciones.length) {
            return res.status(404).json({ mensaje: "Transacción no encontrada." });
        }
        return res.json(transacciones[0]);
    } catch (error) {
        console.error("Error al obtener transacción:", error);
        return res.status(500).json({ mensaje: "Ocurrió un error al obtener la transacción." });
    }
}

module.exports = { listarTransacciones, obtenerTransaccion };
