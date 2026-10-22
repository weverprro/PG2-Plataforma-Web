require("dotenv").config();

const {
    obtenerCheckout
} = require("../services/recurrenteService");

async function ejecutar() {
    try {
        const idCheckout =
            "ch_h5biktsuliqjwei4";

        console.log(
            "Consultando checkout..."
        );

        const checkout =
            await obtenerCheckout(
                idCheckout
            );

        console.log(
            JSON.stringify(
                checkout,
                null,
                2
            )
        );

    } catch (error) {
        console.error(
            "Error verificando checkout:"
        );

        console.error(
            error.message
        );
    }
}

ejecutar();