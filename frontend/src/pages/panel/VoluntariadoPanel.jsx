import {
    useEffect,
    useState
} from "react";

import {
    apiFetch
} from "../../services/api";


const actividadInicial = {
    titulo: "",
    descripcion: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    cuposDisponibles: 1
};


function VoluntariadoPanel() {

    const [
        actividades,
        setActividades
    ] = useState([]);

    const [
        solicitudes,
        setSolicitudes
    ] = useState([]);

    const [
        formulario,
        setFormulario
    ] = useState(
        actividadInicial
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
                respuestaActividades,
                respuestaSolicitudes
            ] = await Promise.all([

                apiFetch(
                    "/voluntariado/actividades"
                ),

                apiFetch(
                    "/voluntariado/solicitudes"
                )

            ]);


            setActividades(
                Array.isArray(
                    respuestaActividades
                )
                    ? respuestaActividades
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
                "No fue posible cargar la gestión de voluntariado."
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


    async function crearActividad(
        evento
    ) {

        evento.preventDefault();


        try {

            setGuardando(true);
            setMensaje("");
            setError("");


            await apiFetch(
                "/voluntariado/actividades",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            titulo:
                                formulario.titulo,

                            descripcion:
                                formulario.descripcion,

                            fecha:
                                formulario.fecha,

                            horaInicio:
                                formulario.horaInicio ||
                                null,

                            horaFin:
                                formulario.horaFin ||
                                null,

                            cuposDisponibles:
                                Number(
                                    formulario.cuposDisponibles
                                )

                        })
                }
            );


            setFormulario(
                actividadInicial
            );


            await cargarDatos();


            setMensaje(
                "Actividad de voluntariado creada correctamente."
            );

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "No fue posible crear la actividad."
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
                    `/voluntariado/solicitudes/${idSolicitud}/estado`,
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
                    Cargando voluntariado...
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
                        Gestión de voluntariado
                    </h1>

                    <p>
                        Administra actividades y
                        solicitudes de voluntariado.
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
                CREAR ACTIVIDAD
            ========================= */}

            <section className="panel-seccion">

                <div className="panel-seccion-titulo">

                    <h2>
                        Crear actividad
                    </h2>

                    <p>
                        Publica una nueva actividad
                        para recibir voluntarios.
                    </p>

                </div>


                <form
                    className="voluntariado-panel-formulario"

                    onSubmit={
                        crearActividad
                    }
                >

                    <div className="campo-formulario">

                        <label>
                            Título
                        </label>

                        <input
                            type="text"

                            name="titulo"

                            value={
                                formulario.titulo
                            }

                            onChange={
                                manejarCambio
                            }

                            required
                        />

                    </div>


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
                        />

                    </div>


                    <div className="campo-formulario">

                        <label>
                            Cupos
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


                    <div className="campo-formulario voluntariado-descripcion">

                        <label>
                            Descripción
                        </label>

                        <textarea
                            name="descripcion"

                            rows="5"

                            value={
                                formulario.descripcion
                            }

                            onChange={
                                manejarCambio
                            }

                            required
                        />

                    </div>


                    <div className="voluntariado-panel-boton">

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
                                    : "Crear actividad"
                            }

                        </button>

                    </div>

                </form>

            </section>


            {/* =========================
                ACTIVIDADES
            ========================= */}

            <section className="panel-seccion">

                <div className="panel-seccion-titulo">

                    <h2>
                        Actividades disponibles
                    </h2>

                </div>


                {actividades.length === 0 ? (

                    <div className="panel-vacio">
                        No hay actividades disponibles.
                    </div>

                ) : (

                    <div className="panel-actividades-grid">

                        {actividades.map(
                            actividad => (

                                <article
                                    className="panel-actividad-card"

                                    key={
                                        actividad.id_actividad
                                    }
                                >

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

                                        <div className="panel-actividad-horario">

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

                                        </div>

                                    )}


                                    <div className="panel-actividad-cupos">

                                        <strong>
                                            {
                                                actividad.cupos_disponibles
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
                        Solicitudes de voluntariado
                    </h2>

                    <p>
                        Revisa las solicitudes
                        enviadas desde la página
                        pública.
                    </p>

                </div>


                {solicitudes.length === 0 ? (

                    <div className="panel-vacio">
                        No hay solicitudes de voluntariado.
                    </div>

                ) : (

                    <div className="solicitudes-voluntariado-listado">

                        {solicitudes.map(
                            solicitud => (

                                <article
                                    className="solicitud-voluntariado-card"

                                    key={
                                        solicitud.id_solicitud
                                    }
                                >

                                    <div className="solicitud-voluntariado-cabecera">

                                        <div>

                                            <h3>
                                                {
                                                    solicitud.nombre_voluntario
                                                }
                                            </h3>

                                            <span>
                                                {
                                                    solicitud.correo ||
                                                    solicitud.correo_voluntario ||
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


                                    <div className="solicitud-voluntariado-datos">

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
                                                Actividad
                                            </strong>

                                            <span>
                                                {
                                                    solicitud.titulo_actividad ||
                                                    solicitud.titulo ||
                                                    "Actividad de voluntariado"
                                                }
                                            </span>

                                        </div>


                                        {solicitud.fecha && (

                                            <div>

                                                <strong>
                                                    Fecha
                                                </strong>

                                                <span>
                                                    {
                                                        formatearFecha(
                                                            solicitud.fecha
                                                        )
                                                    }
                                                </span>

                                            </div>

                                        )}

                                    </div>


                                    {solicitud.observaciones && (

                                        <div className="solicitud-motivo">

                                            <strong>
                                                Observaciones
                                            </strong>

                                            <p>
                                                {
                                                    solicitud.observaciones
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
                                                Cancelar participación
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


export default VoluntariadoPanel;