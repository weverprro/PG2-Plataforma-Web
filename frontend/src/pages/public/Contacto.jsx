import {
    useEffect,
    useRef,
    useState
} from "react";


import {
    apiFetch
} from "../../services/api";


import TurnstileWidget
    from "../../components/common/TurnstileWidget";


const formularioInicial = {
    nombre: "",
    correo: "",
    telefono: "",
    asunto: "",
    mensaje: ""
};


function Contacto() {

    const [
        contenido,
        setContenido
    ] = useState(null);


    const [
        formulario,
        setFormulario
    ] = useState(
        formularioInicial
    );


    const [
        turnstileToken,
        setTurnstileToken
    ] = useState("");


    const [
        enviando,
        setEnviando
    ] = useState(false);


    const [
        mensajeExito,
        setMensajeExito
    ] = useState("");


    const [
        error,
        setError
    ] = useState("");


    const turnstileRef =
        useRef(null);


    useEffect(() => {

        cargarContenido();

    }, []);


    async function cargarContenido() {

        try {

            const respuesta =
                await apiFetch(
                    "/contenidos/tipo/Contacto"
                );


            let lista = [];


            if (
                Array.isArray(
                    respuesta
                )
            ) {

                lista =
                    respuesta;

            } else if (
                Array.isArray(
                    respuesta?.contenidos
                )
            ) {

                lista =
                    respuesta.contenidos;

            } else if (
                respuesta
            ) {

                lista = [
                    respuesta
                ];

            }


            setContenido(
                lista[0] ||
                null
            );


        } catch (error) {

            console.error(
                "No fue posible cargar contenido de contacto:",
                error
            );

        }

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


    async function enviarFormulario(
        evento
    ) {

        evento.preventDefault();


        setMensajeExito("");
        setError("");


        if (!turnstileToken) {

            setError(
                "Completa la verificación de seguridad antes de enviar el mensaje."
            );

            return;

        }


        try {

            setEnviando(true);


            const respuesta =
                await apiFetch(
                    "/contacto",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({
                                ...formulario,

                                turnstileToken:
                                    turnstileToken
                            })
                    }
                );


            setMensajeExito(
                respuesta.mensaje ||
                "Mensaje enviado correctamente."
            );


            setFormulario(
                formularioInicial
            );


            setTurnstileToken("");


            turnstileRef.current?.reset();


        } catch (error) {

            console.error(
                error
            );


            setError(
                error.message ||
                "No fue posible enviar el mensaje."
            );


            /*
             * Los tokens de Turnstile
             * son de un solo uso.
             *
             * Si ocurre un error,
             * generamos uno nuevo.
             */
            setTurnstileToken("");


            turnstileRef.current?.reset();


        } finally {

            setEnviando(false);

        }

    }


    function obtenerImagen(
        ruta
    ) {

        if (!ruta) {

            return null;

        }


        if (
            ruta.startsWith(
                "http"
            )
        ) {

            return ruta;

        }


        const backend =
            import.meta.env
                .VITE_BACKEND_URL ||
            "http://localhost:3000";


        return `${backend}${ruta}`;

    }


    return (

        <main className="pagina-contacto">


            <section className="contacto-encabezado">

                <div className="contacto-encabezado-contenido">

                    <span>
                        Contacto
                    </span>


                    <h1>

                        {
                            contenido?.titulo ||
                            "Comunícate con nosotros"
                        }

                    </h1>


                    <p>

                        Estamos disponibles
                        para atender consultas
                        relacionadas con
                        donaciones, visitas,
                        voluntariado y otras
                        formas de apoyo.

                    </p>

                </div>

            </section>


            <section className="contacto-contenido">

                <div className="contacto-grid">


                    <div className="contacto-informacion">

                        <h2>
                            Información
                        </h2>


                        {contenido?.contenido ? (

                            <div className="contacto-texto">

                                {
                                    contenido.contenido
                                        .split("\n")
                                        .map(
                                            (
                                                linea,
                                                indice
                                            ) => (

                                                <p
                                                    key={
                                                        indice
                                                    }
                                                >
                                                    {
                                                        linea
                                                    }
                                                </p>

                                            )
                                        )
                                }

                            </div>

                        ) : (

                            <p>

                                Puedes utilizar el
                                formulario para
                                comunicarte con el
                                Mesón Buen Samaritano.

                            </p>

                        )}


                        {contenido?.imagen_url && (

                            <img
                                className="contacto-imagen"

                                src={
                                    obtenerImagen(
                                        contenido.imagen_url
                                    )
                                }

                                alt={
                                    contenido.titulo ||
                                    "Mesón Buen Samaritano"
                                }
                            />

                        )}

                    </div>


                    <div className="contacto-formulario-card">

                        <h2>
                            Envíanos un mensaje
                        </h2>


                        <p>

                            Completa el formulario
                            y nuestro personal podrá
                            comunicarse contigo.

                        </p>


                        {mensajeExito && (

                            <div className="mensaje-exito">

                                {
                                    mensajeExito
                                }

                            </div>

                        )}


                        {error && (

                            <div className="mensaje-error">

                                {error}

                            </div>

                        )}


                        <form
                            onSubmit={
                                enviarFormulario
                            }
                        >


                            <div className="campo-formulario">

                                <label>
                                    Nombre
                                </label>


                                <input
                                    type="text"
                                    name="nombre"

                                    value={
                                        formulario.nombre
                                    }

                                    onChange={
                                        manejarCambio
                                    }

                                    required
                                />

                            </div>


                            <div className="campo-formulario">

                                <label>
                                    Correo electrónico
                                </label>


                                <input
                                    type="email"
                                    name="correo"

                                    value={
                                        formulario.correo
                                    }

                                    onChange={
                                        manejarCambio
                                    }

                                    required
                                />

                            </div>


                            <div className="campo-formulario">

                                <label>
                                    Teléfono
                                </label>


                                <input
                                    type="tel"
                                    name="telefono"

                                    value={
                                        formulario.telefono
                                    }

                                    onChange={
                                        manejarCambio
                                    }

                                    placeholder="Opcional"
                                />

                            </div>


                            <div className="campo-formulario">

                                <label>
                                    Asunto
                                </label>


                                <input
                                    type="text"
                                    name="asunto"

                                    value={
                                        formulario.asunto
                                    }

                                    onChange={
                                        manejarCambio
                                    }

                                    required
                                />

                            </div>


                            <div className="campo-formulario">

                                <label>
                                    Mensaje
                                </label>


                                <textarea
                                    name="mensaje"

                                    value={
                                        formulario.mensaje
                                    }

                                    onChange={
                                        manejarCambio
                                    }

                                    rows="8"

                                    required
                                />

                            </div>


                            <div className="campo-formulario">

                                <TurnstileWidget
                                    ref={
                                        turnstileRef
                                    }

                                    onVerify={token => {
                                            setTurnstileToken(token);
                                        }
                                    }

                                    onExpire={
                                        () => {

                                            setTurnstileToken(
                                                ""
                                            );

                                            setError(
                                                "La verificación de seguridad expiró. Verifica nuevamente."
                                            );

                                        }
                                    }

                                    onError={
                                        () => {

                                            setTurnstileToken(
                                                ""
                                            );

                                            setError(
                                                "No fue posible completar la verificación de seguridad."
                                            );

                                        }
                                    }
                                />

                            </div>


                            <button
                                type="submit"
                                className="contacto-boton"

                                disabled={
                                    enviando ||
                                    !turnstileToken ||
                                    !formulario.nombre.trim() ||
                                    !formulario.correo.trim() ||
                                    !formulario.asunto.trim() ||
                                    !formulario.mensaje.trim()
                                }
                            >

                                {
                                    enviando
                                        ? "Enviando..."
                                        : "Enviar mensaje"
                                }

                            </button>

                        </form>

                    </div>

                </div>

            </section>

        </main>

    );

}


export default Contacto;