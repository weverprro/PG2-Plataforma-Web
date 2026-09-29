import {
    useEffect,
    useState
} from "react";

import {
    apiFetch
} from "../../services/api";


const formularioInicial = {
    nombreVisitante: "",
    correo: "",
    telefono: "",
    cantidadPersonas: 1,
    motivo: "",
    idDisponibilidad: ""
};


function Visitas() {

    const [
        disponibilidades,
        setDisponibilidades
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
                respuestaDisponibilidades,
                respuestaContenido
            ] = await Promise.all([

                apiFetch(
                    "/visitas/disponibilidades"
                ),

                apiFetch(
                    "/contenidos/tipo/Visitas"
                )

            ]);


            setDisponibilidades(
                Array.isArray(
                    respuestaDisponibilidades
                )
                    ? respuestaDisponibilidades
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
                "Error cargando visitas:",
                error
            );

            setError(
                "No fue posible cargar la información de visitas."
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
                !formulario.idDisponibilidad
            ) {

                setError(
                    "Selecciona un horario disponible."
                );

                return;
            }


            const datos = {

                nombreVisitante:
                    formulario.nombreVisitante,

                correoVisitante:
                    formulario.correo,

                telefono:
                    formulario.telefono,

                cantidadPersonas:
                    Number(
                        formulario.cantidadPersonas
                    ),

                motivo:
                    formulario.motivo,

                idDisponibilidad:
                    Number(
                        formulario.idDisponibilidad
                    )

            };


            const respuesta =
                await apiFetch(
                    "/visitas/solicitudes",
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
                "Solicitud enviada correctamente."
            );


            setFormulario(
                formularioInicial
            );


            /*
             * Recargamos por si la
             * disponibilidad cambió.
             */
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
        <main className="pagina-visitas">

            {/* =====================
                ENCABEZADO
            ===================== */}

            <section className="visitas-encabezado">

                <span>
                    Comparte con nosotros
                </span>

                <h1>
                    Visita nuestro hogar
                </h1>

                <p>
                    {
                        contenido?.contenido ||
                        "Consulta los horarios disponibles y envía tu solicitud de visita. El personal del hogar revisará la información antes de confirmar tu visita."
                    }
                </p>

            </section>


            {/* =====================
                CONTENIDO
            ===================== */}

            <section className="visitas-contenido">

                {/* HORARIOS */}

                <div className="visitas-horarios">

                    <div className="visitas-titulo-seccion">

                        <span className="subtitulo">
                            Disponibilidad
                        </span>

                        <h2>
                            Horarios disponibles
                        </h2>

                        <p>
                            Selecciona uno de los
                            horarios disponibles para
                            realizar tu solicitud.
                        </p>

                    </div>


                    {cargando ? (

                        <div className="mensaje-estado">
                            Cargando horarios...
                        </div>

                    ) : disponibilidades.length === 0 ? (

                        <div className="visitas-sin-horarios">

                            <h3>
                                No hay horarios disponibles
                            </h3>

                            <p>
                                En este momento no se han
                                publicado nuevos horarios
                                de visita.
                            </p>

                        </div>

                    ) : (

                        <div className="visitas-listado">

                            {disponibilidades.map(
                                horario => {

                                    const seleccionado =
                                        Number(
                                            formulario.idDisponibilidad
                                        ) ===
                                        Number(
                                            horario.id_disponibilidad
                                        );


                                    return (

                                        <button
                                            type="button"

                                            key={
                                                horario.id_disponibilidad
                                            }

                                            className={
                                                seleccionado
                                                    ? "visita-horario seleccionado"
                                                    : "visita-horario"
                                            }

                                            onClick={() =>

                                                setFormulario(
                                                    anterior => ({

                                                        ...anterior,

                                                        idDisponibilidad:
                                                            horario.id_disponibilidad

                                                    })
                                                )

                                            }
                                        >

                                            <div className="visita-horario-fecha">

                                                <strong>
                                                    {
                                                        formatearFecha(
                                                            horario.fecha
                                                        )
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        formatearHora(
                                                            horario.hora_inicio
                                                        )
                                                    }
                                                    {" - "}
                                                    {
                                                        formatearHora(
                                                            horario.hora_fin
                                                        )
                                                    }
                                                </span>

                                            </div>


                                            <div className="visita-horario-cupos">

                                                <strong>
                                                    {
                                                        horario.cupos_disponibles
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

                <div className="visitas-formulario-contenedor">

                    <div className="visitas-formulario-cabecera">

                        <span className="subtitulo">
                            Solicitud
                        </span>

                        <h2>
                            Solicitar una visita
                        </h2>

                        <p>
                            Completa tus datos.
                            La solicitud será revisada
                            por el personal del hogar.
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
                        className="visitas-formulario"
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

                                name="nombreVisitante"

                                value={
                                    formulario.nombreVisitante
                                }

                                onChange={
                                    manejarCambio
                                }

                                required
                            />

                        </div>


                        <div className="visitas-dos-columnas">

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
                                Cantidad de personas
                            </label>

                            <input
                                type="number"

                                name="cantidadPersonas"

                                min="1"

                                value={
                                    formulario.cantidadPersonas
                                }

                                onChange={
                                    manejarCambio
                                }

                                required
                            />

                        </div>


                        <div className="campo-formulario">

                            <label>
                                Motivo de la visita
                            </label>

                            <textarea
                                name="motivo"

                                rows="5"

                                value={
                                    formulario.motivo
                                }

                                onChange={
                                    manejarCambio
                                }

                                placeholder="Puedes contarnos brevemente el motivo de tu visita."
                            />

                        </div>


                        <div className="visita-seleccion-resumen">

                            {formulario.idDisponibilidad ? (

                                <span>
                                    ✓ Horario seleccionado
                                </span>

                            ) : (

                                <span>
                                    Selecciona un horario
                                    antes de enviar la solicitud.
                                </span>

                            )}

                        </div>


                        <button
                            type="submit"

                            className="boton-principal"

                            disabled={
                                enviando ||
                                disponibilidades.length === 0
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


export default Visitas;