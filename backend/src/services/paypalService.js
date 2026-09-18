async function obtenerAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl = process.env.PAYPAL_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
        throw new Error(
            "Faltan las credenciales o la URL de PayPal en el archivo .env"
        );
    }

    const credenciales = Buffer.from(
        `${clientId}:${clientSecret}`
    ).toString("base64");

    const respuesta = await fetch(
        `${baseUrl}/v1/oauth2/token`,
        {
            method: "POST",
            headers: {
                "Authorization": `Basic ${credenciales}`,
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials"
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        console.error("Respuesta de PayPal:", datos);

        throw new Error(
            "No fue posible autenticarse con PayPal."
        );
    }

    return datos.access_token;
}

async function crearOrdenPaypal(monto, idDonacion) {
    const accessToken = await obtenerAccessToken();

    const respuesta = await fetch(
        `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                intent: "CAPTURE",

                purchase_units: [
                    {
                        reference_id: String(idDonacion),
                        description: `Donación PG2 #${idDonacion}`,

                        amount: {
                            currency_code: "USD",
                            value: Number(monto).toFixed(2)
                        }
                    }
                ],

                payment_source: {
                    paypal: {
                        experience_context: {
                            brand_name: "PG2 Plataforma Web",
                            user_action: "PAY_NOW",

                            return_url:
                                "http://localhost:3000/api/donaciones/paypal/retorno",

                            cancel_url:
                                "http://localhost:3000/api/donaciones/paypal/cancelado"
                        }
                    }
                }
            })
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        console.error("Error PayPal:", datos);

        throw new Error(
            "No fue posible crear la orden de PayPal."
        );
    }

    return datos;
}
async function capturarOrdenPaypal(idOrden) {
    const accessToken = await obtenerAccessToken();

    const respuesta = await fetch(
        `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${idOrden}/capture`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        console.error("Error PayPal:", datos);

        throw new Error(
            "No fue posible capturar la orden de PayPal."
        );
    }

    return datos;
}

async function obtenerOrdenPaypal(idOrden) {
    const accessToken = await obtenerAccessToken();

    const respuesta = await fetch(
        `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${idOrden}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        console.error("Error PayPal:", datos);

        throw new Error(
            "No fue posible consultar la orden de PayPal."
        );
    }

    return datos;
}

module.exports = {
    obtenerAccessToken,
    crearOrdenPaypal,
    obtenerOrdenPaypal,
    capturarOrdenPaypal
};