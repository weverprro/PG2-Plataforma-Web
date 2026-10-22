const API_URL =
    process.env.RECURRENTE_API_URL ||
    "https://app.recurrente.com/api";

function obtenerSecretKey() {
    const secretKey =
        process.env.RECURRENTE_SECRET_KEY;

    if (!secretKey) {
        throw new Error(
            "RECURRENTE_SECRET_KEY no está configurada."
        );
    }

    return secretKey;
}

async function solicitudRecurrente(
    endpoint,
    opciones = {}
) {
    const respuesta = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...opciones,
            headers: {
                "X-SECRET-KEY":
                    obtenerSecretKey(),
                "Content-Type":
                    "application/json",
                ...(opciones.headers || {})
            }
        }
    );

    let datos;

    try {
        datos = await respuesta.json();
    } catch (_) {
        datos = null;
    }

    if (!respuesta.ok) {
        const mensaje =
            datos?.message ||
            "Error al comunicarse con Recurrente.";

        throw new Error(
            `${respuesta.status} - ${mensaje}`
        );
    }

    return datos;
}

async function probarCredenciales() {
    return solicitudRecurrente(
        "/test",
        {
            method: "GET"
        }
    );
}
async function crearCheckout(datos) {
    return solicitudRecurrente(
        "/checkouts",
        {
            method: "POST",
            body: JSON.stringify(datos)
        }
    );
}
async function obtenerCheckout(idCheckout) {
    return solicitudRecurrente(
        `/checkouts/${idCheckout}`,
        {
            method: "GET"
        }
    );
}

module.exports = {
    probarCredenciales,
    crearCheckout,
    obtenerCheckout,
    solicitudRecurrente
};