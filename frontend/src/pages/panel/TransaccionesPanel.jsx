import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    apiFetch
} from "../../services/api";


function TransaccionesPanel() {

    const [
        transacciones,
        setTransacciones
    ] = useState([]);

    const [
        filtro,
        setFiltro
    ] = useState("Todas");

    const [
        cargando,
        setCargando
    ] = useState(true);

    const [
        error,
        setError
    ] = useState("");


    useEffect(() => {

        cargarTransacciones();

    }, []);


    async function cargarTransacciones() {

        try {

            setCargando(true);
            setError("");


            const respuesta =
                await apiFetch(
                    "/transacciones"
                );


            const lista =
                Array.isArray(respuesta)
                    ? respuesta
                    : respuesta.transacciones ||
                      [];


            setTransacciones(
                lista
            );


        } catch (error) {

            console.error(
                error
            );


            setError(
                error.message ||
                "No fue posible cargar las transacciones."
            );


        } finally {

            setCargando(false);

        }

    }


    const transaccionesFiltradas =
        useMemo(() => {

            if (
                filtro === "Todas"
            ) {

                return transacciones;

            }


            return transacciones.filter(
                (transaccion) =>
                    transaccion.estado ===
                    filtro
            );

        }, [
            transacciones,
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


    return (

        <div className="transacciones-panel">

            <div className="panel-encabezado">

                <h1>
                    Transacciones PayPal
                </h1>

                <p>
                    Consulta de los pagos
                    electrónicos registrados
                    mediante PayPal.
                </p>

            </div>


            {error && (

                <div className="mensaje-error">

                    {error}

                </div>

            )}


            <div className="transacciones-filtros">

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
                        filtro === "COMPLETED"
                            ? "activo"
                            : ""
                    }

                    onClick={() =>
                        setFiltro(
                            "COMPLETED"
                        )
                    }
                >
                    Completadas
                </button>


                <button
                    className={
                        filtro === "CREATED"
                            ? "activo"
                            : ""
                    }

                    onClick={() =>
                        setFiltro(
                            "CREATED"
                        )
                    }
                >
                    Creadas
                </button>

            </div>


            {cargando ? (

                <p>
                    Cargando transacciones...
                </p>

            ) : transaccionesFiltradas.length ===
                0 ? (

                <div className="panel-vacio">

                    No hay transacciones
                    registradas en esta
                    categoría.

                </div>

            ) : (

                <div className="transacciones-listado">

                    {transaccionesFiltradas.map(
                        (
                            transaccion
                        ) => (

                            <article
                                className="transaccion-card"

                                key={
                                    transaccion.id_transaccion
                                }
                            >

                                <div className="transaccion-superior">

                                    <div>

                                        <span className="transaccion-proveedor">

                                            {
                                                transaccion.proveedor ||
                                                "PayPal"
                                            }

                                        </span>


                                        <h3>

                                            Donación #

                                            {
                                                transaccion.id_donacion
                                            }

                                        </h3>

                                    </div>


                                    <span
                                        className={
                                            `estado-transaccion estado-transaccion-${transaccion.estado
                                                ?.toLowerCase()}`
                                        }
                                    >

                                        {
                                            transaccion.estado
                                        }

                                    </span>

                                </div>


                                <div className="transaccion-datos">

                                    <div>

                                        <strong>
                                            Donante
                                        </strong>

                                        <span>
                                            {
                                                transaccion.nombre_donante ||
                                                "Donante anónimo"
                                            }
                                        </span>

                                    </div>


                                    <div>

                                        <strong>
                                            Correo
                                        </strong>

                                        <span>
                                            {
                                                transaccion.correo_donante ||
                                                "No registrado"
                                            }
                                        </span>

                                    </div>


                                    <div>

                                        <strong>
                                            Monto
                                        </strong>

                                        <span>

                                            {
                                                transaccion.moneda ||
                                                "USD"
                                            }

                                            {" "}

                                            {
                                                Number(
                                                    transaccion.monto ||
                                                    0
                                                ).toFixed(
                                                    2
                                                )
                                            }

                                        </span>

                                    </div>


                                    <div>

                                        <strong>
                                            Fecha
                                        </strong>

                                        <span>
                                            {
                                                formatearFecha(
                                                    transaccion.fecha
                                                )
                                            }
                                        </span>

                                    </div>

                                </div>


                                <div className="transaccion-referencias">

                                    <div>

                                        <strong>
                                            Orden PayPal
                                        </strong>

                                        <code>
                                            {
                                                transaccion.orden_externa ||
                                                "No disponible"
                                            }
                                        </code>

                                    </div>


                                    <div>

                                        <strong>
                                            Referencia del pago
                                        </strong>

                                        <code>
                                            {
                                                transaccion.referencia_externa ||
                                                "Pendiente"
                                            }
                                        </code>

                                    </div>

                                </div>


                                <div className="transaccion-donacion-estado">

                                    Estado de la donación:

                                    <strong>
                                        {" "}
                                        {
                                            transaccion.estado_donacion
                                        }
                                    </strong>

                                </div>

                            </article>

                        )
                    )}

                </div>

            )}

        </div>

    );

}


export default TransaccionesPanel;