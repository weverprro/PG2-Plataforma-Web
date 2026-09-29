import {
    useState
} from "react";

import {
    Navigate,
    useNavigate
} from "react-router";

import {
    useAuth
} from "../../context/AuthContext";


function Login() {

    const navigate =
        useNavigate();

    const {
        usuario,
        iniciarSesion
    } = useAuth();


    const [
        correo,
        setCorreo
    ] = useState("");

    const [
        contrasena,
        setContrasena
    ] = useState("");

    const [
        error,
        setError
    ] = useState("");

    const [
        enviando,
        setEnviando
    ] = useState(false);


    if (usuario) {

        return (
            <Navigate
                to="/panel"
                replace
            />
        );
    }


    async function manejarSubmit(
        event
    ) {

        event.preventDefault();

        setError("");
        setEnviando(true);


        try {

            await iniciarSesion(
                correo,
                contrasena
            );

            navigate(
                "/panel",
                {
                    replace: true
                }
            );

        } catch (error) {

            setError(
                error.message
            );

        } finally {

            setEnviando(false);
        }
    }


    return (
        <div className="pagina-login">

            <div className="login-card">

                <div className="login-encabezado">

                    <span>
                        Mesón Buen Samaritano
                    </span>

                    <h1>
                        Acceso administrativo
                    </h1>

                    <p>
                        Ingresa con la cuenta
                        proporcionada por el
                        Administrador.
                    </p>

                </div>


                <form
                    onSubmit={
                        manejarSubmit
                    }
                >

                    <div className="campo-formulario">

                        <label>
                            Correo electrónico
                        </label>

                        <input
                            type="email"
                            value={correo}

                            onChange={
                                event =>
                                    setCorreo(
                                        event.target.value
                                    )
                            }

                            required
                        />

                    </div>


                    <div className="campo-formulario">

                        <label>
                            Contraseña
                        </label>

                        <input
                            type="password"

                            value={
                                contrasena
                            }

                            onChange={
                                event =>
                                    setContrasena(
                                        event.target.value
                                    )
                            }

                            required
                        />

                    </div>


                    {error && (

                        <div className="login-error">
                            {error}
                        </div>

                    )}


                    <button
                        type="submit"

                        className="boton-login"

                        disabled={
                            enviando
                        }
                    >

                        {
                            enviando
                                ? "Ingresando..."
                                : "Ingresar"
                        }

                    </button>

                </form>

            </div>

        </div>
    );
}


export default Login;