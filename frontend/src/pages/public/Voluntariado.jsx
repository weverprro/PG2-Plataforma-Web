import {
    useEffect,
    useState
} from "react";

import {
    apiFetch
} from "../../services/api";


const formularioInicial = {
    nombreVoluntario: "",
    correo: "",
    telefono: "",
    observaciones: "",
    idActividad: ""
};


function Voluntariado() {

    const [
        actividades,
        setActividades
    ] = useState([]);

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
        cargando,
        setCargando
    ] = useState(true);

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

        cargarPagina();

    }, []);


    async function cargarPagina() {

        try {

            setCargando(true);


            const [
                respuestaActividades,
                respuestaContenido
            ] = await Promise.all([

                apiFetch(
                    "/voluntariado/actividades"
                ),

                apiFetch(
                    "/contenidos/tipo/Voluntariado"
                )

            ]);


            setActividades(
                Array.isArray(
                    respuestaActividades
                )
                    ? respuestaActividades
                    : []
            );


            if (
                Array.isArray(
                    respuestaContenido
                )
            ) {

                setContenido(
                    respuestaContenido[0] ||
                    null
                );

            } else {

                setContenido(
                    respuestaContenido ||
                    null
                );
            }

        } catch (error) {

            console.error(
                "Error cargando voluntariado:",
                error
            );

            setError(
                "No fue posible cargar las actividades de voluntariado."
            );

        } finally {

            setCargando(false);
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


    async function enviarSolicitud(
        evento
    ) {

        evento.preventDefault();


        try {

            setEnviando(true);
            setMensaje("");
            setError("");


            if (
                !formulario.idActividad
            ) {

                setError(
                    "Selecciona una actividad de voluntariado."
                );

                return;
            }


            const datos = {

                nombreVoluntario:
                    formulario.nombreVoluntario,

                correoVoluntario:
                    formulario.correo,

                telefono:
                    formulario.telefono,

                observaciones:
                    formulario.observaciones,

                idActividad:
                    Number(
                        formulario.idActividad
                    )

            };


            const respuesta =
                await apiFetch(
                    "/voluntariado/solicitudes",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                datos
                            )
                    }
                );


            setMensaje(
                respuesta.mensaje ||
                "Solicitud de voluntariado enviada correctamente."
            );


            setFormulario(
                formularioInicial
            );


            await cargarPagina();

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "No fue posible enviar la solicitud."
            );

        } finally {

            setEnviando(false);
        }
    }


    function formatearFecha(
        fecha
    ) {

        if (!fecha) {
            return "";
        }


        const [
            anio,
            mes,
            dia
        ] = fecha
            .substring(0, 10)
            .split("-");


        return new Date(
            Number(anio),
            Number(mes) - 1,
            Number(dia)
        ).toLocaleDateString(
            "es-GT",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }


    function formatearHora(
        hora
    ) {

        if (!hora) {
            return "";
        }


        const partes =
            hora.split(":");


        let horas =
            Number(partes[0]);

        const minutos =
            partes[1];

        const periodo =
            horas >= 12
                ? "p. m."
                : "a. m.";


        horas =
            horas % 12 || 12;


        return `${horas}:${minutos} ${periodo}`;
    }


    return (
        <main className="pagina-voluntariado">

            {/* ======================
                ENCABEZADO
            ====================== */}

            <section className="voluntariado-encabezado">

                <span>
                    Comparte tu tiempo
                </span>

                <h1>
                    Forma parte de nuestro voluntariado
                </h1>

                <p>
                    {
                        contenido?.contenido ||
                        "Participa en nuestras actividades y comparte tiempo, compañía y apoyo con nuestros adultos mayores."
                    }
                </p>

            </section>


            {/* ======================
                CONTENIDO
            ====================== */}

            <section className="voluntariado-contenido">

                {/* ACTIVIDADES */}

                <div className="voluntariado-actividades">

                    <div className="voluntariado-titulo-seccion">

                        <span className="subtitulo">
                            Actividades
                        </span>

                        <h2>
                            Actividades disponibles
                        </h2>

                        <p>
                            Selecciona la actividad
                            en la que deseas participar.
                        </p>

                    </div>


                    {cargando ? (

                        <div className="mensaje-estado">
                            Cargando actividades...
                        </div>

                    ) : actividades.length === 0 ? (

                        <div className="voluntariado-sin-actividades">

                            <h3>
                                No hay actividades disponibles
                            </h3>

                            <p>
                                Actualmente no se han
                                publicado nuevas actividades
                                de voluntariado.
                            </p>

                        </div>

                    ) : (

                        <div className="voluntariado-listado">

                            {actividades.map(
                                actividad => {

                                    const seleccionado =
                                        Number(
                                            formulario.idActividad
                                        ) ===
                                        Number(
                                            actividad.id_actividad
                                        );


                                    return (

                                        <button
                                            type="button"

                                            key={
                                                actividad.id_actividad
                                            }

                                            className={
                                                seleccionado
                                                    ? "voluntariado-actividad seleccionada"
                                                    : "voluntariado-actividad"
                                            }

                                            onClick={() =>

                                                setFormulario(
                                                    anterior => ({

                                                        ...anterior,

                                                        idActividad:
                                                            actividad.id_actividad

                                                    })
                                                )

                                            }
                                        >

                                            <div className="voluntariado-actividad-info">

                                                <span>
                                                    {
                                                        formatearFecha(
                                                            actividad.fecha
                                                        )
                                                    }
                                                </span>

                                                <h3>
                                                    {
                                                        actividad.titulo
                                                    }
                                                </h3>

                                                <p>
                                                    {
                                                        actividad.descripcion
                                                    }
                                                </p>


                                                {actividad.hora_inicio && (

                                                    <small>

                                                        {
                                                            formatearHora(
                                                                actividad.hora_inicio
                                                            )
                                                        }

                                                        {actividad.hora_fin && (
                                                            <>
                                                                {" - "}
                                                                {
                                                                    formatearHora(
                                                                        actividad.hora_fin
                                                                    )
                                                                }
                                                            </>
                                                        )}

                                                    </small>

                                                )}

                                            </div>


                                            <div className="voluntariado-cupos">

                                                <strong>
                                                    {
                                                        actividad.cupos_disponibles
                                                    }
                                                </strong>

                                                <span>
                                                    cupos
                                                </span>

                                            </div>

                                        </button>

                                    );
                                }
                            )}

                        </div>

                    )}

                </div>


                {/* FORMULARIO */}

                <div className="voluntariado-formulario-contenedor">

                    <div className="voluntariado-formulario-cabecera">

                        <span className="subtitulo">
                            Inscripción
                        </span>

                        <h2>
                            Solicitar participación
                        </h2>

                        <p>
                            Completa tus datos y
                            selecciona una actividad.
                        </p>

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
                        className="voluntariado-formulario"

                        onSubmit={
                            enviarSolicitud
                        }
                    >

                        <div className="campo-formulario">

                            <label>
                                Nombre completo
                            </label>

                            <input
                                type="text"

                                name="nombreVoluntario"

                                value={
                                    formulario.nombreVoluntario
                                }

                                onChange={
                                    manejarCambio
                                }

                                required
                            />

                        </div>


                        <div className="voluntariado-dos-columnas">

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

                                    required
                                />

                            </div>

                        </div>


                        <div className="campo-formulario">

                            <label>
                                Observaciones
                            </label>

                            <textarea
                                name="observaciones"

                                rows="5"

                                value={
                                    formulario.observaciones
                                }

                                onChange={
                                    manejarCambio
                                }

                                placeholder="Puedes contarnos brevemente cómo deseas apoyar."
                            />

                        </div>


                        <div className="voluntariado-seleccion-resumen">

                            {formulario.idActividad ? (

                                <span>
                                    ✓ Actividad seleccionada
                                </span>

                            ) : (

                                <span>
                                    Selecciona una actividad
                                    antes de enviar la solicitud.
                                </span>

                            )}

                        </div>


                        <button
                            type="submit"

                            className="boton-principal"

                            disabled={
                                enviando ||
                                actividades.length === 0
                            }
                        >

                            {
                                enviando
                                    ? "Enviando..."
                                    : "Enviar solicitud"
                            }

                        </button>

                    </form>

                </div>

            </section>

        </main>
    );
}


export default Voluntariado;