import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    apiFetch
} from "../../services/api";


function DonacionesPanel() {

    const [donaciones, setDonaciones] =
        useState([]);

    const [filtro, setFiltro] =
        useState("Todas");

    const [cargando, setCargando] =
        useState(true);

    const [actualizandoId, setActualizandoId] =
        useState(null);

    const [mensaje, setMensaje] =
        useState("");

    const [error, setError] =
        useState("");


    useEffect(() => {

        cargarDonaciones();

    }, []);


    async function cargarDonaciones() {

        try {

            setCargando(true);
            setError("");


            const respuesta =
                await apiFetch(
                    "/donaciones"
                );


            const lista =
                Array.isArray(respuesta)
                    ? respuesta
                    : respuesta.donaciones || [];


            setDonaciones(lista);


        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "No fue posible cargar las donaciones."
            );

        } finally {

            setCargando(false);

        }

    }


    async function cambiarEstado(
        idDonacion,
        nuevoEstado
    ) {

        try {

            setActualizandoId(
                idDonacion
            );

            setMensaje("");
            setError("");


            const respuesta =
                await apiFetch(
                    `/donaciones/${idDonacion}/estado`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify({
                                estado:
                                    nuevoEstado
                            })
                    }
                );


            await cargarDonaciones();


            setMensaje(
                respuesta.mensaje ||
                `Donación actualizada a ${nuevoEstado}.`
            );


        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "No fue posible actualizar la donación."
            );

        } finally {

            setActualizandoId(null);

        }

    }


    const donacionesFiltradas =
        useMemo(() => {

            if (
                filtro === "Todas"
            ) {

                return donaciones;

            }


            return donaciones.filter(
                (donacion) =>
                    donacion.tipo_donacion ===
                    filtro
            );

        }, [
            donaciones,
            filtro
        ]);


    function formatearFecha(
        fecha
    ) {

        if (!fecha) {

            return "Sin fecha";

        }


        return new Date(
            fecha
        ).toLocaleString(
            "es-GT",
            {
                dateStyle:
                    "medium",

                timeStyle:
                    "short"
            }
        );

    }


    function obtenerAcciones(
        donacion
    ) {

        if (
            donacion.tipo_donacion !==
            "Especie"
        ) {

            return null;

        }


        const estado =
            donacion.estado;


        if (
            estado === "Pendiente"
        ) {

            return (
                <>
                    <button
                        className="btn-donacion btn-contactada"

                        disabled={
                            actualizandoId ===
                            donacion.id_donacion
                        }

                        onClick={() =>
                            cambiarEstado(
                                donacion.id_donacion,
                                "Contactada"
                            )
                        }
                    >
                        Marcar contactada
                    </button>

                    <button
                        className="btn-donacion btn-cancelar"

                        disabled={
                            actualizandoId ===
                            donacion.id_donacion
                        }

                        onClick={() =>
                            cambiarEstado(
                                donacion.id_donacion,
                                "Cancelada"
                            )
                        }
                    >
                        Cancelar
                    </button>
                </>
            );

        }


        if (
            estado === "Contactada"
        ) {

            return (
                <>
                    <button
                        className="btn-donacion btn-coordinada"

                        disabled={
                            actualizandoId ===
                            donacion.id_donacion
                        }

                        onClick={() =>
                            cambiarEstado(
                                donacion.id_donacion,
                                "Coordinada"
                            )
                        }
                    >
                        Marcar coordinada
                    </button>

                    <button
                        className="btn-donacion btn-cancelar"

                        disabled={
                            actualizandoId ===
                            donacion.id_donacion
                        }

                        onClick={() =>
                            cambiarEstado(
                                donacion.id_donacion,
                                "Cancelada"
                            )
                        }
                    >
                        Cancelar
                    </button>
                </>
            );

        }


        if (
            estado === "Coordinada"
        ) {

            return (
                <>
                    <button
                        className="btn-donacion btn-recibida"

                        disabled={
                            actualizandoId ===
                            donacion.id_donacion
                        }

                        onClick={() =>
                            cambiarEstado(
                                donacion.id_donacion,
                                "Recibida"
                            )
                        }
                    >
                        Marcar recibida
                    </button>

                    <button
                        className="btn-donacion btn-cancelar"

                        disabled={
                            actualizandoId ===
                            donacion.id_donacion
                        }

                        onClick={() =>
                            cambiarEstado(
                                donacion.id_donacion,
                                "Cancelada"
                            )
                        }
                    >
                        Cancelar
                    </button>
                </>
            );

        }


        return null;

    }


    return (

        <div className="donaciones-panel">

            <div className="panel-encabezado">

                <div>

                    <h1>
                        Donaciones
                    </h1>

                    <p>
                        Consulta y seguimiento de las
                        donaciones registradas en la
                        plataforma.
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


            <div className="donaciones-filtros">

                <button
                    className={
                        filtro === "Todas"
                            ? "activo"
                            : ""
                    }

                    onClick={() =>
                        setFiltro(
                            "Todas"
                        )
                    }
                >
                    Todas
                </button>


                <button
                    className={
                        filtro === "Monetaria"
                            ? "activo"
                            : ""
                    }

                    onClick={() =>
                        setFiltro(
                            "Monetaria"
                        )
                    }
                >
                    Monetarias
                </button>


                <button
                    className={
                        filtro === "Especie"
                            ? "activo"
                            : ""
                    }

                    onClick={() =>
                        setFiltro(
                            "Especie"
                        )
                    }
                >
                    En especie
                </button>

            </div>


            {cargando ? (

                <p>
                    Cargando donaciones...
                </p>

            ) : donacionesFiltradas.length === 0 ? (

                <div className="panel-vacio">

                    No hay donaciones
                    registradas en esta
                    categoría.

                </div>

            ) : (

                <div className="donaciones-listado">

                    {donacionesFiltradas.map(
                        (donacion) => (

                            <article
                                className="donacion-card"

                                key={
                                    donacion.id_donacion
                                }
                            >

                                <div className="donacion-card-superior">

                                    <div>

                                        <span
                                            className={
                                                `donacion-tipo ${
                                                    donacion.tipo_donacion ===
                                                    "Monetaria"
                                                        ? "monetaria"
                                                        : "especie"
                                                }`
                                            }
                                        >

                                            {
                                                donacion.tipo_donacion
                                            }

                                        </span>


                                        <h3>

                                            {
                                                donacion.nombre_donante ||
                                                "Donante anónimo"
                                            }

                                        </h3>

                                    </div>


                                    <span
                                        className={
                                            `estado-donacion estado-${donacion.estado
                                                ?.toLowerCase()
                                                .replace(
                                                    /\s+/g,
                                                    "-"
                                                )}`
                                        }
                                    >

                                        {
                                            donacion.estado
                                        }

                                    </span>

                                </div>


                                <div className="donacion-informacion">

                                    <div>

                                        <strong>
                                            Correo
                                        </strong>

                                        <span>
                                            {
                                                donacion.correo_donante ||
                                                "No registrado"
                                            }
                                        </span>

                                    </div>


                                    {donacion.tipo_donacion ===
                                        "Especie" && (

                                        <div>

                                            <strong>
                                                Teléfono
                                            </strong>

                                            <span>
                                                {
                                                    donacion.telefono_donante ||
                                                    "No registrado"
                                                }
                                            </span>

                                        </div>

                                    )}


                                    <div>

                                        <strong>
                                            Fecha
                                        </strong>

                                        <span>
                                            {
                                                formatearFecha(
                                                    donacion.fecha
                                                )
                                            }
                                        </span>

                                    </div>


                                    {donacion.tipo_donacion ===
                                        "Monetaria" && (

                                        <div>

                                            <strong>
                                                Monto
                                            </strong>

                                            <span>
                                                USD{" "}
                                                {
                                                    Number(
                                                        donacion.monto ||
                                                        0
                                                    ).toFixed(
                                                        2
                                                    )
                                                }
                                            </span>

                                        </div>

                                    )}

                                </div>


                                {donacion.descripcion && (

                                    <div className="donacion-descripcion">

                                        <strong>
                                            Descripción
                                        </strong>

                                        <p>
                                            {
                                                donacion.descripcion
                                            }
                                        </p>

                                    </div>

                                )}


                                {donacion.tipo_donacion ===
                                    "Especie" ? (

                                    <div className="donacion-acciones">

                                        {
                                            obtenerAcciones(
                                                donacion
                                            )
                                        }


                                        {(
                                            donacion.estado ===
                                            "Recibida" ||
                                            donacion.estado ===
                                            "Cancelada"
                                        ) && (

                                            <span className="donacion-finalizada">

                                                No requiere más
                                                acciones.

                                            </span>

                                        )}

                                    </div>

                                ) : (

                                    <div className="donacion-paypal-info">

                                        El estado de esta
                                        donación monetaria se
                                        gestiona mediante PayPal.

                                    </div>

                                )}

                            </article>

                        )
                    )}

                </div>

            )}

        </div>

    );

}


export default DonacionesPanel;