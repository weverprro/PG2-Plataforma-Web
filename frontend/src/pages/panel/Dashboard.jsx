import {
    useEffect,
    useState
} from "react";

import {
    Link
} from "react-router";

import {
    apiFetch
} from "../../services/api";


function Dashboard() {

    const [
        datos,
        setDatos
    ] = useState(null);

    const [
        cargando,
        setCargando
    ] = useState(true);

    const [
        error,
        setError
    ] = useState("");


    useEffect(() => {

        cargarDashboard();

    }, []);


    async function cargarDashboard() {

        try {

            setCargando(true);
            setError("");


            const respuesta =
                await apiFetch(
                    "/dashboard"
                );


            setDatos(
                respuesta
            );


        } catch (error) {

            console.error(
                error
            );


            setError(
                error.message ||
                "No fue posible cargar el resumen del sistema."
            );


        } finally {

            setCargando(false);

        }

    }


    if (cargando) {

        return (
            <div className="dashboard-panel">

                <p>
                    Cargando resumen...
                </p>

            </div>
        );

    }


    if (error) {

        return (
            <div className="dashboard-panel">

                <div className="mensaje-error">

                    {error}

                </div>

            </div>
        );

    }


    const resumen =
        datos?.resumen || {};

    const rol =
        datos?.rol || "";


    return (

        <div className="dashboard-panel">

            <div className="dashboard-encabezado">

                <div>

                    <h1>
                        Panel principal
                    </h1>

                    <p>
                        Resumen general de la
                        actividad de la plataforma.
                    </p>

                </div>


                <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ver-sitio"
                >
                    Ver sitio público
                </a>

            </div>


            <div className="dashboard-rol">

                Sesión iniciada como:

                <strong>
                    {" "}
                    {rol}
                </strong>

            </div>


            <div className="dashboard-tarjetas">


                {"usuariosActivos" in resumen && (

                    <Link
                        to="/panel/usuarios"
                        className="dashboard-card"
                    >

                        <span className="dashboard-card-etiqueta">
                            Usuarios activos
                        </span>

                        <strong>
                            {
                                resumen.usuariosActivos
                            }
                        </strong>

                        <small>
                            Personal con acceso al sistema
                        </small>

                    </Link>

                )}


                {"necesidadesActivas" in resumen && (

                    <Link
                        to="/panel/necesidades"
                        className="dashboard-card"
                    >

                        <span className="dashboard-card-etiqueta">
                            Necesidades activas
                        </span>

                        <strong>
                            {
                                resumen.necesidadesActivas
                            }
                        </strong>

                        <small>
                            Necesidades pendientes de atención
                        </small>

                    </Link>

                )}


                {"visitasPendientes" in resumen && (

                    <Link
                        to="/panel/visitas"
                        className="dashboard-card"
                    >

                        <span className="dashboard-card-etiqueta">
                            Visitas pendientes
                        </span>

                        <strong>
                            {
                                resumen.visitasPendientes
                            }
                        </strong>

                        <small>
                            Solicitudes por revisar
                        </small>

                    </Link>

                )}

                {"visitasProximas" in resumen && (

                    <Link
                        to="/panel/visitas"
                        className="dashboard-card"
                    >

                        <span className="dashboard-card-etiqueta">
                            Visitas próximas
                        </span>

                        <strong>
                            {
                                resumen.visitasProximas
                            }
                        </strong>

                        <small>
                            Visitas aprobadas pendientes de realizar
                        </small>

                    </Link>

                )}


                {"voluntariadosPendientes" in resumen && (

                    <Link
                        to="/panel/voluntariado"
                        className="dashboard-card"
                    >

                        <span className="dashboard-card-etiqueta">
                            Voluntariado pendiente
                        </span>

                        <strong>
                            {
                                resumen.voluntariadosPendientes
                            }
                        </strong>

                        <small>
                            Solicitudes por revisar
                        </small>

                    </Link>

                )}

                {"voluntariadosProximos" in resumen && (

                    <Link
                        to="/panel/voluntariado"
                        className="dashboard-card"
                    >

                        <span className="dashboard-card-etiqueta">
                            Voluntariados próximos
                        </span>

                        <strong>
                            {
                                resumen.voluntariadosProximos
                            }
                        </strong>

                        <small>
                            Participaciones aprobadas pendientes de realizar
                        </small>

                    </Link>

                )}


                <Link
                    to="/panel/donaciones"
                    className="dashboard-card"
                >

                    <span className="dashboard-card-etiqueta">
                        Donaciones en especie
                    </span>

                    <strong>
                        {
                            resumen.donacionesEspecieEnProceso ||
                            0
                        }
                    </strong>

                    <small>
                        En proceso de coordinación
                    </small>

                </Link>


                <Link
                    to="/panel/donaciones"
                    className="dashboard-card"
                >

                    <span className="dashboard-card-etiqueta">
                        Donaciones monetarias
                    </span>

                    <strong>
                        {
                            resumen.donacionesMonetariasConfirmadas ||
                            0
                        }
                    </strong>

                    <small>
                        Pagos confirmados
                    </small>

                </Link>


                <Link
                    to="/panel/transacciones"
                    className="dashboard-card"
                >

                    <span className="dashboard-card-etiqueta">
                        Transacciones PayPal
                    </span>

                    <strong>
                        {
                            resumen.transaccionesCompletadas ||
                            0
                        }
                    </strong>

                    <small>
                        Transacciones completadas
                    </small>

                </Link>


                <div className="dashboard-card dashboard-card-monto">

                    <span className="dashboard-card-etiqueta">
                        Total monetario confirmado
                    </span>

                    <strong>

                        USD{" "}

                        {
                            Number(
                                resumen.montoMonetarioConfirmado ||
                                0
                            ).toFixed(
                                2
                            )
                        }

                    </strong>

                    <small>
                        Donaciones confirmadas por PayPal
                    </small>

                </div>

            </div>

            {Array.isArray(
                resumen.donacionesUltimosTresMeses
            ) && (

                <section className="dashboard-donaciones-historico">

                    <div className="dashboard-seccion-titulo">

                        <div>

                            <h2>
                                Donaciones monetarias
                            </h2>

                            <p>
                                Resumen de los últimos
                                tres meses.
                            </p>

                        </div>

                    </div>


                    <div className="dashboard-meses">

                        {
                            resumen.donacionesUltimosTresMeses.map(
                                (mes) => (

                                    <article
                                        className="dashboard-mes-card"
                                        key={
                                            `${mes.anio}-${mes.mes}`
                                        }
                                    >

                                        <div className="dashboard-mes-encabezado">

                                            <div>

                                                <h3>
                                                    {mes.nombre}{" "}
                                                    {mes.anio}
                                                </h3>

                                                <span>
                                                    {mes.cantidad}{" "}
                                                    {
                                                        mes.cantidad === 1
                                                            ? "donación"
                                                            : "donaciones"
                                                    }
                                                </span>

                                            </div>


                                            <strong>

                                                USD{" "}

                                                {
                                                    Number(
                                                        mes.total
                                                    ).toFixed(
                                                        2
                                                    )
                                                }

                                            </strong>

                                        </div>


                                        <div className="dashboard-semanas">

                                            {mes.semanas.map(
                                                (semana) => {

                                                    const porcentaje =
                                                        Number(
                                                            mes.total
                                                        ) > 0
                                                            ? (
                                                                Number(
                                                                    semana.total
                                                                ) /
                                                                Number(
                                                                    mes.total
                                                                )
                                                            ) * 100
                                                            : 0;


                                                    return (

                                                        <div
                                                            className="dashboard-semana"
                                                            key={
                                                                semana.numero
                                                            }
                                                        >

                                                            <div className="dashboard-semana-info">

                                                                <div>

                                                                    <strong>
                                                                        Semana{" "}
                                                                        {
                                                                            semana.numero
                                                                        }
                                                                    </strong>

                                                                    <span>
                                                                        {
                                                                            semana.periodo
                                                                        }
                                                                    </span>

                                                                </div>


                                                                <div className="dashboard-semana-total">

                                                                    <strong>

                                                                        USD{" "}

                                                                        {
                                                                            Number(
                                                                                semana.total
                                                                            ).toFixed(
                                                                                2
                                                                            )
                                                                        }

                                                                    </strong>

                                                                    <span>

                                                                        {
                                                                            semana.cantidad
                                                                        }{" "}

                                                                        {
                                                                            semana.cantidad === 1
                                                                                ? "donación"
                                                                                : "donaciones"
                                                                        }

                                                                    </span>

                                                                </div>

                                                            </div>


                                                            <div className="dashboard-barra">

                                                                <div
                                                                    className="dashboard-barra-relleno"

                                                                    style={{
                                                                        width:
                                                                            `${porcentaje}%`
                                                                    }}
                                                                />

                                                            </div>

                                                        </div>

                                                    );

                                                }
                                            )}

                                        </div>

                                    </article>

                                )
                            )
                        }

                    </div>

                </section>

            )}


            <section className="dashboard-atencion">

                <h2>
                    Pendientes por atender
                </h2>


                <div className="dashboard-atencion-lista">


                    {"visitasPendientes" in resumen && (

                        <div>

                            <span>
                                Solicitudes de visita
                            </span>

                            <strong>
                                {
                                    resumen.visitasPendientes
                                }
                            </strong>

                        </div>

                    )}


                    {"voluntariadosPendientes" in resumen && (

                        <div>

                            <span>
                                Solicitudes de voluntariado
                            </span>

                            <strong>
                                {
                                    resumen.voluntariadosPendientes
                                }
                            </strong>

                        </div>

                    )}


                    <div>

                        <span>
                            Donaciones en especie en proceso
                        </span>

                        <strong>
                            {
                                resumen.donacionesEspecieEnProceso ||
                                0
                            }
                        </strong>

                    </div>


                </div>

            </section>

        </div>

    );

}


export default Dashboard;