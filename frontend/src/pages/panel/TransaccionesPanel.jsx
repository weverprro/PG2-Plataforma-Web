import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../services/api";

function esCompletada(transaccion) {
    const estado = String(transaccion.estado || "").toLowerCase();
    return estado === "completed" || estado === "succeeded";
}

function esCreada(transaccion) {
    const estado = String(transaccion.estado || "").toLowerCase();
    return ["created", "payer_action_required", "pending"].includes(estado);
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";
    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) return "Fecha no disponible";
    return valor.toLocaleString("es-GT", { dateStyle: "medium", timeStyle: "short" });
}

function TransaccionesPanel({ proveedor = "PayPal" }) {
    const [transacciones, setTransacciones] = useState([]);
    const [filtro, setFiltro] = useState("Todas");
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let activo = true;
        setFiltro("Todas");
        setCargando(true);
        setError("");
        apiFetch(`/transacciones?proveedor=${encodeURIComponent(proveedor)}`)
            .then(respuesta => {
                if (!activo) return;
                setTransacciones(Array.isArray(respuesta)
                    ? respuesta : respuesta.transacciones || []);
            })
            .catch(err => {
                if (activo) setError(err.message || "No fue posible cargar las transacciones.");
            })
            .finally(() => {
                if (activo) setCargando(false);
            });
        return () => { activo = false; };
    }, [proveedor]);

    const filtradas = useMemo(() => {
        if (filtro === "Completadas") return transacciones.filter(esCompletada);
        if (filtro === "Creadas") return transacciones.filter(esCreada);
        return transacciones;
    }, [transacciones, filtro]);

    return (
        <div className="transacciones-panel">
            <div className="panel-encabezado">
                <h1>Transacciones {proveedor}</h1>
                <p>
                    Consulta de los pagos registrados mediante {proveedor}.
                    {proveedor === "Recurrente" &&
                        " Las transacciones creadas solo aparecerán si están registradas en la base de datos; actualmente la integración guarda los pagos confirmados."}
                </p>
            </div>

            {error && <div className="mensaje-error">{error}</div>}

            <div className="transacciones-filtros">
                {["Todas", "Completadas", "Creadas"].map(opcion => (
                    <button
                        key={opcion}
                        type="button"
                        className={filtro === opcion ? "activo" : ""}
                        onClick={() => setFiltro(opcion)}
                    >
                        {opcion}
                    </button>
                ))}
            </div>

            {cargando ? (
                <p>Cargando transacciones...</p>
            ) : filtradas.length === 0 ? (
                <div className="panel-vacio">
                    No hay transacciones de {proveedor} registradas en esta categoría.
                </div>
            ) : (
                <div className="transacciones-listado">
                    {filtradas.map(transaccion => (
                        <article
                            className="transaccion-card"
                            key={transaccion.id_transaccion}
                        >
                            <div className="transaccion-superior">
                                <div>
                                    <span className="transaccion-proveedor">
                                        {transaccion.proveedor}
                                    </span>
                                    <h3>Donación #{transaccion.id_donacion}</h3>
                                </div>
                                <span className={`estado-transaccion ${esCompletada(transaccion)
                                    ? "estado-transaccion-completed"
                                    : "estado-transaccion-created"}`}>
                                    {esCompletada(transaccion) ? "Completada" :
                                        esCreada(transaccion) ? "Creada / pendiente" :
                                        transaccion.estado}
                                </span>
                            </div>

                            <div className="transaccion-datos">
                                <div>
                                    <strong>Donante</strong>
                                    <span>{transaccion.nombre_donante || "Donante anónimo"}</span>
                                </div>
                                <div>
                                    <strong>Correo</strong>
                                    <span>{transaccion.correo_donante || "No registrado"}</span>
                                </div>
                                <div>
                                    <strong>Monto</strong>
                                    <span>{transaccion.moneda || "Sin moneda"} {Number(transaccion.monto || 0).toFixed(2)}</span>
                                </div>
                                <div>
                                    <strong>Fecha</strong>
                                    <span>{formatearFecha(transaccion.fecha)}</span>
                                </div>
                            </div>

                            <div className="transaccion-referencias">
                                <div>
                                    <strong>{proveedor === "PayPal" ? "Orden PayPal" : "Checkout Recurrente"}</strong>
                                    <code>{transaccion.orden_externa || "No disponible"}</code>
                                </div>
                                <div>
                                    <strong>Referencia del pago</strong>
                                    <code>{transaccion.referencia_externa || "Pendiente"}</code>
                                </div>
                            </div>

                            <div className="transaccion-donacion-estado">
                                Estado de la donación: <strong>{transaccion.estado_donacion}</strong>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TransaccionesPanel;
