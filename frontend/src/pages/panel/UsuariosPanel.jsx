import {
    useEffect,
    useState
} from "react";

import {
    apiFetch
} from "../../services/api";


const formularioInicial = {
    nombre: "",
    correo: "",
    contrasena: "",
    idRol: ""
};


function UsuariosPanel() {

    const [
        usuarios,
        setUsuarios
    ] = useState([]);

    const [
        roles,
        setRoles
    ] = useState([]);

    const [
        formulario,
        setFormulario
    ] = useState(
        formularioInicial
    );

    const [
        usuarioContrasena,
        setUsuarioContrasena
    ] = useState(null);

    const [
        nuevaContrasena,
        setNuevaContrasena
    ] = useState("");

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
                respuestaUsuarios,
                respuestaRoles
            ] = await Promise.all([
                apiFetch(
                    "/usuarios"
                ),
                apiFetch(
                    "/roles"
                )
            ]);


            setUsuarios(
                Array.isArray(
                    respuestaUsuarios
                )
                    ? respuestaUsuarios
                    : respuestaUsuarios.usuarios ||
                      []
            );


            setRoles(
                Array.isArray(
                    respuestaRoles
                )
                    ? respuestaRoles
                    : respuestaRoles.roles ||
                      []
            );


        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "No fue posible cargar los usuarios."
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


    async function crearUsuario(
        evento
    ) {

        evento.preventDefault();


        try {

            setGuardando(true);
            setMensaje("");
            setError("");


            const respuesta =
                await apiFetch(
                    "/usuarios",
                    {
                        method: "POST",

                        body:
                            JSON.stringify({

                                nombre:
                                    formulario.nombre.trim(),

                                correo:
                                    formulario.correo.trim(),

                                contrasena:
                                    formulario.contrasena,

                                rol:
                                    roles.find(
                                        (rol) =>
                                            Number(rol.id_rol) ===
                                            Number(formulario.idRol)
                                    )?.nombre

                            })
                    }
                );


            setFormulario(
                formularioInicial
            );


            await cargarDatos();


            setMensaje(
                respuesta.mensaje ||
                "Usuario creado correctamente."
            );


        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "No fue posible crear el usuario."
            );


        } finally {

            setGuardando(false);

        }

    }


    async function cambiarEstado(
        usuario
    ) {

        try {

            setMensaje("");
            setError("");


            const nuevoEstado =
                Number(usuario.estado) === 1
                    ? false
                    : true;


            const respuesta =
                await apiFetch(
                    `/usuarios/${usuario.id_usuario}/estado`,
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
                "Estado del usuario actualizado."
            );


        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "No fue posible actualizar el usuario."
            );

        }

    }


    async function cambiarContrasena(
        evento
    ) {

        evento.preventDefault();


        if (
            !usuarioContrasena
        ) {
            return;
        }


        try {

            setMensaje("");
            setError("");


            const respuesta =
                await apiFetch(
                    `/usuarios/${usuarioContrasena.id_usuario}/contrasena`,
                    {
                        method: "PUT",

                        body:
                            JSON.stringify({
                                nuevaContrasena
                            })
                    }
                );


            setUsuarioContrasena(
                null
            );

            setNuevaContrasena("");


            setMensaje(
                respuesta.mensaje ||
                "Contraseña actualizada correctamente."
            );


        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "No fue posible actualizar la contraseña."
            );

        }

    }


    function obtenerNombreRol(
        usuario
    ) {

        return (
            usuario.rol ||
            usuario.nombre_rol ||
            roles.find(
                (rol) =>
                    Number(
                        rol.id_rol
                    ) ===
                    Number(
                        usuario.id_rol
                    )
            )?.nombre ||
            "Sin rol"
        );

    }


    return (

        <div className="usuarios-panel">

            <div className="panel-encabezado">

                <h1>
                    Usuarios administrativos
                </h1>

                <p>
                    Administración del personal
                    que puede acceder al sistema.
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


            <section className="usuario-formulario-card">

                <h2>
                    Crear usuario
                </h2>


                <form
                    onSubmit={
                        crearUsuario
                    }
                >

                    <div className="usuario-formulario-grid">

                        <div className="campo-formulario">

                            <label>
                                Nombre
                            </label>

                            <input
                                type="text"
                                name="nombre"
                                value={
                                    formulario.nombre
                                }
                                onChange={
                                    manejarCambio
                                }
                                required
                            />

                        </div>


                        <div className="campo-formulario">

                            <label>
                                Correo
                            </label>

                            <input
                                type="email"
                                name="correo"
                                value={
                                    formulario.correo
                                }
                                onChange={
                                    manejarCambio
                                }
                                required
                            />

                        </div>


                        <div className="campo-formulario">

                            <label>
                                Contraseña inicial
                            </label>

                            <input
                                type="password"
                                name="contrasena"
                                value={
                                    formulario.contrasena
                                }
                                onChange={
                                    manejarCambio
                                }
                                minLength="6"
                                required
                            />

                        </div>


                        <div className="campo-formulario">

                            <label>
                                Rol
                            </label>

                            <select
                                name="idRol"
                                value={
                                    formulario.idRol
                                }
                                onChange={
                                    manejarCambio
                                }
                                required
                            >

                                <option value="">
                                    Selecciona un rol
                                </option>


                                {roles.map(
                                    (rol) => (

                                        <option
                                            key={
                                                rol.id_rol
                                            }
                                            value={
                                                rol.id_rol
                                            }
                                        >
                                            {rol.nombre}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>

                    </div>


                    <button
                        className="btn-principal"
                        type="submit"
                        disabled={
                            guardando
                        }
                    >

                        {
                            guardando
                                ? "Creando..."
                                : "Crear usuario"
                        }

                    </button>

                </form>

            </section>
            
            {usuarioContrasena && (

                <div className="cambio-contrasena-card">

                    <h2>
                        Cambiar contraseña
                    </h2>

                    <p>
                        Usuario:{" "}
                        <strong>
                            {
                                usuarioContrasena.nombre
                            }
                        </strong>
                    </p>


                    <form
                        onSubmit={
                            cambiarContrasena
                        }
                    >

                        <div className="campo-formulario">

                            <label>
                                Nueva contraseña
                            </label>

                            <input
                                type="password"

                                value={
                                    nuevaContrasena
                                }

                                onChange={
                                    (evento) =>
                                        setNuevaContrasena(
                                            evento.target.value
                                        )
                                }

                                minLength="6"
                                required
                            />

                        </div>


                        <div className="usuario-acciones">

                            <button
                                type="submit"
                                className="btn-principal"
                            >
                                Guardar contraseña
                            </button>


                            <button
                                type="button"
                                className="btn-secundario"

                                onClick={() => {

                                    setUsuarioContrasena(
                                        null
                                    );

                                    setNuevaContrasena(
                                        ""
                                    );

                                }}
                            >
                                Cancelar
                            </button>

                        </div>

                    </form>

                </div>

            )}

            <section>

                <h2>
                    Usuarios registrados
                </h2>


                {cargando ? (

                    <p>
                        Cargando usuarios...
                    </p>

                ) : usuarios.length ===
                    0 ? (

                    <div className="panel-vacio">

                        No hay usuarios
                        registrados.

                    </div>

                ) : (

                    <div className="usuarios-listado">

                        {usuarios.map(
                            (usuario) => (

                                <article
                                    className="usuario-card"
                                    key={
                                        usuario.id_usuario
                                    }
                                >

                                    <div className="usuario-card-superior">

                                        <div>

                                            <h3>
                                                {
                                                    usuario.nombre
                                                }
                                            </h3>

                                            <span>
                                                {
                                                    usuario.correo
                                                }
                                            </span>

                                        </div>


                                        <span
                                            className={
                                                Number(
                                                    usuario.estado
                                                ) === 1
                                                    ? "usuario-estado activo"
                                                    : "usuario-estado inactivo"
                                            }
                                        >

                                            {
                                                Number(
                                                    usuario.estado
                                                ) === 1
                                                    ? "Activo"
                                                    : "Inactivo"
                                            }

                                        </span>

                                    </div>


                                    <div className="usuario-datos">

                                        <div>

                                            <strong>
                                                Rol
                                            </strong>

                                            <span>
                                                {
                                                    obtenerNombreRol(
                                                        usuario
                                                    )
                                                }
                                            </span>

                                        </div>


                                        <div>

                                            <strong>
                                                Correo verificado
                                            </strong>

                                            <span>
                                                {
                                                    Number(
                                                        usuario.correo_verificado
                                                    ) === 1
                                                        ? "Sí"
                                                        : "No"
                                                }
                                            </span>

                                        </div>

                                    </div>


                                    <div className="usuario-acciones">

                                        <button
                                            type="button"
                                            className="btn-editar"

                                            onClick={() => {

                                                setUsuarioContrasena(
                                                    usuario
                                                );

                                                setNuevaContrasena(
                                                    ""
                                                );

                                            }}
                                        >
                                            Cambiar contraseña
                                        </button>


                                        <button
                                            type="button"
                                            className="btn-desactivar"

                                            onClick={() =>
                                                cambiarEstado(
                                                    usuario
                                                )
                                            }
                                        >

                                            {
                                                Number(
                                                    usuario.estado
                                                ) === 1
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


        </div>

    );

}


export default UsuariosPanel;