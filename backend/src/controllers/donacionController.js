const pool = require("../config/database");
const {crearOrdenPaypal,capturarOrdenPaypal} = require("../services/paypalService");

async function obtenerTiposDonacion(req, res) {
    res.json([
        {
            codigo: "Monetaria",
            descripcion: "Donación realizada mediante aporte económico."
        },
        {
            codigo: "Especie",
            descripcion: "Donación de alimentos, ropa, medicamentos u otros bienes."
        }
    ]);
}

async function crearDonacion(req, res) {
    try {
        const {
            nombreDonante,
            correoDonante,
            tipoDonacion,
            monto,
            descripcion
        } = req.body;

        const tiposPermitidos = [
            "Monetaria",
            "Especie"
        ];

        if (!tipoDonacion) {
            return res.status(400).json({
                mensaje: "El tipo de donación es obligatorio."
            });
        }

        if (!tiposPermitidos.includes(tipoDonacion)) {
            return res.status(400).json({
                mensaje: "Tipo de donación no válido."
            });
        }

        if (correoDonante) {
            const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!correoValido.test(correoDonante)) {
                return res.status(400).json({
                    mensaje: "El correo electrónico no tiene un formato válido."
                });
            }
        }

        if (tipoDonacion === "Monetaria") {
            if (!monto || Number(monto) <= 0) {
                return res.status(400).json({
                    mensaje: "Las donaciones monetarias requieren un monto mayor que cero."
                });
            }
        }

        if (
            tipoDonacion === "Especie" &&
            !descripcion
        ) {
            return res.status(400).json({
                mensaje: "Las donaciones en especie requieren una descripción."
            });
        }

        const [resultado] = await pool.execute(
            `INSERT INTO donacion
            (
                nombre_donante,
                correo_donante,
                tipo_donacion,
                monto,
                descripcion,
                estado
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                nombreDonante || null,
                correoDonante || null,
                tipoDonacion,
                tipoDonacion === "Monetaria"
                    ? monto
                    : null,
                descripcion || null,
                "Pendiente"
            ]
        );

        res.status(201).json({
            mensaje: "Donación registrada correctamente.",
            idDonacion: resultado.insertId,
            requierePago:
                tipoDonacion === "Monetaria"
        });

    } catch (error) {
        console.error(
            "Error al registrar donación:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al registrar la donación."
        });
    }
}

async function listarDonaciones(req, res) {
    try {
        const [donaciones] = await pool.execute(
            `SELECT
                id_donacion,
                nombre_donante,
                correo_donante,
                tipo_donacion,
                monto,
                descripcion,
                fecha,
                estado
             FROM donacion
             ORDER BY fecha DESC`
        );

        res.json(donaciones);

    } catch (error) {
        console.error(
            "Error al listar donaciones:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al obtener las donaciones."
        });
    }
}

async function obtenerDonacion(req, res) {
    try {
        const { id } = req.params;

        const [donaciones] = await pool.execute(
            `SELECT
                d.id_donacion,
                d.nombre_donante,
                d.correo_donante,
                d.tipo_donacion,
                d.monto,
                d.descripcion,
                d.fecha,
                d.estado,
                tp.id_transaccion,
                tp.referencia_externa,
                tp.proveedor,
                tp.estado AS estado_transaccion,
                tp.fecha AS fecha_transaccion
             FROM donacion d
             LEFT JOIN transaccion_pago tp
                ON d.id_donacion = tp.id_donacion
             WHERE d.id_donacion = ?
             LIMIT 1`,
            [id]
        );

        if (donaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Donación no encontrada."
            });
        }

        res.json(donaciones[0]);

    } catch (error) {
        console.error(
            "Error al obtener donación:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al obtener la donación."
        });
    }
}

async function actualizarEstadoDonacion(req, res) {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosPermitidos = [
            "Pendiente",
            "Confirmada",
            "Recibida",
            "Cancelada"
        ];

        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                mensaje: "Estado de donación no válido."
            });
        }

        const [resultado] = await pool.execute(
            `UPDATE donacion
             SET estado = ?
             WHERE id_donacion = ?`,
            [estado, id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Donación no encontrada."
            });
        }

        res.json({
            mensaje: "Estado de la donación actualizado correctamente."
        });

    } catch (error) {
        console.error(
            "Error al actualizar donación:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al actualizar la donación."
        });
    }
}

async function crearOrdenPago(req, res) {
    try {
        const { id } = req.params;

        const [donaciones] = await pool.execute(
            `SELECT
                id_donacion,
                tipo_donacion,
                monto,
                estado
             FROM donacion
             WHERE id_donacion = ?
             LIMIT 1`,
            [id]
        );

        if (donaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Donación no encontrada."
            });
        }

        const donacion = donaciones[0];

        if (donacion.tipo_donacion !== "Monetaria") {
            return res.status(400).json({
                mensaje: "Esta donación no requiere pago electrónico."
            });
        }

        if (donacion.estado !== "Pendiente") {
            return res.status(400).json({
                mensaje: "La donación ya no se encuentra pendiente."
            });
        }

        const [transacciones] = await pool.execute(
            `SELECT id_transaccion
             FROM transaccion_pago
             WHERE id_donacion = ?
             LIMIT 1`,
            [id]
        );

        if (transacciones.length > 0) {
            return res.status(400).json({
                mensaje: "Esta donación ya tiene una transacción asociada."
            });
        }

        const orden = await crearOrdenPaypal(
            donacion.monto,
            donacion.id_donacion
        );

        console.log(
            "Respuesta completa de PayPal:",
            JSON.stringify(orden, null, 2)
        );

        const enlaceAprobacion = orden.links?.find(
            enlace =>
                enlace.rel === "approve" ||
                enlace.rel === "payer-action"
        );

        res.status(201).json({
            mensaje: "Orden de PayPal creada correctamente.",
            idOrden: orden.id,
            estado: orden.status,
            enlaceAprobacion:
                enlaceAprobacion?.href || null
        });

    } catch (error) {
        console.error(
            "Error creando orden PayPal:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al crear la orden de PayPal."
        });
    }
}
async function capturarOrdenPago(req, res) {
    const conexion = await pool.getConnection();

    try {
        const { id } = req.params;
        const { idOrden } = req.body;

        if (!idOrden) {
            return res.status(400).json({
                mensaje: "El ID de la orden de PayPal es obligatorio."
            });
        }

        const [donaciones] = await conexion.execute(
            `SELECT
                id_donacion,
                tipo_donacion,
                monto,
                estado
             FROM donacion
             WHERE id_donacion = ?
             LIMIT 1`,
            [id]
        );

        if (donaciones.length === 0) {
            return res.status(404).json({
                mensaje: "Donación no encontrada."
            });
        }

        const donacion = donaciones[0];

        if (donacion.tipo_donacion !== "Monetaria") {
            return res.status(400).json({
                mensaje: "Esta donación no corresponde a un pago electrónico."
            });
        }

        const captura = await capturarOrdenPaypal(idOrden);

        if (captura.status !== "COMPLETED") {
            return res.status(400).json({
                mensaje: "La orden no fue completada por PayPal."
            });
        }

        const capturaPago =
            captura.purchase_units?.[0]?.payments?.captures?.[0];

        if (!capturaPago) {
            return res.status(400).json({
                mensaje: "PayPal no devolvió información de la captura."
            });
        }

        await conexion.beginTransaction();

        await conexion.execute(
            `INSERT INTO transaccion_pago
            (
                referencia_externa,
                proveedor,
                estado,
                monto,
                id_donacion
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                capturaPago.id,
                "PayPal",
                capturaPago.status,
                capturaPago.amount.value,
                id
            ]
        );

        await conexion.execute(
            `UPDATE donacion
             SET estado = 'Confirmada'
             WHERE id_donacion = ?`,
            [id]
        );

        await conexion.commit();

        res.json({
            mensaje: "Donación confirmada correctamente.",
            idDonacion: Number(id),
            idOrden: captura.id,
            referenciaPago: capturaPago.id,
            estado: captura.status
        });

    } catch (error) {
        try {
            await conexion.rollback();
        } catch (_) {}

        console.error(
            "Error capturando orden PayPal:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al capturar la orden de PayPal."
        });

    } finally {
        conexion.release();
    }
}
    
module.exports = {
    obtenerTiposDonacion,
    crearDonacion,
    listarDonaciones,
    obtenerDonacion,
    actualizarEstadoDonacion,
    crearOrdenPago,
    capturarOrdenPago
};