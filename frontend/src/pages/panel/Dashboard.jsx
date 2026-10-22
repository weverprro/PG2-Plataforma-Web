import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiFetch } from "../../services/api";

function formatoMonto(moneda, monto) {
    return `${moneda || "Sin moneda"} ${Number(monto || 0).toFixed(2)}`;
}

function Tarjeta({ titulo, valor, descripcion, ruta, className = "" }) {
    const contenido = (
        <>
            <span className="dashboard-card-etiqueta">{titulo}</span>
            <strong>{valor}</strong>
            <small>{descripcion}</small>
        </>
    );
    return ruta ? (
        <Link to={ruta} className={`dashboard-card ${className}`}>
            {contenido}
        </Link>
    ) : (
        <div className={`dashboard-card ${className}`}>
            {contenido}
        </div>
    );
}

function Dashboard() {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let activo = true;
        apiFetch("/dashboard")
            .then(respuesta => { if (activo) setDatos(respuesta); })
            .catch(err => {
                if (activo) setError(err.message || "No fue posible cargar el resumen del sistema.");
            })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, []);

    if (cargando) return <div className="dashboard-panel"><p>Cargando resumen...</p></div>;
    if (error) return <div className="dashboard-panel"><div className="mensaje-error">{error}</div></div>;

    const resumen = datos?.resumen || {};
    const rol = datos?.rol || "";
    const canales = Array.isArray(resumen.donacionesPorProveedor)
        ? resumen.donacionesPorProveedor : [];
    const paypal = canales.find(c => c.proveedor === "PayPal" && c.moneda === "USD") ||
        { cantidad: 0, total: 0, moneda: "USD" };
    const recurrente = canales.find(c => c.proveedor === "Recurrente" && c.moneda === "GTQ") ||
        { cantidad: 0, total: 0, moneda: "GTQ" };
    const otrosCanales = canales.filter(c => !(
        (c.proveedor === "PayPal" && c.moneda === "USD") ||
        (c.proveedor === "Recurrente" && c.moneda === "GTQ")
    ) && c.cantidad > 0);

    return (
        <div className="dashboard-panel">
            <div className="dashboard-encabezado">
                <div>
                    <h1>Panel principal</h1>
                    <p>Resumen general de la actividad de la plataforma.</p>
                </div>
                <a href="/" target="_blank" rel="noopener noreferrer" className="btn-ver-sitio">
                    Ver sitio público
                </a>
            </div>

            <div className="dashboard-rol">
                Sesión iniciada como: <strong>{rol}</strong>
            </div>

            <div className="dashboard-tarjetas">
                {"usuariosActivos" in resumen && (
                    <Tarjeta titulo="Usuarios activos" valor={resumen.usuariosActivos}
                        descripcion="Personal con acceso al sistema" ruta="/panel/usuarios" />
                )}
                {"necesidadesActivas" in resumen && (
                    <Tarjeta titulo="Necesidades activas" valor={resumen.necesidadesActivas}
                        descripcion="Necesidades pendientes de atención" ruta="/panel/necesidades" />
                )}
                {"visitasPendientes" in resumen && (
                    <Tarjeta titulo="Visitas pendientes" valor={resumen.visitasPendientes}
                        descripcion="Solicitudes por revisar que aún no han vencido" ruta="/panel/visitas" />
                )}
                {"visitasProximas" in resumen && (
                    <Tarjeta titulo="Visitas próximas" valor={resumen.visitasProximas}
                        descripcion="Visitas aprobadas pendientes de realizar" ruta="/panel/visitas" />
                )}
                {"voluntariadosPendientes" in resumen && (
                    <Tarjeta titulo="Voluntariado pendiente" valor={resumen.voluntariadosPendientes}
                        descripcion="Solicitudes por revisar que aún no han vencido" ruta="/panel/voluntariado" />
                )}
                {"voluntariadosProximos" in resumen && (
                    <Tarjeta titulo="Voluntariados próximos" valor={resumen.voluntariadosProximos}
                        descripcion="Participaciones aprobadas pendientes de realizar" ruta="/panel/voluntariado" />
                )}
                <Tarjeta titulo="Donaciones en especie" valor={resumen.donacionesEspecieEnProceso || 0}
                    descripcion="En proceso de coordinación" ruta="/panel/donaciones" />
                <Tarjeta titulo="Donaciones monetarias" valor={resumen.donacionesMonetariasConfirmadas || 0}
                    descripcion="Total confirmado, sin mezclar montos de distintas monedas" ruta="/panel/donaciones" />
            </div>

            <h2 className="dashboard-canal-titulo">Pagos por proveedor y moneda</h2>
            <div className="dashboard-canal-tarjetas">
                <Tarjeta titulo="Transacciones PayPal completadas"
                    valor={resumen.transaccionesPayPalCompletadas || 0}
                    descripcion="Solo PayPal" ruta="/panel/transacciones" />
                <Tarjeta titulo="Total confirmado por PayPal"
                    valor={formatoMonto("USD", paypal.total)}
                    descripcion={`${paypal.cantidad} donación(es) confirmada(s)`}
                    ruta="/panel/donaciones" className="dashboard-card-monto" />
                <Tarjeta titulo="Transacciones Recurrente completadas"
                    valor={resumen.transaccionesRecurrenteCompletadas || 0}
                    descripcion="Solo Recurrente" ruta="/panel/transacciones-recurrente" />
                <Tarjeta titulo="Total confirmado por Recurrente"
                    valor={formatoMonto("GTQ", recurrente.total)}
                    descripcion={`${recurrente.cantidad} donación(es) confirmada(s)`}
                    ruta="/panel/donaciones" className="dashboard-card-monto" />
                {otrosCanales.map(canal => (
                    <Tarjeta key={`${canal.proveedor}-${canal.moneda}`}
                        titulo={`Sin clasificación habitual: ${canal.proveedor}`}
                        valor={formatoMonto(canal.moneda, canal.total)}
                        descripcion={`${canal.cantidad} donación(es). Revisar proveedor y registro de pago.`}
                        ruta="/panel/donaciones" className="dashboard-card-monto" />
                ))}
            </div>

            {Array.isArray(resumen.donacionesUltimosTresMeses) && (
                <section className="dashboard-donaciones-historico">
                    <div className="dashboard-seccion-titulo">
                        <h2>Donaciones monetarias</h2>
                        <p>Últimos tres meses, separados por proveedor y moneda.</p>
                    </div>
                    <div className="dashboard-meses">
                        {resumen.donacionesUltimosTresMeses.map(mes => (
                            <article className="dashboard-mes-card" key={`${mes.anio}-${mes.mes}`}>
                                <div className="dashboard-mes-encabezado">
                                    <h3>{mes.nombre} {mes.anio}</h3>
                                    <span>Montos independientes por moneda</span>
                                </div>
                                {mes.canales.map(canal => (
                                    <div className="dashboard-canal-historico"
                                        key={`${canal.proveedor}-${canal.moneda}`}>
                                        <div className="dashboard-canal-historico-cabecera">
                                            <h4>{canal.proveedor} · {canal.moneda}</h4>
                                            <strong>{formatoMonto(canal.moneda, canal.total)} · {canal.cantidad} donación(es)</strong>
                                        </div>
                                        <div className="dashboard-semanas">
                                            {canal.semanas.map(semana => {
                                                const porcentaje = canal.total > 0
                                                    ? (semana.total / canal.total) * 100 : 0;
                                                return (
                                                    <div className="dashboard-semana" key={semana.numero}>
                                                        <div className="dashboard-semana-info">
                                                            <div>
                                                                <strong>Semana {semana.numero}</strong>
                                                                <span>{semana.periodo}</span>
                                                            </div>
                                                            <div className="dashboard-semana-total">
                                                                <strong>{formatoMonto(canal.moneda, semana.total)}</strong>
                                                                <span>{semana.cantidad} donación(es)</span>
                                                            </div>
                                                        </div>
                                                        <div className="dashboard-barra">
                                                            <div className="dashboard-barra-relleno"
                                                                style={{
                                                                    width: `${porcentaje}%`,
                                                                    backgroundColor: canal.proveedor === "Recurrente"
                                                                        ? "var(--color-secondary)" : "var(--color-primary)"
                                                                }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </article>
                        ))}
                    </div>
                </section>
            )}

            <section className="dashboard-atencion">
                <h2>Pendientes por atender</h2>
                <div className="dashboard-atencion-lista">
                    {"visitasPendientes" in resumen && (
                        <div><span>Solicitudes de visita no vencidas</span><strong>{resumen.visitasPendientes}</strong></div>
                    )}
                    {"voluntariadosPendientes" in resumen && (
                        <div><span>Solicitudes de voluntariado no vencidas</span>
                            <strong>{resumen.voluntariadosPendientes}</strong></div>
                    )}
                    <div><span>Donaciones en especie en proceso</span>
                        <strong>{resumen.donacionesEspecieEnProceso || 0}</strong></div>
                </div>
            </section>
        </div>
    );
}

export default Dashboard;
