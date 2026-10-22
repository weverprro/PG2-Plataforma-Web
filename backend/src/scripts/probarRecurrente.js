require("dotenv").config();

const {
    probarCredenciales
} = require(
    "../services/recurrenteService"
);

async function ejecutar() {
    try {
        console.log(
            "Probando conexión con Recurrente..."
        );

        const resultado =
            await probarCredenciales();

        console.log(
            "Conexión con Recurrente correcta."
        );

        console.log(
            "Cuenta:",
            resultado.account_id
        );

        console.log(
            "Ambiente:",
            resultado.environment
        );

        console.log(
            "Sandbox:",
            resultado.sandbox_id
        );

        if (
            resultado.environment !==
            "sandbox"
        ) {
            console.warn(
                "ADVERTENCIA: no estás usando Sandbox."
            );
        }

    } catch (error) {
        console.error(
            "Error probando Recurrente:"
        );

        console.error(
            error.message
        );

        process.exitCode = 1;
    }
}

ejecutar();