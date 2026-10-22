import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../services/api";
import TurnstileWidget from "../../components/common/TurnstileWidget";

const formularioInicial = {
    nombreDonante: "",
    correoDonante: "",
    telefonoDonante: "",
    monto: "",
    descripcion: ""
};

function Donaciones() {
    const [tipo, setTipo] = useState("Monetaria");
    const [metodoPago, setMetodoPago] = useState("PayPal");
    const [formulario, setFormulario] = useState(formularioInicial);
    const [contenido, setContenido] = useState(null);
    const [turnstileToken, setTurnstileToken] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");

    const turnstileRef = useRef(null);

    useEffect(() => {
        cargarContenido();
        procesarRetornoPaypal();
    }, []);

    async function cargarContenido() {
        try {
            const respuesta = await apiFetch(
                "/contenidos/tipo/Donaciones"
            );

            if (Array.isArray(respuesta)) {
                setContenido(
                    respuesta[0] || null
                );
            } else {
                setContenido(
                    respuesta || null
                );
            }
        } catch (error) {
            console.error(
                "Error cargando contenido de donaciones:",
                error
            );
        }
    }

    async function procesarRetornoPaypal() {
        const parametros = new URLSearchParams(
            window.location.search
        );

        const estadoPaypal = parametros.get(
            "paypal"
        );

        if (estadoPaypal === "cancelado") {
            setError(
                "El pago con PayPal fue cancelado. No se realizó ningún cobro."
            );

            limpiarUrl();
            return;
        }

        if (estadoPaypal !== "aprobado") {
            return;
        }

        const idDonacion = localStorage.getItem(
            "donacionPaypalPendiente"
        );

        if (!idDonacion) {
            setError(
                "No fue posible identificar la donación pendiente."
            );

            limpiarUrl();
            return;
        }

        /*
         * Limpiamos la URL antes de capturar
         * para evitar que React procese dos
         * veces el retorno de PayPal.
         */
        limpiarUrl();

        try {
            setEnviando(true);

            const respuesta = await apiFetch(
                `/donaciones/${idDonacion}/paypal/capturar`,
                {
                    method: "POST"
                }
            );

            localStorage.removeItem(
                "donacionPaypalPendiente"
            );

            setMensaje(
                respuesta.mensaje ||
                "Donación confirmada correctamente. Muchas gracias por tu apoyo."
            );

            setFormulario(formularioInicial);
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                "PayPal aprobó el pago, pero no fue posible confirmar la donación."
            );
        } finally {
            setEnviando(false);
        }
    }

    function limpiarUrl() {
        window.history.replaceState(
            {},
            document.title,
            "/donaciones"
        );
    }

    function manejarCambio(evento) {
        const { name, value } = evento.target;

        setFormulario(anterior => ({
            ...anterior,
            [name]: value
        }));
    }

    function cambiarTipo(nuevoTipo) {
        setTipo(nuevoTipo);
        setMetodoPago("PayPal");
        setFormulario(formularioInicial);
        setMensaje("");
        setError("");
        setTurnstileToken("");

        turnstileRef.current?.reset();
    }

    function cambiarMetodoPago(nuevoMetodo) {
        setMetodoPago(nuevoMetodo);

        setFormulario(anterior => ({
            ...anterior,
            monto: ""
        }));

        setMensaje("");
        setError("");
        setTurnstileToken("");

        turnstileRef.current?.reset();
    }

    async function enviarDonacion(evento) {
        evento.preventDefault();

        try {
            setEnviando(true);
            setMensaje("");
            setError("");

            if (!turnstileToken) {
                setError(
                    "Completa la verificación de seguridad antes de continuar."
                );
                return;
            }

            const datos = {
                nombreDonante:
                    formulario.nombreDonante || null,

                correoDonante:
                    formulario.correoDonante || null,

                telefonoDonante:
                    tipo === "Especie"
                        ? formulario.telefonoDonante
                        : null,

                tipoDonacion:
                    tipo,

                monto:
                    tipo === "Monetaria"
                        ? Number(formulario.monto)
                        : null,

                moneda:
                    tipo === "Monetaria"
                        ? metodoPago === "Recurrente"
                            ? "GTQ"
                            : "USD"
                        : null,

                descripcion:
                    tipo === "Especie"
                        ? formulario.descripcion
                        : null,

                turnstileToken
            };

            const respuesta = await apiFetch(
                "/donaciones",
                {
                    method: "POST",
                    body: JSON.stringify(datos)
                }
            );

            /*
             * ==========================
             * DONACIÓN EN ESPECIE
             * ==========================
             */
            if (tipo === "Especie") {
                setMensaje(
                    respuesta.mensaje ||
                    "Donación en especie registrada correctamente. El personal del hogar podrá darle seguimiento."
                );

                setFormulario(formularioInicial);
                setTurnstileToken("");
                turnstileRef.current?.reset();

                return;
            }

            /*
             * ==========================
             * DONACIÓN MONETARIA
             * ==========================
             */
            const idDonacion =
                respuesta.idDonacion;

            if (!idDonacion) {
                throw new Error(
                    "No se recibió el identificador de la donación."
                );
            }

            if (metodoPago === "PayPal") {
                const orden = await apiFetch(
                    `/donaciones/${idDonacion}/paypal/crear-orden`,
                    {
                        method: "POST"
                    }
                );

                if (!orden.enlaceAprobacion) {
                    throw new Error(
                        "PayPal no devolvió un enlace de aprobación."
                    );
                }

                localStorage.setItem(
                    "donacionPaypalPendiente",
                    String(idDonacion)
                );

                window.location.href =
                    orden.enlaceAprobacion;

                return;
            }

            const checkout = await apiFetch(
                "/recurrente/crear-checkout",
                {
                    method: "POST",
                    body: JSON.stringify({
                        idDonacion
                    })
                }
            );

            if (
                !checkout.idCheckout ||
                !checkout.checkoutUrl
            ) {
                throw new Error(
                    "Recurrente no devolvió la información necesaria para continuar."
                );
            }

            sessionStorage.setItem(
                "recurrenteCheckoutPendiente",
                checkout.idCheckout
            );

            sessionStorage.setItem(
                "recurrenteDonacionPendiente",
                String(idDonacion)
            );

            window.location.href =
                checkout.checkoutUrl;
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                "No fue posible procesar la donación."
            );

            setTurnstileToken("");
            turnstileRef.current?.reset();
        } finally {
            setEnviando(false);
        }
    }

    const montoMinimo =
        metodoPago === "Recurrente"
            ? 5
            : 1;

    const montoValido =
        tipo !== "Monetaria" ||
        (
            formulario.monto !== "" &&
            Number(formulario.monto) >= montoMinimo
        );

    const especieValida =
        tipo !== "Especie" ||
        (
            formulario.telefonoDonante.trim() &&
            formulario.descripcion.trim()
        );

    return (
        <main className="pagina-donaciones">
            {/* ENCABEZADO */}
            <section className="donaciones-encabezado">
                <span>
                    Tu apoyo importa
                </span>

                <h1>
                    Ayúdanos a continuar cuidando a nuestros adultos mayores
                </h1>

                <p>
                    {
                        contenido?.contenido ||
                        "Cada aporte contribuye al cuidado, alimentación y bienestar de los residentes del hogar."
                    }
                </p>
            </section>

            {/* TIPOS */}
            <section className="donaciones-contenido">
                <div className="donaciones-informacion">
                    <span className="subtitulo">
                        Formas de ayudar
                    </span>

                    <h2>
                        Elige cómo deseas donar
                    </h2>

                    <div className="donaciones-tipos">
                        <button
                            type="button"
                            className={
                                tipo === "Monetaria"
                                    ? "donacion-tipo activa"
                                    : "donacion-tipo"
                            }
                            onClick={() =>
                                cambiarTipo("Monetaria")
                            }
                        >
                            <strong>
                                Donación monetaria
                            </strong>

                            <span>
                                Realiza un aporte mediante PayPal o tarjeta con Recurrente.
                            </span>
                        </button>

                        <button
                            type="button"
                            className={
                                tipo === "Especie"
                                    ? "donacion-tipo activa"
                                    : "donacion-tipo"
                            }
                            onClick={() =>
                                cambiarTipo("Especie")
                            }
                        >
                            <strong>
                                Donación en especie
                            </strong>

                            <span>
                                Alimentos, productos, artículos u otros recursos.
                            </span>
                        </button>
                    </div>

                    <div className="donaciones-nota">
                        {tipo === "Monetaria" ? (
                            <>
                                <strong>
                                    Pago electrónico seguro
                                </strong>

                                <p>
                                    Puedes donar con PayPal en USD o mediante Recurrente en GTQ.
                                </p>
                            </>
                        ) : (
                            <>
                                <strong>
                                    Donaciones en especie
                                </strong>

                                <p>
                                    Registra qué deseas donar para que el hogar pueda darle seguimiento.
                                </p>
                            </>
                        )}
                    </div>

                    
                    <div className="donaciones-cuenta">
                        <strong>¿Prefieres ayudarnos mediante una cuenta bancaria?</strong>

                        <p>
                            Cada aporte nos ayuda a seguir brindando cuidado,
                            alimentación y cariño a nuestros abuelitos.
                            Si lo deseas, también puedes colaborar haciendo
                            un depósito o transferencia a nuestra cuenta.
                        </p>

                        <span className="donaciones-cuenta-etiqueta">
                            Banco
                        </span>
                        <p className="donaciones-cuenta-titular">
                            Banrural — Cuenta monetaria
                        </p>

                        <span className="donaciones-cuenta-etiqueta">
                            Número de cuenta
                        </span>
                        <div className="donaciones-cuenta-numero">
                            <strong>3364088840</strong>
                            <button
                                type="button"
                                onClick={() => navigator.clipboard?.writeText("3364088840")}
                                aria-label="Copiar número de cuenta"
                            >
                                Copiar
                            </button>
                        </div>

                        <span className="donaciones-cuenta-etiqueta">
                            A nombre de
                        </span>
                        <p className="donaciones-cuenta-titular">
                            Asociación Civil Mesón Buen Samaritano
                        </p>

                        <small>
                            Gracias por ser parte de esta hermosa labor.
                            Tu generosidad hace una gran diferencia.
                        </small>
                    </div>
                </div>

                {/* FORMULARIO */}
                <div className="donaciones-formulario-contenedor">
                    <div className="donaciones-formulario-cabecera">
                        <span className="subtitulo">
                            {
                                tipo === "Monetaria"
                                    ? "Aporte monetario"
                                    : "Donación en especie"
                            }
                        </span>

                        <h2>
                            {
                                tipo === "Monetaria"
                                    ? "Realizar donación"
                                    : "Registrar donación"
                            }
                        </h2>
                    </div>

                    {mensaje && (
                        <div className="mensaje-exito">
                            {mensaje}
                        </div>
                    )}

                    {error && (
                        <div className="mensaje-error">
                            {error}
                        </div>
                    )}

                    <form
                        className="donaciones-formulario"
                        onSubmit={enviarDonacion}
                    >
                        <div className="campo-formulario">
                            <label>
                                Nombre{" "}
                                <small>
                                    (opcional)
                                </small>
                            </label>

                            <input
                                type="text"
                                name="nombreDonante"
                                value={formulario.nombreDonante}
                                onChange={manejarCambio}
                            />
                        </div>

                        <div className="campo-formulario">
                            <label>
                                Correo electrónico{" "}
                                <small>
                                    (opcional)
                                </small>
                            </label>

                            <input
                                type="email"
                                name="correoDonante"
                                value={formulario.correoDonante}
                                onChange={manejarCambio}
                            />
                        </div>

                        {tipo === "Especie" && (
                            <div className="campo-formulario">
                                <label>
                                    Teléfono
                                </label>

                                <input
                                    type="tel"
                                    name="telefonoDonante"
                                    value={formulario.telefonoDonante}
                                    onChange={manejarCambio}
                                    placeholder="Ejemplo: 5555 5555"
                                    required
                                />

                                <small>
                                    Utilizaremos este número para coordinar la entrega.
                                </small>
                            </div>
                        )}

                        {tipo === "Monetaria" && (
                            <div className="campo-formulario">
                                <label>
                                    Método de pago
                                </label>

                                <div className="donaciones-tipos">
                                    <button
                                        type="button"
                                        className={
                                            metodoPago === "PayPal"
                                                ? "donacion-tipo activa"
                                                : "donacion-tipo"
                                        }
                                        onClick={() =>
                                            cambiarMetodoPago("PayPal")
                                        }
                                    >
                                        <strong>
                                            PayPal
                                        </strong>

                                        <span>
                                            Pago único en dólares estadounidenses.
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            metodoPago === "Recurrente"
                                                ? "donacion-tipo activa"
                                                : "donacion-tipo"
                                        }
                                        onClick={() =>
                                            cambiarMetodoPago("Recurrente")
                                        }
                                    >
                                        <strong>
                                            Tarjeta de crédito o débito
                                        </strong>

                                        <span>
                                            Pago con tarjeta en quetzales.
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {tipo === "Monetaria" ? (
                            <div className="campo-formulario">
                                <label>
                                    {
                                        metodoPago === "Recurrente"
                                            ? "Monto (GTQ)"
                                            : "Monto (USD)"
                                    }
                                </label>

                                <input
                                    type="number"
                                    name="monto"
                                    min={montoMinimo}
                                    step="0.01"
                                    value={formulario.monto}
                                    onChange={manejarCambio}
                                    placeholder="10.00"
                                    required
                                />

                                {metodoPago === "Recurrente" && (
                                    <small>
                                        El monto mínimo para Recurrente es Q5.00.
                                    </small>
                                )}
                            </div>
                        ) : (
                            <div className="campo-formulario">
                                <label>
                                    ¿Qué deseas donar?
                                </label>

                                <textarea
                                    name="descripcion"
                                    rows="6"
                                    value={formulario.descripcion}
                                    onChange={manejarCambio}
                                    placeholder="Ejemplo: alimentos, productos de higiene, ropa, medicamentos no restringidos, etc."
                                    required
                                />
                            </div>
                        )}

                        <div className="campo-formulario">
                            <TurnstileWidget
                                ref={turnstileRef}
                                onVerify={token => {
                                    setTurnstileToken(token);
                                }}
                                onExpire={() => {
                                    setTurnstileToken("");

                                    setError(
                                        "La verificación de seguridad expiró. Verifica nuevamente."
                                    );
                                }}
                                onError={() => {
                                    setTurnstileToken("");

                                    setError(
                                        "No fue posible completar la verificación de seguridad."
                                    );
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="boton-principal"
                            disabled={
                                enviando ||
                                !turnstileToken ||
                                !montoValido ||
                                !especieValida
                            }
                        >
                            {
                                enviando
                                    ? "Procesando..."
                                    : tipo === "Monetaria"
                                        ? metodoPago === "Recurrente"
                                            ? "Pagar con tarjeta"
                                            : "Continuar con PayPal"
                                        : "Registrar donación"
                            }
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}

export default Donaciones;
