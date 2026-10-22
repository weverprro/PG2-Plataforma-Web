import {
    useEffect,
    useState
} from "react";

import {
    Link
} from "react-router";

import {
    apiFetch
} from "../../services/api";

function RecurrenteExito() {
    const [procesando, setProcesando] =
        useState(true);

    const [mensaje, setMensaje] =
        useState("");

    const [error, setError] =
        useState("");

    useEffect(() => {
        confirmarPago();
    }, []);

    async function confirmarPago() {
        const idCheckout =
            sessionStorage.getItem(
                "recurrenteCheckoutPendiente"
            );

        if (!idCheckout) {
            setError(
                "No fue posible identificar el pago que debe confirmarse."
            );

            setProcesando(false);
            return;
        }

        try {
            const respuesta =
                await apiFetch(
                    "/recurrente/confirmar-checkout",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            idCheckout
                        })
                    }
                );

            sessionStorage.removeItem(
                "recurrenteCheckoutPendiente"
            );

            sessionStorage.removeItem(
                "recurrenteDonacionPendiente"
            );

            setMensaje(
                respuesta.mensaje ||
                "Donación confirmada correctamente. Muchas gracias por tu apoyo."
            );
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                "El pago fue realizado, pero no fue posible confirmar la donación automáticamente."
            );
        } finally {
            setProcesando(false);
        }
    }

    return (
        <main className="pagina-donaciones">
            <section className="donaciones-encabezado">
                <span>
                    Recurrente
                </span>

                <h1>
                    Confirmación de donación
                </h1>

                {procesando && (
                    <p>
                        Estamos verificando el pago directamente con Recurrente.
                    </p>
                )}

                {!procesando && mensaje && (
                    <div className="mensaje-exito">
                        {mensaje}
                    </div>
                )}

                {!procesando && error && (
                    <div className="mensaje-error">
                        {error}
                    </div>
                )}

                {!procesando && (
                    <p>
                        <Link
                            to="/donaciones"
                            className="boton-principal"
                        >
                            Volver a donaciones
                        </Link>
                    </p>
                )}
            </section>
        </main>
    );
}

export default RecurrenteExito;
