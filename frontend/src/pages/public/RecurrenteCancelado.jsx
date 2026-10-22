import {
    Link
} from "react-router";

function RecurrenteCancelado() {
    sessionStorage.removeItem(
        "recurrenteCheckoutPendiente"
    );

    sessionStorage.removeItem(
        "recurrenteDonacionPendiente"
    );

    return (
        <main className="pagina-donaciones">
            <section className="donaciones-encabezado">
                <span>
                    Recurrente
                </span>

                <h1>
                    Pago cancelado
                </h1>

                <div className="mensaje-error">
                    El pago con Recurrente fue cancelado. No se confirmó ningún cobro.
                </div>

                <p>
                    Puedes regresar a la página de donaciones e intentarlo nuevamente cuando lo desees.
                </p>

                <p>
                    <Link
                        to="/donaciones"
                        className="boton-principal"
                    >
                        Volver a donaciones
                    </Link>
                </p>
            </section>
        </main>
    );
}

export default RecurrenteCancelado;
