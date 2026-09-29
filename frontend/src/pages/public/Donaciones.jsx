import {
    useEffect,
    useState
} from "react";

import {
    apiFetch
} from "../../services/api";


const formularioInicial = {
    nombreDonante: "",
    correoDonante: "",
    telefonoDonante: "",
    monto: "",
    descripcion: ""
};


function Donaciones() {

    const [
        tipo,
        setTipo
    ] = useState("Monetaria");

    const [
        formulario,
        setFormulario
    ] = useState(
        formularioInicial
    );

    const [
        contenido,
        setContenido
    ] = useState(null);

    const [
        enviando,
        setEnviando
    ] = useState(false);

    const [
        mensaje,
        setMensaje
    ] = useState("");

    const [
        error,
        setError
    ] = useState("");


    useEffect(() => {

        cargarContenido();

        procesarRetornoPaypal();

    }, []);


    async function cargarContenido() {

        try {

            const respuesta =
                await apiFetch(
                    "/contenidos/tipo/Donaciones"
                );


            if (
                Array.isArray(respuesta)
            ) {

                setContenido(
                    respuesta[0] ||
                    null
                );

            } else {

                setContenido(
                    respuesta ||
                    null
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

        const parametros =
            new URLSearchParams(
                window.location.search
            );


        const estadoPaypal =
            parametros.get(
                "paypal"
            );


        if (
            estadoPaypal ===
            "cancelado"
        ) {

            setError(
                "El pago con PayPal fue cancelado. No se realizó ningún cobro."
            );


            limpiarUrl();

            return;
        }


        if (
            estadoPaypal !==
            "aprobado"
        ) {
            return;
        }


        const idDonacion =
            localStorage.getItem(
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
        * IMPORTANTE:
        * Limpiamos la URL antes de capturar
        * para evitar que React procese dos
        * veces el retorno de PayPal.
        */
        limpiarUrl();


        try {

            setEnviando(true);


            const respuesta =
                await apiFetch(
                    `/donaciones/${idDonacion}/paypal/capturar`,
                    {
                        method:
                            "POST"
                    }
                );


            localStorage.removeItem(
                "donacionPaypalPendiente"
            );


            setMensaje(
                respuesta.mensaje ||
                "Donación confirmada correctamente. Muchas gracias por tu apoyo."
            );


            setFormulario(
                formularioInicial
            );


        } catch (error) {

            console.error(
                error
            );


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


    function manejarCambio(
        evento
    ) {

        const {
            name,
            value
        } = evento.target;


        setFormulario(
            anterior => ({

                ...anterior,

                [name]:
                    value

            })
        );
    }


    function cambiarTipo(
        nuevoTipo
    ) {

        setTipo(
            nuevoTipo
        );

        setFormulario(
            formularioInicial
        );

        setMensaje("");
        setError("");
    }


    async function enviarDonacion(
        evento
    ) {

        evento.preventDefault();


        try {

            setEnviando(true);
            setMensaje("");
            setError("");


            const datos = {

                nombreDonante:
                    formulario.nombreDonante ||
                    null,

                correoDonante:
                    formulario.correoDonante ||
                    null,

                telefonoDonante:
                    tipo === "Especie"
                        ? formulario.telefonoDonante
                        : null,

                tipoDonacion:
                    tipo,

                monto:
                    tipo === "Monetaria"
                        ? Number(
                            formulario.monto
                        )
                        : null,

                descripcion:
                    tipo === "Especie"
                        ? formulario.descripcion
                        : null

            };


            const respuesta =
                await apiFetch(
                    "/donaciones",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify(
                                datos
                            )
                    }
                );


            /*
             * ==========================
             * DONACIÓN EN ESPECIE
             * ==========================
             */

            if (
                tipo === "Especie"
            ) {

                setMensaje(
                    respuesta.mensaje ||
                    "Donación en especie registrada correctamente. El personal del hogar podrá darle seguimiento."
                );


                setFormulario(
                    formularioInicial
                );


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


            const orden =
                await apiFetch(
                    `/donaciones/${idDonacion}/paypal/crear-orden`,
                    {
                        method:
                            "POST"
                    }
                );


            if (
                !orden.enlaceAprobacion
            ) {

                throw new Error(
                    "PayPal no devolvió un enlace de aprobación."
                );
            }


            /*
             * Guardamos el ID antes de
             * salir hacia PayPal.
             */
            localStorage.setItem(
                "donacionPaypalPendiente",
                String(
                    idDonacion
                )
            );


            /*
             * Redirigimos al Sandbox
             * de PayPal.
             */
            window.location.href =
                orden.enlaceAprobacion;

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "No fue posible procesar la donación."
            );

            setEnviando(false);
        }
    }


    return (
        <main className="pagina-donaciones">

            {/* =====================
                ENCABEZADO
            ===================== */}

            <section className="donaciones-encabezado">

                <span>
                    Tu apoyo importa
                </span>

                <h1>
                    Ayúdanos a continuar
                    cuidando a nuestros
                    adultos mayores
                </h1>

                <p>
                    {
                        contenido?.contenido ||
                        "Cada aporte contribuye al cuidado, alimentación y bienestar de los residentes del hogar."
                    }
                </p>

            </section>


            {/* =====================
                TIPOS
            ===================== */}

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
                                cambiarTipo(
                                    "Monetaria"
                                )
                            }
                        >

                            <strong>
                                Donación monetaria
                            </strong>

                            <span>
                                Realiza un aporte
                                mediante PayPal.
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
                                cambiarTipo(
                                    "Especie"
                                )
                            }
                        >

                            <strong>
                                Donación en especie
                            </strong>

                            <span>
                                Alimentos, productos,
                                artículos u otros
                                recursos.
                            </span>

                        </button>

                    </div>


                    <div className="donaciones-nota">

                        {tipo === "Monetaria" ? (

                            <>
                                <strong>
                                    Pago seguro con PayPal
                                </strong>

                                <p>
                                    Serás redirigido a
                                    PayPal para autorizar
                                    la transacción.
                                </p>

                            </>

                        ) : (

                            <>
                                <strong>
                                    Donaciones en especie
                                </strong>

                                <p>
                                    Registra qué deseas
                                    donar para que el hogar
                                    pueda darle seguimiento.
                                </p>

                            </>

                        )}

                    </div>

                </div>


                {/* =====================
                    FORMULARIO
                ===================== */}

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

                        onSubmit={
                            enviarDonacion
                        }
                    >

                        <div className="campo-formulario">

                            <label>
                                Nombre
                                {" "}
                                <small>
                                    (opcional)
                                </small>
                            </label>

                            <input
                                type="text"

                                name="nombreDonante"

                                value={
                                    formulario.nombreDonante
                                }

                                onChange={
                                    manejarCambio
                                }
                            />

                        </div>


                        <div className="campo-formulario">

                            <label>
                                Correo electrónico
                                {" "}
                                <small>
                                    (opcional)
                                </small>
                            </label>

                            <input
                                type="email"

                                name="correoDonante"

                                value={
                                    formulario.correoDonante
                                }

                                onChange={
                                    manejarCambio
                                }
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

                                    value={
                                        formulario.telefonoDonante
                                    }

                                    onChange={
                                        manejarCambio
                                    }

                                    placeholder="Ejemplo: 5555 5555"

                                    required
                                />

                                <small>
                                    Utilizaremos este número para
                                    coordinar la entrega.
                                </small>

                            </div>

                        )}




                        {tipo === "Monetaria" ? (

                            <div className="campo-formulario">

                                <label>
                                    Monto
                                    {" "}
                                    (USD)
                                </label>

                                <input
                                    type="number"

                                    name="monto"

                                    min="1"

                                    step="0.01"

                                    value={
                                        formulario.monto
                                    }

                                    onChange={
                                        manejarCambio
                                    }

                                    placeholder="10.00"

                                    required
                                />

                            </div>

                        ) : (

                            <div className="campo-formulario">

                                <label>
                                    ¿Qué deseas donar?
                                </label>

                                <textarea
                                    name="descripcion"

                                    rows="6"

                                    value={
                                        formulario.descripcion
                                    }

                                    onChange={
                                        manejarCambio
                                    }

                                    placeholder="Ejemplo: alimentos, productos de higiene, ropa, medicamentos no restringidos, etc."

                                    required
                                />

                            </div>

                        )}


                        <button
                            type="submit"

                            className="boton-principal"

                            disabled={
                                enviando
                            }
                        >

                            {
                                enviando
                                    ? "Procesando..."
                                    : tipo === "Monetaria"
                                        ? "Continuar con PayPal"
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