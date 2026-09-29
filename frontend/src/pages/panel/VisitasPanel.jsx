import {
    useEffect,
    useState
} from "react";

import {
    apiFetch
} from "../../services/api";


const disponibilidadInicial = {
    fecha: "",
    horaInicio: "",
    horaFin: "",
    cuposDisponibles: 1
};


function VisitasPanel() {

    const [
        disponibilidades,
        setDisponibilidades
    ] = useState([]);

    const [
        solicitudes,
        setSolicitudes
    ] = useState([]);

    const [
        formulario,
        setFormulario
    ] = useState(
        disponibilidadInicial
    );

    const [
        cargando,
        setCargando
    ] = useState(true);

    const [
        guardando,
        setGuardando
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

        cargarDatos();

    }, []);


    async function cargarDatos() {

        try {

            setCargando(true);
            setError("");


            const [
                respuestaDisponibilidades,
                respuestaSolicitudes
            ] = await Promise.all([

                apiFetch(
                    "/visitas/disponibilidades"
                ),

                apiFetch(
                    "/visitas/solicitudes"
                )

            ]);


            setDisponibilidades(
                Array.isArray(
                    respuestaDisponibilidades
                )
                    ? respuestaDisponibilidades
                    : []
            );


            setSolicitudes(
                Array.isArray(
                    respuestaSolicitudes
                )
                    ? respuestaSolicitudes
                    : []
            );

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "No fue posible cargar la gestión de visitas."
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


    async function crearDisponibilidad(
        evento
    ) {

        evento.preventDefault();


        try {

            setGuardando(true);
            setMensaje("");
            setError("");


            await apiFetch(
                "/visitas/disponibilidades",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            fecha:
                                formulario.fecha,

                            horaInicio:
                                formulario.horaInicio,

                            horaFin:
                                formulario.horaFin,

                            cuposDisponibles:
                                Number(
                                    formulario.cuposDisponibles
                                )

                        })
                }
            );


            setFormulario(
                disponibilidadInicial
            );


            await cargarDatos();


            setMensaje(
                "Horario de visita creado correctamente."
            );

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "No fue posible crear el horario."
            );

        } finally {

            setGuardando(false);
        }
    }


    async function cambiarEstadoSolicitud(
        idSolicitud,
        nuevoEstado
    ) {

        try {

            setMensaje("");
            setError("");


            const respuesta =
                await apiFetch(
                    `/visitas/solicitudes/${idSolicitud}/estado`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify({
                                estado:
                                    nuevoEstado
                            })
                    }
                );


            await cargarDatos();


            setMensaje(
                respuesta.mensaje ||
                `Solicitud actualizada a ${nuevoEstado}.`
            );

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "No fue posible actualizar la solicitud."
            );
        }
    }


    function formatearFecha(
        fecha
    ) {

        if (!fecha) {
            return "";
        }


        const valor =
            fecha.substring(
                0,
                10
            );


        const [
            anio,
            mes,
            dia
        ] = valor.split("-");


        return new Date(
            Number(anio),
            Number(mes) - 1,
            Number(dia)
        ).toLocaleDateString(
            "es-GT",
            {
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


        const [
            horaTexto,
            minutos
        ] = hora.split(":");


        let horas =
            Number(horaTexto);


        const periodo =
            horas >= 12
                ? "p. m."
                : "a. m.";


        horas =
            horas % 12 || 12;


        return `${horas}:${minutos} ${periodo}`;
    }


    function obtenerClaseEstado(
        estado
    ) {

        const valor =
            estado?.toLowerCase();


        if (valor === "aprobada") {
            return "estado-aprobado";
        }

        if (
            valor === "rechazada" ||
            valor === "cancelada"
        ) {
            return "estado-rechazado";
        }


        return "estado-pendiente";
    }


    if (cargando) {

        return (
            <div className="panel-modulo">

                <p>
                    Cargando visitas...
                </p>

            </div>
        );
    }


    return (
        <div className="panel-modulo">

            <div className="panel-cabecera">

                <div>

                    <span>
                        Administración
                    </span>

                    <h1>
                        Gestión de visitas
                    </h1>

                    <p>
                        Administra horarios y
                        solicitudes de visita.
                    </p>

                </div>

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


            {/* =========================
                CREAR HORARIO
            ========================= */}

            <section className="panel-seccion">

                <div className="panel-seccion-titulo">

                    <h2>
                        Crear horario disponible
                    </h2>

                    <p>
                        Publica una nueva fecha
                        para recibir visitantes.
                    </p>

                </div>


                <form
                    className="visitas-panel-formulario"
                    onSubmit={
                        crearDisponibilidad
                    }
                >

                    <div className="campo-formulario">

                        <label>
                            Fecha
                        </label>

                        <input
                            type="date"

                            name="fecha"

                            value={
                                formulario.fecha
                            }

                            onChange={
                                manejarCambio
                            }

                            required
                        />

                    </div>


                    <div className="campo-formulario">

                        <label>
                            Hora de inicio
                        </label>

                        <input
                            type="time"

                            name="horaInicio"

                            value={
                                formulario.horaInicio
                            }

                            onChange={
                                manejarCambio
                            }

                            required
                        />

                    </div>


                    <div className="campo-formulario">

                        <label>
                            Hora de finalización
                        </label>

                        <input
                            type="time"

                            name="horaFin"

                            value={
                                formulario.horaFin
                            }

                            onChange={
                                manejarCambio
                            }

                            required
                        />

                    </div>


                    <div className="campo-formulario">

                        <label>
                            Cupos disponibles
                        </label>

                        <input
                            type="number"

                            min="1"

                            name="cuposDisponibles"

                            value={
                                formulario.cuposDisponibles
                            }

                            onChange={
                                manejarCambio
                            }

                            required
                        />

                    </div>


                    <div className="visitas-panel-boton">

                        <button
                            type="submit"

                            className="boton-principal"

                            disabled={
                                guardando
                            }
                        >

                            {
                                guardando
                                    ? "Creando..."
                                    : "Crear horario"
                            }

                        </button>

                    </div>

                </form>

            </section>


            {/* =========================
                HORARIOS ACTUALES
            ========================= */}

            <section className="panel-seccion">

                <div className="panel-seccion-titulo">

                    <h2>
                        Horarios disponibles
                    </h2>

                </div>


                {disponibilidades.length === 0 ? (

                    <div className="panel-vacio">

                        No hay horarios disponibles.

                    </div>

                ) : (

                    <div className="panel-horarios-grid">

                        {disponibilidades.map(
                            horario => (

                                <article
                                    className="panel-horario-card"

                                    key={
                                        horario.id_disponibilidad
                                    }
                                >

                                    <span>
                                        Fecha
                                    </span>

                                    <h3>
                                        {
                                            formatearFecha(
                                                horario.fecha
                                            )
                                        }
                                    </h3>

                                    <p>
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
                                    </p>


                                    <div className="panel-horario-cupos">

                                        <strong>
                                            {
                                                horario.cupos_disponibles
                                            }
                                        </strong>

                                        <span>
                                            cupos disponibles
                                        </span>

                                    </div>

                                </article>

                            )
                        )}

                    </div>

                )}

            </section>


            {/* =========================
                SOLICITUDES
            ========================= */}

            <section className="panel-seccion">

                <div className="panel-seccion-titulo">

                    <h2>
                        Solicitudes de visita
                    </h2>

                    <p>
                        Revisa y confirma las
                        solicitudes enviadas desde
                        la página pública.
                    </p>

                </div>


                {solicitudes.length === 0 ? (

                    <div className="panel-vacio">

                        No hay solicitudes de visita.

                    </div>

                ) : (

                    <div className="solicitudes-visita-listado">

                        {solicitudes.map(
                            solicitud => (

                                <article
                                    className="solicitud-visita-card"

                                    key={
                                        solicitud.id_solicitud
                                    }
                                >

                                    <div className="solicitud-visita-cabecera">

                                        <div>

                                            <h3>
                                                {
                                                    solicitud.nombre_visitante
                                                }
                                            </h3>

                                            <span>
                                                {
                                                    solicitud.correo ||
                                                    solicitud.correo_visitante ||
                                                    "Correo no registrado"

                                                }
                                            </span>

                                        </div>


                                        <span
                                            className={
                                                `estado-solicitud ${
                                                    obtenerClaseEstado(
                                                        solicitud.estado
                                                    )
                                                }`
                                            }
                                        >
                                            {
                                                solicitud.estado
                                            }
                                        </span>

                                    </div>


                                    <div className="solicitud-visita-datos">

                                        <div>
                                            <strong>
                                                Teléfono
                                            </strong>

                                            <span>
                                                {
                                                    solicitud.telefono ||
                                                    "No registrado"
                                                }
                                            </span>
                                        </div>


                                        <div>
                                            <strong>
                                                Personas
                                            </strong>

                                            <span>
                                                {
                                                    solicitud.cantidad_personas
                                                }
                                            </span>
                                        </div>


                                        <div>
                                            <strong>
                                                Fecha solicitada
                                            </strong>

                                            <span>
                                                {
                                                    formatearFecha(
                                                        solicitud.fecha
                                                    )
                                                }
                                            </span>
                                        </div>


                                        <div>
                                            <strong>
                                                Horario
                                            </strong>

                                            <span>

                                                {
                                                    formatearHora(
                                                        solicitud.hora_inicio
                                                    )
                                                }

                                                {" - "}

                                                {
                                                    formatearHora(
                                                        solicitud.hora_fin
                                                    )
                                                }

                                            </span>
                                        </div>

                                    </div>


                                    {solicitud.motivo && (

                                        <div className="solicitud-motivo">

                                            <strong>
                                                Motivo
                                            </strong>

                                            <p>
                                                {
                                                    solicitud.motivo
                                                }
                                            </p>

                                        </div>

                                    )}


                                    {solicitud.estado ===
                                        "Pendiente" && (

                                        <div className="solicitud-visita-acciones">

                                            <button
                                                type="button"

                                                className="boton-aprobar"

                                                onClick={() =>
                                                    cambiarEstadoSolicitud(
                                                        solicitud.id_solicitud,
                                                        "Aprobada"
                                                    )
                                                }
                                            >
                                                Aprobar
                                            </button>


                                            <button
                                                type="button"

                                                className="boton-rechazar"

                                                onClick={() =>
                                                    cambiarEstadoSolicitud(
                                                        solicitud.id_solicitud,
                                                        "Rechazada"
                                                    )
                                                }
                                            >
                                                Rechazar
                                            </button>

                                        </div>

                                    )}


                                    {solicitud.estado ===
                                        "Aprobada" && (

                                        <div className="solicitud-visita-acciones">

                                            <button
                                                type="button"

                                                className="boton-rechazar"

                                                onClick={() =>
                                                    cambiarEstadoSolicitud(
                                                        solicitud.id_solicitud,
                                                        "Cancelada"
                                                    )
                                                }
                                            >
                                                Cancelar visita
                                            </button>

                                        </div>

                                    )}

                                </article>

                            )
                        )}

                    </div>

                )}

            </section>

        </div>
    );
}


export default VisitasPanel;