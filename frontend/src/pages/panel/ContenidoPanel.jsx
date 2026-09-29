import {
    useEffect,
    useState
} from "react";

import {
    apiFetch,
    obtenerUrlArchivo
} from "../../services/api";

const tiposContenido = [

    {
        valor: "QuienesSomos",
        nombre: "Quiénes somos"
    },

    {
        valor: "Historia",
        nombre: "Historia"
    },

    {
        valor: "Mision",
        nombre: "Misión"
    },

    {
        valor: "Vision",
        nombre: "Visión"
    },

    {
        valor: "Valores",
        nombre: "Valores"
    },

    {
        valor: "ComoAyudar",
        nombre: "Cómo ayudar"
    },

    {
        valor: "Visitas",
        nombre: "Visitas"
    },

    {
        valor: "Voluntariado",
        nombre: "Voluntariado"
    },

    {
        valor: "Donaciones",
        nombre: "Donaciones"
    },

    {
        valor: "Contacto",
        nombre: "Contacto"
    }

];

function ContenidoPanel() {

    const [
        listado,
        setListado
    ] = useState([]);

    const [
        tipoSeleccionado,
        setTipoSeleccionado
    ] = useState(
        "QuienesSomos"
    );

    const [
        formulario,
        setFormulario
    ] = useState({
        titulo: "",
        contenido: "",
        imagenUrl: "",
    });

    const [
        archivo,
        setArchivo
    ] = useState(null);

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
        cargarContenido();
    }, []);

    useEffect(() => {
        cargarFormulario();
    }, [
        tipoSeleccionado,
        listado
    ]);

    async function cargarContenido() {

        try {
            setCargando(true);
            const respuesta =
                await apiFetch(
                    "/contenidos/admin/listado"
                );

            setListado(
                Array.isArray(respuesta)
                    ? respuesta
                    : []
            );

        } catch (error) {
            console.error(error);
            setError(
                "No fue posible cargar el contenido institucional."
            );
        } finally {
            setCargando(false);
        }
    }

    function cargarFormulario() {
        const encontrado =
            listado.find(
                item =>
                    item.tipo_contenido ===
                    tipoSeleccionado
            );

        if (encontrado) {
            setFormulario({
                titulo:
                    encontrado.titulo ||
                    "",
                contenido:
                    encontrado.contenido ||
                    "",
                imagenUrl:
                    encontrado.imagen_url ||
                    "",
            });

        } else {
            setFormulario({
                titulo: "",
                contenido: "",
                imagenUrl: "",
            });
        }

        setArchivo(null);
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

    function manejarArchivo(
        evento
    ) {

        const seleccionado =
            evento.target.files?.[0];

        if (!seleccionado) {
            return;
        }

        setArchivo(
            seleccionado
        );
    }

    async function subirImagen() {
        if (!archivo) {
            return formulario.imagenUrl;
        }

        const datos =
            new FormData();

        datos.append(
            "imagen",
            archivo
        );

        const respuesta =
            await apiFetch(
                "/contenidos/subir-imagen",
                {
                    method: "POST",
                    body: datos
                }

            );

        return (
            respuesta.imagen?.url ||
            null
        );
    }

    async function guardar(
        evento
    ) {
        evento.preventDefault();

        try {
            setGuardando(true);
            setMensaje("");
            setError("");

            const imagenUrl =
                permiteImagen
                    ? await subirImagen()
                    : null;

            const datos = {

                titulo:
                    formulario.titulo,
                contenido:
                    formulario.contenido,
                tipoContenido:
                    tipoSeleccionado,
                imagenUrl:
                    imagenUrl || null,
                orden:
                    1
            };

            const existente =
                listado.find(
                    item =>
                        item.tipo_contenido ===
                        tipoSeleccionado
                );

            if (existente) {
                await apiFetch(
                    `/contenidos/${existente.id_contenido}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(datos)
                    }
                );

            } else {
                await apiFetch(
                    "/contenidos",
                    {
                        method: "POST",
                        body: JSON.stringify(datos)
                    }
                );
            }

            setArchivo(null);
            await cargarContenido();
            setMensaje(
                existente
                    ? "Cambios guardados correctamente."
                    : "Contenido creado correctamente."
            );

        } catch (error) {
            console.error(error);
            setError(
                error.message ||
                "No fue posible guardar el contenido."
            );

        } finally {
            setGuardando(false);
        }
    }

    function quitarImagen() {
        setFormulario(
            anterior => ({
                ...anterior,
                imagenUrl: ""
            })
        );

        setArchivo(null);
    }

    const nombreTipo =
        tiposContenido.find(
            item =>
                item.valor ===
                tipoSeleccionado
        )?.nombre;

    const permiteImagen =
        ![
            "Mision",
            "Vision",
            "Valores"
        ].includes(
            tipoSeleccionado
        );

    if (cargando) {
        return (
            <div className="panel-modulo">
                <p>
                    Cargando contenido...
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
                        Contenido institucional
                    </h1>
                    <p>
                        Edita la información que
                        aparece en las páginas
                        públicas del sitio.
                    </p>
                </div>
            </div>

            <div className="contenido-panel-grid">
                {/* ====================
                    MENÚ
                ==================== */}
                <aside className="contenido-menu">
                    {tiposContenido.map(
                        tipo => (
                            <button
                                key={
                                    tipo.valor
                                }
                                type="button"
                                
                                className={
                                    tipoSeleccionado ===
                                    tipo.valor
                                        ? "activo"
                                        : ""
                                }

                                onClick={() =>
                                    setTipoSeleccionado(
                                        tipo.valor
                                    )
                                }
                            >
                                {tipo.nombre}
                            </button>
                        )
                    )}
                </aside>

                {/* ====================
                    FORMULARIO
                ==================== */}
                <section className="contenido-editor">
                    <div className="contenido-editor-cabecera">
                        <span>
                            Editando
                        </span>
                        <h2>
                            {nombreTipo}
                        </h2>
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
                        onSubmit={
                            guardar
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
                                Contenido
                            </label>

                            <textarea
                                name="contenido"
                                value={
                                    formulario.contenido
                                }

                                onChange={
                                    manejarCambio
                                }

                                rows="16"

                                required
                            />
                        </div>

                        {permiteImagen && (
                        <div className="campo-formulario">
                            <label>
                                Imagen
                            </label>

                            {formulario.imagenUrl && (
                                <div className="contenido-imagen-actual">
                                    <img
                                        src={
                                            obtenerUrlArchivo(
                                                formulario.imagenUrl
                                            )
                                        }
                                        alt={
                                            formulario.titulo ||
                                            nombreTipo
                                        }
                                    />

                                    <button
                                        type="button"
                                        onClick={
                                            quitarImagen
                                        }
                                    >
                                        Quitar imagen
                                    </button>
                                </div>
                            )}

                            <input
                                type="file"
                                accept="
                                    image/jpeg,
                                    image/png,
                                    image/webp
                                "
                                onChange={
                                    manejarArchivo
                                }
                            />

                            {archivo && (
                                <small>
                                    Nueva imagen:
                                    {" "}
                                    {archivo.name}
                                </small>
                            )}
                        </div>
                            )}
                        <div className="contenido-acciones">
                            <button
                                type="submit"
                                className="boton-principal"
                                disabled={
                                    guardando
                                }
                            >
                                {
                                    guardando
                                        ? "Guardando..."
                                        : "Guardar cambios"
                                }
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}

export default ContenidoPanel;