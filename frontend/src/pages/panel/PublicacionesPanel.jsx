import {
    useEffect,
    useState
} from "react";

import {
    Link
} from "react-router";

import {
    apiFetch,
    obtenerUrlArchivo
} from "../../services/api";


const tiposPublicacion = [
    "Necesidad",
    "Actividad",
    "Noticia",
    "Agradecimiento",
    "Campaña",
    "General"
];


const formularioInicial = {
    titulo: "",
    contenido: "",
    tipoPublicacion: "General",
    videoUrl: "",
    modoVideo: "Integrado",
    formatoVideo: "Horizontal",
    destacada: false,
    permanente: true,
    fechaExpiracion: "",
    idNecesidad: ""
};


function PublicacionesPanel() {

    const [
        publicaciones,
        setPublicaciones
    ] = useState([]);

    const [
        necesidades,
        setNecesidades
    ] = useState([]);

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


    const [
        formulario,
        setFormulario
    ] = useState(formularioInicial);


    /*
     * Fotografías nuevas elegidas
     * desde la computadora.
     */
    const [
        archivos,
        setArchivos
    ] = useState([]);


    /*
     * Fotografías que ya estaban
     * guardadas en una publicación.
     */
    const [
        imagenesExistentes,
        setImagenesExistentes
    ] = useState([]);


    /*
     * Si es null estamos creando.
     * Si tiene ID estamos editando.
     */
    const [
        idEdicion,
        setIdEdicion
    ] = useState(null);


    useEffect(() => {

        cargarDatos();

    }, []);


    async function cargarDatos() {

        try {

            setCargando(true);
            setError("");


            const [
                publicacionesRespuesta,
                necesidadesRespuesta
            ] = await Promise.all([

                apiFetch(
                    "/publicaciones/admin/listado"
                ),

                apiFetch(
                    "/necesidades"
                )

            ]);


            setPublicaciones(
                Array.isArray(
                    publicacionesRespuesta
                )
                    ? publicacionesRespuesta
                    : []
            );


            setNecesidades(
                Array.isArray(
                    necesidadesRespuesta
                )
                    ? necesidadesRespuesta
                    : necesidadesRespuesta.necesidades || []
            );


        } catch (error) {

            setError(
                error.message
            );

        } finally {

            setCargando(false);
        }
    }


    async function recargarPublicaciones() {

        const datos =
            await apiFetch(
                "/publicaciones/admin/listado"
            );

        setPublicaciones(datos);
    }


    function manejarCambio(event) {

        const {
            name,
            value,
            type,
            checked
        } = event.target;


        setFormulario(anterior => ({
            ...anterior,

            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));
    }


    /*
     * Permite seleccionar fotos
     * varias veces desde carpetas
     * diferentes.
     */
    function manejarArchivos(event) {

        const nuevosArchivos =
            Array.from(
                event.target.files
            );


        setArchivos(anteriores => {

            const combinados = [
                ...anteriores,
                ...nuevosArchivos
            ];


            /*
             * Evitar duplicados.
             */
            const sinDuplicados =
                combinados.filter(
                    (
                        archivo,
                        indice,
                        arreglo
                    ) => {

                        const identificador =
                            `${archivo.name}-${archivo.size}-${archivo.lastModified}`;


                        return indice ===
                            arreglo.findIndex(
                                otro =>

                                    `${otro.name}-${otro.size}-${otro.lastModified}` ===
                                    identificador
                            );
                    }
                );


            const total =
                sinDuplicados.length +
                imagenesExistentes.length;


            if (total > 8) {

                setError(
                    "Solo puedes tener un máximo de 8 imágenes por publicación."
                );

                return anteriores;
            }


            setError("");

            return sinDuplicados;
        });


        /*
         * Permite volver a elegir
         * archivos con el mismo input.
         */
        event.target.value = "";
    }


    function eliminarArchivo(
        indiceEliminar
    ) {

        setArchivos(
            anteriores =>
                anteriores.filter(
                    (_, indice) =>
                        indice !==
                        indiceEliminar
                )
        );
    }


    function eliminarImagenExistente(
        indiceEliminar
    ) {

        setImagenesExistentes(
            anteriores =>
                anteriores.filter(
                    (_, indice) =>
                        indice !==
                        indiceEliminar
                )
        );
    }


    function prepararFecha(fecha) {

        if (!fecha) {
            return null;
        }


        return `${fecha.replace(
            "T",
            " "
        )}:00`;
    }


    function fechaParaInput(fecha) {

        if (!fecha) {
            return "";
        }


        const fechaObjeto =
            new Date(fecha);


        const diferencia =
            fechaObjeto.getTimezoneOffset()
            * 60000;


        return new Date(
            fechaObjeto.getTime() -
            diferencia
        )
            .toISOString()
            .slice(0, 16);
    }


    async function subirImagenes() {

        if (archivos.length === 0) {
            return [];
        }


        const formData =
            new FormData();


        archivos.forEach(
            archivo => {

                formData.append(
                    "imagenes",
                    archivo
                );

            }
        );


        const respuesta =
            await apiFetch(
                "/publicaciones/subir-imagenes",
                {
                    method: "POST",
                    body: formData
                }
            );


        return respuesta.imagenes || [];
    }


    function limpiarFormulario() {

        setFormulario(
            formularioInicial
        );

        setArchivos([]);

        setImagenesExistentes([]);

        setIdEdicion(null);


        const input =
            document.getElementById(
                "imagenes-publicacion"
            );


        if (input) {
            input.value = "";
        }
    }


    async function guardarPublicacion(
        event
    ) {

        event.preventDefault();

        setMensaje("");
        setError("");


        if (
            !formulario.titulo.trim() ||
            !formulario.contenido.trim()
        ) {

            setError(
                "El título y el contenido son obligatorios."
            );

            return;
        }


        if (
            !formulario.permanente &&
            !formulario.fechaExpiracion
        ) {

            setError(
                "Debes indicar cuándo expirará la publicación."
            );

            return;
        }


        const totalImagenes =
            imagenesExistentes.length +
            archivos.length;


        if (totalImagenes > 8) {

            setError(
                "Solo puedes tener un máximo de 8 imágenes."
            );

            return;
        }


        try {

            setGuardando(true);


            /*
             * Subimos únicamente
             * las fotos nuevas.
             */
            const imagenesNuevas =
                await subirImagenes();


            /*
             * Convertimos las imágenes
             * existentes al formato que
             * espera el backend.
             */
            const imagenesAnteriores =
                imagenesExistentes.map(
                    imagen => ({
                        url:
                            imagen.imagen_url,

                        textoAlternativo:
                            imagen.texto_alternativo ||
                            null
                    })
                );


            const imagenesFinales = [
                ...imagenesAnteriores,
                ...imagenesNuevas
            ];


            const datosPublicacion = {

                titulo:
                    formulario.titulo.trim(),

                contenido:
                    formulario.contenido.trim(),

                tipoPublicacion:
                    formulario.tipoPublicacion,

                videoUrl:
                    formulario.videoUrl.trim()
                    || null,
                
                modoVideo:
                    formulario.modoVideo,

                formatoVideo:
                    formulario.formatoVideo,

                destacada:
                    formulario.destacada,

                fechaExpiracion:
                    formulario.permanente
                        ? null
                        : prepararFecha(
                            formulario.fechaExpiracion
                        ),

                idNecesidad:
                    formulario.idNecesidad
                        ? Number(
                            formulario.idNecesidad
                        )
                        : null,

                imagenes:
                    imagenesFinales
            };


            if (idEdicion) {

                await apiFetch(
                    `/publicaciones/${idEdicion}`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify(
                                datosPublicacion
                            )
                    }
                );


                setMensaje(
                    "Publicación actualizada correctamente."
                );

            } else {

                await apiFetch(
                    "/publicaciones",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                datosPublicacion
                            )
                    }
                );


                setMensaje(
                    "Publicación creada correctamente."
                );
            }


            limpiarFormulario();

            await recargarPublicaciones();


        } catch (error) {

            setError(
                error.message
            );

        } finally {

            setGuardando(false);
        }
    }


    function iniciarEdicion(
        publicacion
    ) {

        setMensaje("");
        setError("");


        setIdEdicion(
            publicacion.id_publicacion
        );


        const permanente =
            !publicacion.fecha_expiracion;


        setFormulario({

            titulo:
                publicacion.titulo || "",

            contenido:
                publicacion.contenido || "",

            tipoPublicacion:
                publicacion.tipo_publicacion ||
                "General",

            videoUrl:
                publicacion.video_url || "",

            modoVideo:
                publicacion.video_modo ||
                "Integrado",

            formatoVideo:
                publicacion.video_formato ||
                "Horizontal",

            destacada:
                Boolean(
                    publicacion.destacada
                ),

            permanente,

            fechaExpiracion:
                permanente
                    ? ""
                    : fechaParaInput(
                        publicacion.fecha_expiracion
                    ),

            idNecesidad:
                publicacion.id_necesidad
                    ? String(
                        publicacion.id_necesidad
                    )
                    : ""
        });


        setImagenesExistentes(
            publicacion.imagenes || []
        );


        setArchivos([]);


        /*
         * Subimos hacia el formulario.
         */
        setTimeout(() => {

            document
                .getElementById(
                    "formulario-publicacion"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

        }, 50);
    }


    function cancelarEdicion() {

        limpiarFormulario();

        setMensaje(
            "Edición cancelada."
        );

        setError("");
    }


    async function cambiarEstado(
        publicacion
    ) {

        try {

            setError("");
            setMensaje("");


            const nuevoEstado =
                !Boolean(
                    publicacion.estado
                );


            await apiFetch(
                `/publicaciones/${publicacion.id_publicacion}/estado`,
                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            estado:
                                nuevoEstado
                        })
                }
            );


            await recargarPublicaciones();


            setMensaje(
                nuevoEstado
                    ? "Publicación activada correctamente."
                    : "Publicación desactivada correctamente."
            );


        } catch (error) {

            setError(
                error.message
            );
        }
    }


    function obtenerEstado(
        publicacion
    ) {

        if (!publicacion.estado) {
            return "Desactivada";
        }


        if (
            publicacion.fecha_expiracion &&
            new Date(
                publicacion.fecha_expiracion
            ) < new Date()
        ) {

            return "Expirada";
        }


        return "Activa";
    }


    return (
        <main className="publicaciones-panel">

            <div className="panel-titulo">

                <span className="subtitulo">
                    Administración
                </span>

                <h1>
                    Publicaciones
                </h1>

                <p>
                    Crea y administra las
                    publicaciones del muro público.
                </p>

            </div>


            {mensaje && (

                <div className="alerta-exito">
                    {mensaje}
                </div>

            )}


            {error && (

                <div className="alerta-error">
                    {error}
                </div>

            )}


            <section
                id="formulario-publicacion"
                className="panel-seccion"
            >

                <div className="seccion-encabezado">

                    <h2>

                        {
                            idEdicion
                                ? "Editar publicación"
                                : "Nueva publicación"
                        }

                    </h2>


                    {idEdicion && (

                        <button
                            type="button"

                            className="boton-secundario"

                            onClick={
                                cancelarEdicion
                            }
                        >
                            Cancelar edición
                        </button>

                    )}

                </div>


                {idEdicion && (

                    <div className="modo-edicion">
                        Estás modificando una
                        publicación existente.
                    </div>

                )}


                <form
                    className="formulario-publicacion"

                    onSubmit={
                        guardarPublicacion
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

                            maxLength="180"

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

                            rows="7"

                            required
                        />

                    </div>


                    <div className="formulario-dos-columnas">

                        <div className="campo-formulario">

                            <label>
                                Tipo
                            </label>

                            <select
                                name="tipoPublicacion"

                                value={
                                    formulario.tipoPublicacion
                                }

                                onChange={
                                    manejarCambio
                                }
                            >

                                {tiposPublicacion.map(
                                    tipo => (

                                        <option
                                            key={tipo}
                                            value={tipo}
                                        >
                                            {tipo}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        <div className="campo-formulario">

                            <label>
                                Necesidad relacionada
                            </label>

                            <select
                                name="idNecesidad"

                                value={
                                    formulario.idNecesidad
                                }

                                onChange={
                                    manejarCambio
                                }
                            >

                                <option value="">
                                    Ninguna
                                </option>


                                {necesidades.map(
                                    necesidad => (

                                        <option
                                            key={
                                                necesidad.id_necesidad
                                            }

                                            value={
                                                necesidad.id_necesidad
                                            }
                                        >
                                            {
                                                necesidad.titulo
                                            }
                                        </option>

                                    )
                                )}

                            </select>

                        </div>

                    </div>


                    {/* =====================
                        IMAGENES EXISTENTES
                    ===================== */}

                    {imagenesExistentes.length > 0 && (

                        <div className="campo-formulario">

                            <label>
                                Fotografías actuales
                            </label>


                            <div className="imagenes-edicion">

                                {imagenesExistentes.map(
                                    (
                                        imagen,
                                        indice
                                    ) => (

                                        <div
                                            className="imagen-edicion"
                                            key={
                                                imagen.id_imagen ||
                                                indice
                                            }
                                        >

                                            <img
                                                src={
                                                    obtenerUrlArchivo(
                                                        imagen.imagen_url
                                                    )
                                                }

                                                alt=""
                                            />


                                            <button
                                                type="button"

                                                onClick={() =>
                                                    eliminarImagenExistente(
                                                        indice
                                                    )
                                                }
                                            >
                                                Quitar
                                            </button>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>

                    )}


                    <div className="campo-formulario">

                        <label>
                            Agregar fotografías
                        </label>

                        <input
                            id="imagenes-publicacion"

                            type="file"

                            accept="
                                image/jpeg,
                                image/png,
                                image/webp
                            "

                            multiple

                            onChange={
                                manejarArchivos
                            }
                        />


                        <small>
                            Máximo 8 fotografías
                            por publicación.
                        </small>


                        {archivos.length > 0 && (

                            <div className="archivos-seleccionados">

                                {archivos.map(
                                    (
                                        archivo,
                                        indice
                                    ) => (

                                        <div
                                            className="archivo-seleccionado"

                                            key={
                                                `${archivo.name}-${archivo.size}-${archivo.lastModified}`
                                            }
                                        >

                                            <span>
                                                {
                                                    archivo.name
                                                }
                                            </span>


                                            <button
                                                type="button"

                                                onClick={() =>
                                                    eliminarArchivo(
                                                        indice
                                                    )
                                                }
                                            >
                                                Quitar
                                            </button>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>


                    <div className="campo-formulario">

                        <label>
                            Video de Facebook
                        </label>

                        <input
                            type="url"

                            name="videoUrl"

                            value={
                                formulario.videoUrl
                            }

                            onChange={
                                manejarCambio
                            }

                            placeholder="https://www.facebook.com/..."
                        />

                    </div>

                    {formulario.videoUrl && (

                        <div className="campo-formulario">

                            <label>
                                Forma de mostrar el video
                            </label>

                            <select
                                name="modoVideo"

                                value={
                                    formulario.modoVideo
                                }

                                onChange={
                                    manejarCambio
                                }
                            >

                                <option value="Integrado">
                                    Reproducir dentro de la página
                                </option>

                                <option value="Enlace">
                                    Abrir video en Facebook
                                </option>

                            </select>

                            {formulario.videoUrl &&
                                formulario.modoVideo === "Integrado" && (

                                <div className="campo-formulario">

                                    <label>
                                        Formato del video
                                    </label>

                                    <select
                                        name="formatoVideo"

                                        value={
                                            formulario.formatoVideo
                                        }

                                        onChange={
                                            manejarCambio
                                        }
                                    >

                                        <option value="Horizontal">
                                            Horizontal
                                        </option>

                                        <option value="Vertical">
                                            Vertical
                                        </option>

                                        <option value="Cuadrado">
                                            Cuadrado
                                        </option>

                                    </select>

                                    <small>
                                        Selecciona el formato que
                                        corresponde al video original.
                                    </small>

                                </div>

                            )}

                            <small>
                                Si Facebook impide reproducir
                                este video dentro de la página,
                                selecciona "Abrir video en Facebook".
                            </small>

                        </div>

                    )}

                    

                    <div className="opciones-publicacion">

                        <label className="opcion-check">

                            <input
                                type="checkbox"

                                name="destacada"

                                checked={
                                    formulario.destacada
                                }

                                onChange={
                                    manejarCambio
                                }
                            />

                            Publicación destacada

                        </label>


                        <label className="opcion-check">

                            <input
                                type="checkbox"

                                name="permanente"

                                checked={
                                    formulario.permanente
                                }

                                onChange={
                                    manejarCambio
                                }
                            />

                            Publicación permanente

                        </label>

                    </div>


                    {!formulario.permanente && (

                        <div className="campo-formulario">

                            <label>
                                Fecha de expiración
                            </label>

                            <input
                                type="datetime-local"

                                name="fechaExpiracion"

                                value={
                                    formulario.fechaExpiracion
                                }

                                onChange={
                                    manejarCambio
                                }

                                required
                            />

                        </div>

                    )}


                    <button
                        type="submit"

                        className="boton-principal"

                        disabled={
                            guardando
                        }
                    >

                        {
                            guardando

                                ? (
                                    idEdicion
                                        ? "Guardando cambios..."
                                        : "Publicando..."
                                )

                                : (
                                    idEdicion
                                        ? "Guardar cambios"
                                        : "Publicar"
                                )
                        }

                    </button>

                </form>

            </section>


            {/* ==========================
                LISTADO
            ========================== */}

            <section className="panel-seccion">

                <div className="seccion-encabezado">

                    <h2>
                        Publicaciones existentes
                    </h2>

                    <span>
                        {
                            publicaciones.length
                        } publicaciones
                    </span>

                </div>


                {cargando ? (

                    <div className="mensaje-estado">
                        Cargando publicaciones...
                    </div>

                ) : (

                    <div className="lista-publicaciones-admin">

                        {publicaciones.map(
                            publicacion => (

                                <article
                                    className="publicacion-admin-card"

                                    key={
                                        publicacion.id_publicacion
                                    }
                                >

                                    <div className="publicacion-admin-info">

                                        <div className="publicacion-admin-meta">

                                            <span>
                                                {
                                                    publicacion.tipo_publicacion
                                                }
                                            </span>

                                            <span>
                                                {
                                                    obtenerEstado(
                                                        publicacion
                                                    )
                                                }
                                            </span>

                                        </div>


                                        <h3>
                                            {
                                                publicacion.titulo
                                            }
                                        </h3>


                                        <p>
                                            Autor:{" "}
                                            {
                                                publicacion.autor
                                            }
                                        </p>


                                        <small>

                                            {
                                                publicacion.imagenes
                                                    ?.length ||
                                                0
                                            }

                                            {" fotografía(s)"}

                                        </small>


                                        {publicacion.fecha_expiracion && (

                                            <small className="fecha-expiracion-admin">

                                                Expira:{" "}

                                                {
                                                    new Date(
                                                        publicacion.fecha_expiracion
                                                    )
                                                        .toLocaleString(
                                                            "es-GT"
                                                        )
                                                }

                                            </small>

                                        )}

                                    </div>


                                    <div className="publicacion-admin-acciones">

                                        <Link
                                            to={
                                                `/publicaciones/${publicacion.id_publicacion}`
                                            }

                                            target="_blank"

                                            className="boton-secundario"
                                        >
                                            Ver
                                        </Link>


                                        <button
                                            type="button"

                                            className="boton-secundario"

                                            onClick={() =>
                                                iniciarEdicion(
                                                    publicacion
                                                )
                                            }
                                        >
                                            Editar
                                        </button>


                                        <button
                                            type="button"

                                            className={
                                                publicacion.estado
                                                    ? "boton-secundario"
                                                    : "boton-principal"
                                            }

                                            onClick={() =>
                                                cambiarEstado(
                                                    publicacion
                                                )
                                            }
                                        >

                                            {
                                                publicacion.estado
                                                    ? "Desactivar"
                                                    : "Activar"
                                            }

                                        </button>

                                    </div>

                                </article>

                            )
                        )}

                    </div>

                )}

            </section>

        </main>
    );
}


export default PublicacionesPanel;