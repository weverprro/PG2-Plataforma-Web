require("dotenv").config();

const {
    obtenerAccessToken
} = require("../services/paypalService");

async function probarPaypal() {
    try {
        const token = await obtenerAccessToken();

        console.log(
            "Conexión con PayPal Sandbox correcta."
        );

        console.log(
            "Access Token recibido:",
            token ? "Sí" : "No"
        );

    } catch (error) {
        console.error(
            "Error conectando con PayPal:",
            error.message
        );
    }
}

probarPaypal();