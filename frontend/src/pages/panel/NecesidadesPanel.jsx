import {
    useEffect,
    useState
} from "react";

import {
    apiFetch
} from "../../services/api";


const formularioInicial = {
    titulo: "",
    descripcion: "",
    categoria: "",
    prioridad: "Media",
    estado: "Activa"
};


function NecesidadesPanel() {

    const [
        necesidades,
        setNecesidades
    ] = useState([]);

    const [
        formulario,
        setFormulario
    ] = useState(
        formularioInicial
    );

    const [
        editandoId,
        setEditandoId
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

        cargarNecesidades();

    }, []);


    async function cargarNecesidades() {

        try {

            setCargando(true);
            setError("");


            const respuesta =
                await apiFetch(
                    "/necesidades"
                );


            const lista =
                Array.isArray(respuesta)
                    ? respuesta
                    : respuesta.necesidades ||
                      [];


            setNecesidades(
                lista
            );


        } catch (error) {

            console.error(
                error
            );


            setError(
                error.message ||
                "No fue posible cargar las necesidades."
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
            (anterior) => ({
                ...anterior,
                [name]: value
            })
        );

    }


    function limpiarFormulario() {

        setFormulario(
            formularioInicial
        );

        setEditandoId(
            null
        );

    }


    function editarNecesidad(
        necesidad
    ) {

        setEditandoId(
            necesidad.id_necesidad
        );


        setFormulario({

            titulo:
                necesidad.titulo ||
                "",

            descripcion:
                necesidad.descripcion ||
                "",

            categoria:
                necesidad.categoria ||
                "",

            prioridad:
                necesidad.prioridad ||
                "Media",

            estado:
                necesidad.estado ||
                "Activa"

        });


        setMensaje("");
        setError("");


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    async function guardarNecesidad(
        evento
    ) {

        evento.preventDefault();


        try {

            setGuardando(true);
            setMensaje("");
            setError("");


            if (
                !formulario.titulo.trim()
            ) {

                setError(
                    "El título es obligatorio."
                );

                return;

            }


            if (
                !formulario.descripcion.trim()
            ) {

                setError(
                    "La descripción es obligatoria."
                );

                return;

            }


            const datos = {

                titulo:
                    formulario.titulo.trim(),

                descripcion:
                    formulario.descripcion.trim(),

                categoria:
                    formulario.categoria.trim(),

                prioridad:
                    formulario.prioridad,

                estado:
                    formulario.estado

            };


            let respuesta;


            if (
                editandoId
            ) {

                respuesta =
                    await apiFetch(
                        `/necesidades/${editandoId}`,
                        {
                            method: "PUT",

                            body:
                                JSON.stringify(
                                    datos
                                )
                        }
                    );

            } else {

                respuesta =
                    await apiFetch(
                        "/necesidades",
                        {
                            method: "POST",

                            body:
                                JSON.stringify(
                                    datos
                                )
                        }
                    );

            }


            await cargarNecesidades();

            limpiarFormulario();


            setMensaje(
                respuesta.mensaje ||
                (
                    editandoId
                        ? "Necesidad actualizada correctamente."
                        : "Necesidad creada correctamente."
                )
            );


        } catch (error) {

            console.error(
                error
            );


            setError(
                error.message ||
                "No fue posible guardar la necesidad."
            );


        } finally {

            setGuardando(false);

        }

    }


    async function desactivarNecesidad(
        idNecesidad
    ) {

        const confirmar =
            window.confirm(
                "¿Deseas desactivar esta necesidad?"
            );


        if (!confirmar) {

            return;

        }


        try {

            setMensaje("");
            setError("");


            const respuesta =
                await apiFetch(
                    `/necesidades/${idNecesidad}`,
                    {
                        method: "DELETE"
                    }
                );


            await cargarNecesidades();


            setMensaje(
                respuesta.mensaje ||
                "Necesidad desactivada correctamente."
            );


        } catch (error) {

            console.error(
                error
            );


            setError(
                error.message ||
                "No fue posible desactivar la necesidad."
            );

        }

    }


    function formatearFecha(fecha) {

        if (!fecha) {
            return "Sin fecha";
        }

        const fechaConvertida =
            new Date(fecha);

        if (
            Number.isNaN(
                fechaConvertida.getTime()
            )
        ) {
            return "Fecha no disponible";
        }

        return fechaConvertida
            .toLocaleDateString(
                "es-GT",
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );
    }


    return (

        <div className="necesidades-panel">

            <div className="panel-encabezado">

                <h1>
                    Necesidades
                </h1>

                <p>
                    Administración de las
                    necesidades actuales del
                    hogar.
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


            <section className="necesidad-formulario-card">

                <h2>

                    {
                        editandoId
                            ? "Editar necesidad"
                            : "Nueva necesidad"
                    }

                </h2>


                <form
                    onSubmit={
                        guardarNecesidad
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

                            placeholder="Ejemplo: Pañales para adulto"

                            required
                        />

                    </div>


                    <div className="campo-formulario">

                        <label>
                            Descripción
                        </label>

                        <textarea
                            name="descripcion"

                            value={
                                formulario.descripcion
                            }

                            onChange={
                                manejarCambio
                            }

                            rows="12"

                            placeholder="Describe la necesidad..."

                            required
                        />

                    </div>


                    <div className="necesidad-formulario-grid">

                        <div className="campo-formulario">

                            <label>
                                Categoría
                            </label>

                            <input
                                type="text"

                                name="categoria"

                                value={
                                    formulario.categoria
                                }

                                onChange={
                                    manejarCambio
                                }

                                placeholder="Ejemplo: Higiene"
                            />

                        </div>


                        <div className="campo-formulario">

                            <label>
                                Prioridad
                            </label>

                            <select
                                name="prioridad"

                                value={
                                    formulario.prioridad
                                }

                                onChange={
                                    manejarCambio
                                }
                            >

                                <option value="Baja">
                                    Baja
                                </option>

                                <option value="Media">
                                    Media
                                </option>

                                <option value="Alta">
                                    Alta
                                </option>

                            </select>

                        </div>


                        <div className="campo-formulario">

                            <label>
                                Estado
                            </label>

                            <select
                                name="estado"

                                value={
                                    formulario.estado
                                }

                                onChange={
                                    manejarCambio
                                }
                            >

                                <option value="Activa">
                                    Activa
                                </option>

                                <option value="Atendida">
                                    Atendida
                                </option>

                                <option value="Inactiva">
                                    Inactiva
                                </option>

                            </select>

                        </div>

                    </div>


                    <div className="necesidad-formulario-acciones">

                        <button
                            type="submit"

                            disabled={
                                guardando
                            }

                            className="btn-principal"
                        >

                            {
                                guardando
                                    ? "Guardando..."
                                    : editandoId
                                        ? "Guardar cambios"
                                        : "Crear necesidad"
                            }

                        </button>


                        {editandoId && (

                            <button
                                type="button"

                                className="btn-secundario"

                                onClick={
                                    limpiarFormulario
                                }
                            >

                                Cancelar edición

                            </button>

                        )}

                    </div>

                </form>

            </section>


            <section className="necesidades-listado-seccion">

                <h2>
                    Necesidades registradas
                </h2>


                {cargando ? (

                    <p>
                        Cargando necesidades...
                    </p>

                ) : necesidades.length ===
                    0 ? (

                    <div className="panel-vacio">

                        No hay necesidades
                        registradas.

                    </div>

                ) : (

                    <div className="necesidades-listado">

                        {necesidades.map(
                            (
                                necesidad
                            ) => (

                                <article
                                    className="necesidad-panel-card"

                                    key={
                                        necesidad.id_necesidad
                                    }
                                >

                                    <div className="necesidad-panel-superior">

                                        <div>

                                            <span
                                                className={
                                                    `prioridad-necesidad prioridad-${String(
                                                        necesidad.prioridad || "media"
                                                    ).toLowerCase()}`
                                                }
                                            >

                                                Prioridad{" "}
                                                {
                                                    necesidad.prioridad
                                                }

                                            </span>


                                            <h3>

                                                {
                                                    necesidad.titulo
                                                }

                                            </h3>

                                        </div>


                                        <span
                                            className={
                                                `estado-necesidad estado-necesidad-${String(
                                                    necesidad.estado || "activa"
                                                ).toLowerCase()}`
                                            }
                                        >

                                            {
                                                necesidad.estado
                                            }

                                        </span>

                                    </div>


                                    <p className="necesidad-panel-descripcion">

                                        {
                                            necesidad.descripcion
                                        }

                                    </p>


                                    <div className="necesidad-panel-datos">

                                        <div>

                                            <strong>
                                                Categoría
                                            </strong>

                                            <span>
                                                {
                                                    necesidad.categoria ||
                                                    "Sin categoría"
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
                                                        necesidad.fecha_publicacion
                                                    )
                                                }
                                            </span>

                                        </div>

                                    </div>


                                    <div className="necesidad-panel-acciones">

                                        <button
                                            type="button"

                                            className="btn-editar"

                                            onClick={() =>
                                                editarNecesidad(
                                                    necesidad
                                                )
                                            }
                                        >

                                            Editar

                                        </button>


                                        {necesidad.estado !==
                                            "Inactiva" && (

                                            <button
                                                type="button"

                                                className="btn-desactivar"

                                                onClick={() =>
                                                    desactivarNecesidad(
                                                        necesidad.id_necesidad
                                                    )
                                                }
                                            >

                                                Desactivar

                                            </button>

                                        )}

                                    </div>

                                </article>

                            )
                        )}

                    </div>

                )}

            </section>

        </div>

    );

}


export default NecesidadesPanel;