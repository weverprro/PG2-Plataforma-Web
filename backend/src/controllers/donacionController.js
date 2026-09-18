const pool = require("../config/database");
const {
    crearOrdenPaypal,
    obtenerOrdenPaypal,
    capturarOrdenPaypal
} = require("../services/paypalService");

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

        const orden = await crearOrdenPaypal(
            donacion.monto,
            donacion.id_donacion
        );

        const [transaccionesExistentes] = await pool.execute(
            `SELECT
                id_transaccion,
                estado
            FROM transaccion_pago
            WHERE id_donacion = ?
            LIMIT 1`,
            [id]
        );

        if (transaccionesExistentes.length > 0) {

            await pool.execute(
                `UPDATE transaccion_pago
                SET orden_externa = ?,
                    referencia_externa = NULL,
                    proveedor = 'PayPal',
                    estado = ?,
                    monto = ?,
                    moneda = 'USD',
                    fecha = CURRENT_TIMESTAMP
                WHERE id_donacion = ?`,
                [
                    orden.id,
                    orden.status,
                    Number(donacion.monto).toFixed(2),
                    id
                ]
            );

        } else {

            await pool.execute(
                `INSERT INTO transaccion_pago
                (
                    orden_externa,
                    referencia_externa,
                    proveedor,
                    estado,
                    monto,
                    moneda,
                    id_donacion
                )
                VALUES (?, NULL, 'PayPal', ?, ?, 'USD', ?)`,
                [
                    orden.id,
                    orden.status,
                    Number(donacion.monto).toFixed(2),
                    id
                ]
            );
        }

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

        const [registros] = await conexion.execute(
            `SELECT
                d.id_donacion,
                d.tipo_donacion,
                d.monto,
                d.estado,

                tp.id_transaccion,
                tp.orden_externa,
                tp.estado AS estado_transaccion

             FROM donacion d

             LEFT JOIN transaccion_pago tp
                ON d.id_donacion = tp.id_donacion

             WHERE d.id_donacion = ?
             LIMIT 1`,
            [id]
        );

        if (registros.length === 0) {
            return res.status(404).json({
                mensaje: "Donación no encontrada."
            });
        }

        const donacion = registros[0];

        if (donacion.tipo_donacion !== "Monetaria") {
            return res.status(400).json({
                mensaje:
                    "Esta donación no corresponde a un pago electrónico."
            });
        }

        if (!donacion.id_transaccion ||
            !donacion.orden_externa) {

            return res.status(400).json({
                mensaje:
                    "La donación no tiene una orden de PayPal asociada."
            });
        }

        if (donacion.estado === "Confirmada" ||
            donacion.estado_transaccion === "COMPLETED") {

            return res.status(409).json({
                mensaje:
                    "Esta donación ya fue procesada anteriormente."
            });
        }

        /*
         * Consultamos PayPal ANTES de capturar.
         */
        const ordenPaypal = await obtenerOrdenPaypal(
            donacion.orden_externa
        );

        const unidadCompra =
            ordenPaypal.purchase_units?.[0];

        if (!unidadCompra) {
            return res.status(400).json({
                mensaje:
                    "PayPal no devolvió los datos de la orden."
            });
        }

        /*
         * 1. Comprobar que la orden corresponde
         *    a esta donación.
         */
        if (
            String(unidadCompra.reference_id) !==
            String(donacion.id_donacion)
        ) {
            return res.status(400).json({
                mensaje:
                    "La orden de PayPal no corresponde a esta donación."
            });
        }

        /*
         * 2. Comprobar moneda.
         */
        if (
            unidadCompra.amount?.currency_code !== "USD"
        ) {
            return res.status(400).json({
                mensaje:
                    "La moneda de la orden de PayPal no es válida."
            });
        }

        /*
         * 3. Comprobar monto.
         */
        const montoBaseDatos =
            Number(donacion.monto).toFixed(2);

        const montoPaypal =
            Number(
                unidadCompra.amount?.value
            ).toFixed(2);

        if (montoBaseDatos !== montoPaypal) {
            return res.status(400).json({
                mensaje:
                    "El monto de PayPal no coincide con la donación registrada."
            });
        }

        /*
         * 4. Debe haber sido aprobada por el pagador.
         */
        if (ordenPaypal.status !== "APPROVED") {
            return res.status(400).json({
                mensaje:
                    "La orden todavía no ha sido aprobada en PayPal.",
                estadoPaypal: ordenPaypal.status
            });
        }

        /*
         * Después de todas las comprobaciones,
         * hacemos la captura.
         */
        const captura =
            await capturarOrdenPaypal(
                donacion.orden_externa
            );

        if (captura.status !== "COMPLETED") {
            return res.status(400).json({
                mensaje:
                    "PayPal no completó la operación.",
                estadoPaypal: captura.status
            });
        }

        const capturaPago =
            captura.purchase_units?.[0]
                ?.payments
                ?.captures?.[0];

        if (!capturaPago) {
            return res.status(400).json({
                mensaje:
                    "PayPal no devolvió información de la captura."
            });
        }

        /*
         * Verificación final de monto y moneda.
         */
        if (
            capturaPago.amount.currency_code !== "USD" ||
            Number(
                capturaPago.amount.value
            ).toFixed(2) !== montoBaseDatos
        ) {
            return res.status(400).json({
                mensaje:
                    "Los datos de la captura no coinciden con la donación."
            });
        }

        await conexion.beginTransaction();

        await conexion.execute(
            `UPDATE transaccion_pago
             SET referencia_externa = ?,
                 estado = ?,
                 monto = ?,
                 moneda = ?
             WHERE id_transaccion = ?`,
            [
                capturaPago.id,
                capturaPago.status,
                capturaPago.amount.value,
                capturaPago.amount.currency_code,
                donacion.id_transaccion
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
            mensaje:
                "Donación confirmada correctamente.",
            idDonacion: Number(id),
            idOrden: captura.id,
            referenciaPago: capturaPago.id,
            monto: capturaPago.amount.value,
            moneda: capturaPago.amount.currency_code,
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
            mensaje:
                "Ocurrió un error al capturar la orden de PayPal."
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