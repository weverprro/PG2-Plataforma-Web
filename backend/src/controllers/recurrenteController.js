const {Webhook} = require("svix");
const pool = require("../config/database");

const {
    crearCheckout,
    obtenerCheckout
} = require("../services/recurrenteService");

async function procesarCheckoutPagado(
    idCheckout,
    idEventoWebhook = null
) {
    const checkout =
        await obtenerCheckout(idCheckout);

    if (checkout.status !== "paid") {
        const error =
            new Error(
                "El checkout todavía no está pagado."
            );

        error.codigo = "CHECKOUT_NO_PAGADO";
        throw error;
    }

    const idDonacion =
        Number(
            checkout.metadata?.id_donacion
        );

    if (
        !Number.isInteger(idDonacion) ||
        idDonacion <= 0
    ) {
        const error =
            new Error(
                "El checkout no contiene una donación asociada válida."
            );

        error.codigo = "DONACION_NO_ASOCIADA";
        throw error;
    }

    const referenciaExterna =
        checkout.latest_intent?.id;

    if (!referenciaExterna) {
        const error =
            new Error(
                "No se encontró la referencia del pago."
            );

        error.codigo = "REFERENCIA_NO_ENCONTRADA";
        throw error;
    }

    const monto =
        checkout.total_in_cents / 100;

    const moneda =
        checkout.currency;

    const conexion =
        await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const [donaciones] =
            await conexion.query(
                `SELECT
                    id_donacion,
                    tipo_donacion,
                    monto,
                    moneda,
                    estado
                 FROM donacion
                 WHERE id_donacion = ?
                 LIMIT 1
                 FOR UPDATE`,
                [idDonacion]
            );

        if (donaciones.length === 0) {
            const error =
                new Error(
                    "La donación asociada no existe."
                );

            error.codigo =
                "DONACION_NO_ENCONTRADA";

            throw error;
        }

        const donacion =
            donaciones[0];

        if (
            donacion.tipo_donacion !==
            "Monetaria"
        ) {
            const error =
                new Error(
                    "La donación asociada no es monetaria."
                );

            error.codigo =
                "DONACION_NO_MONETARIA";

            throw error;
        }

        if (donacion.moneda !== "GTQ") {
            const error =
                new Error(
                    "La donación no corresponde a Recurrente."
                );

            error.codigo =
                "MONEDA_NO_VALIDA";

            throw error;
        }

        if (
            Number(donacion.monto).toFixed(2) !==
            Number(monto).toFixed(2)
        ) {
            const error =
                new Error(
                    "El monto pagado no coincide con la donación registrada."
                );

            error.codigo =
                "MONTO_NO_COINCIDE";

            throw error;
        }

        if (moneda !== donacion.moneda) {
            const error =
                new Error(
                    "La moneda del checkout no coincide con la donación."
                );

            error.codigo =
                "MONEDA_NO_COINCIDE";

            throw error;
        }

        const [existentes] =
            await conexion.query(
                `SELECT id_transaccion
                 FROM transaccion_pago
                 WHERE orden_externa = ?
                    OR referencia_externa = ?
                    OR (
                        id_evento_webhook IS NOT NULL
                        AND id_evento_webhook = ?
                    )
                 LIMIT 1`,
                [
                    checkout.id,
                    referenciaExterna,
                    idEventoWebhook
                ]
            );

        if (existentes.length > 0) {
            if (idEventoWebhook) {
                await conexion.query(
                    `UPDATE transaccion_pago
                    SET id_evento_webhook =
                        COALESCE(
                            id_evento_webhook,
                            ?
                        )
                    WHERE id_transaccion = ?`,
                    [
                        idEventoWebhook,
                        existentes[0].id_transaccion
                    ]
                );

                await conexion.commit();
            } else {
                await conexion.rollback();
            }

            return {
                duplicada: true,
                idDonacion,
                idCheckout:
                    checkout.id,
                referenciaPago:
                    referenciaExterna,
                monto,
                moneda
            };
        }

        await conexion.query(
            `INSERT INTO transaccion_pago (
                orden_externa,
                referencia_externa,
                proveedor,
                estado,
                monto,
                moneda,
                id_donacion,
                id_evento_webhook
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                checkout.id,
                referenciaExterna,
                "Recurrente",
                "succeeded",
                monto,
                moneda,
                idDonacion,
                idEventoWebhook
            ]
        );

        await conexion.query(
            `UPDATE donacion
             SET estado = 'Confirmada'
             WHERE id_donacion = ?`,
            [idDonacion]
        );

        await conexion.commit();

        return {
            duplicada: false,
            idDonacion,
            idCheckout:
                checkout.id,
            referenciaPago:
                referenciaExterna,
            monto,
            moneda
        };
    } catch (error) {
        try {
            await conexion.rollback();
        } catch (_) {}

        throw error;
    } finally {
        conexion.release();
    }
}

async function recibirWebhook(req, res) {
    try {
        const secret =
            process.env.RECURRENTE_WEBHOOK_SECRET;

        if (!secret) {
            console.error(
                "RECURRENTE_WEBHOOK_SECRET no está configurado."
            );

            return res.status(500).json({
                mensaje:
                    "Configuración de webhook incompleta."
            });
        }

        const webhook =
            new Webhook(secret);

        const headers = {
            "svix-id":
                req.headers["svix-id"],
            "svix-timestamp":
                req.headers["svix-timestamp"],
            "svix-signature":
                req.headers["svix-signature"]
        };

        webhook.verify(
            req.body,
            headers
        );

        const evento = JSON.parse(
            req.body.toString("utf8")
        );

        const idEvento =
            req.headers["svix-id"];

        console.log(
            "Webhook verificado correctamente."
        );

        console.log(
            "ID del mensaje:",
            idEvento
        );

        console.log(
            "Tipo de evento:",
            evento.event_type
        );

        if (
            evento.event_type ===
            "intent.succeeded"
        ) {
            const idCheckout =
                evento.checkout?.id;

            if (idCheckout) {
                try {
                    const resultado =
                        await procesarCheckoutPagado(
                            idCheckout,
                            idEvento
                        );

                    console.log(
                        resultado.duplicada
                            ? "Webhook ya procesado anteriormente."
                            : "Pago de Recurrente registrado automáticamente."
                    );
                } catch (errorProceso) {
                    console.error(
                        "El webhook fue válido, pero no fue posible registrar el pago:",
                        errorProceso.message
                    );

                    return res.status(500).json({
                        recibido: true,
                        procesado: false,
                        mensaje:
                            "El webhook fue recibido, pero el pago no pudo registrarse."
                    });
                }
            } else {
                console.log(
                    "El evento intent.succeeded no incluyó checkout.id. Se conserva la confirmación por checkout como respaldo."
                );
            }
        }

        return res.status(200).json({
            recibido: true
        });
    } catch (error) {
        console.error(
            "Webhook rechazado:",
            error.message
        );

        return res.status(400).json({
            recibido: false,
            mensaje:
                "Webhook inválido."
        });
    }
}

async function confirmarCheckout(req, res) {
    try {
        const {
            idCheckout
        } = req.body;

        if (!idCheckout) {
            return res.status(400).json({
                mensaje:
                    "El ID del checkout es obligatorio."
            });
        }

        const resultado =
            await procesarCheckoutPagado(
                idCheckout
            );

        if (resultado.duplicada) {
            return res.status(200).json({
                mensaje:
                    "La transacción ya había sido registrada.",
                ...resultado
            });
        }

        return res.status(200).json({
            mensaje:
                "Donación confirmada correctamente.",
            ...resultado
        });
    } catch (error) {
        console.error(
            "Error confirmando checkout de Recurrente:",
            error.message
        );

        if (
            error.codigo ===
            "CHECKOUT_NO_PAGADO"
        ) {
            return res.status(400).json({
                mensaje:
                    error.message
            });
        }

        if (
            error.codigo ===
            "DONACION_NO_ENCONTRADA"
        ) {
            return res.status(404).json({
                mensaje:
                    error.message
            });
        }

        return res.status(500).json({
            mensaje:
                "No fue posible confirmar el pago."
        });
    }
}

async function crearCheckoutDonacion(req, res) {
    try {
        const {
            idDonacion
        } = req.body;

        if (!idDonacion) {
            return res.status(400).json({
                mensaje:
                    "El ID de la donación es obligatorio."
            });
        }

        const [donaciones] =
            await pool.query(
                `SELECT
                    id_donacion,
                    nombre_donante,
                    correo_donante,
                    tipo_donacion,
                    monto,
                    moneda,
                    estado
                 FROM donacion
                 WHERE id_donacion = ?
                 LIMIT 1`,
                [idDonacion]
            );

        if (donaciones.length === 0) {
            return res.status(404).json({
                mensaje:
                    "La donación no existe."
            });
        }

        const donacion =
            donaciones[0];

        if (
            donacion.tipo_donacion !==
            "Monetaria"
        ) {
            return res.status(400).json({
                mensaje:
                    "Solo las donaciones monetarias pueden pagarse con Recurrente."
            });
        }

        if (donacion.moneda !== "GTQ") {
            return res.status(400).json({
                mensaje:
                    "Esta donación no corresponde a Recurrente."
            });
        }

        if (donacion.estado !== "Pendiente") {
            return res.status(400).json({
                mensaje:
                    "La donación ya no se encuentra pendiente."
            });
        }

        const monto =
            Number(donacion.monto);

        if (
            !Number.isFinite(monto) ||
            monto < 5
        ) {
            return res.status(400).json({
                mensaje:
                    "El monto mínimo para Recurrente en GTQ es Q5.00."
            });
        }

        const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";

        const checkout =
            await crearCheckout({
                items: [
                    {
                        name:
                            "Donación Mesón Buen Samaritano",
                        amount_in_cents:
                            Math.round(
                                monto * 100
                            ),
                        currency:
                            "GTQ",
                        charge_type:
                            "one_time",
                        quantity: 1
                    }
                ],
                metadata: {
                    id_donacion:
                        donacion.id_donacion
                },
                success_url:
                    `${frontendUrl}/donaciones/recurrente/exito`,
                cancel_url:
                    `${frontendUrl}/donaciones/recurrente/cancelado`
            });

        return res.status(201).json({
            mensaje:
                "Checkout creado correctamente.",
            idCheckout:
                checkout.id,
            checkoutUrl:
                checkout.checkout_url,
            monto,
            moneda:
                "GTQ"
        });
    } catch (error) {
        console.error(
            "Error creando checkout de Recurrente:",
            error.message
        );

        return res.status(500).json({
            mensaje:
                "No fue posible crear el checkout."
        });
    }
}

module.exports = {
    recibirWebhook,
    crearCheckoutDonacion,
    confirmarCheckout
};
