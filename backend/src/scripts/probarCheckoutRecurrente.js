require("dotenv").config();

const {
    crearCheckout
} = require("../services/recurrenteService");

async function ejecutar() {
    try {
        console.log(
            "Creando checkout para donación #21..."
        );

        const checkout =
            await crearCheckout({
                items: [
                    {
                        name:
                            "Donación Mesón Buen Samaritano",
                        amount_in_cents: 1000,
                        currency: "GTQ",
                        charge_type:
                            "one_time",
                        quantity: 1
                    }
                ],
                metadata: {
                    id_donacion: 21
                }
            });

        console.log(
            "Checkout creado correctamente."
        );

        console.log(
            "ID:",
            checkout.id
        );

        console.log(
            "Estado:",
            checkout.status
        );

        console.log(
            "Total:",
            checkout.total_in_cents
        );

        console.log(
            "Metadata:",
            checkout.metadata
        );

        console.log(
            "URL de pago:",
            checkout.checkout_url
        );

    } catch (error) {
        console.error(
            "Error creando checkout:"
        );

        console.error(
            error.message
        );
    }
}

ejecutar();