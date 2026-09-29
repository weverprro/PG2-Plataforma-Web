import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    apiFetch
} from "../services/api";


const AuthContext =
    createContext(null);


export function AuthProvider({
    children
}) {

    const [
        usuario,
        setUsuario
    ] = useState(null);

    const [
        cargando,
        setCargando
    ] = useState(true);


    useEffect(() => {

        comprobarSesion();

    }, []);


    async function comprobarSesion() {

        const token =
            localStorage.getItem("token");


        if (!token) {

            setCargando(false);

            return;
        }


        try {

            const respuesta =
                await apiFetch(
                    "/auth/perfil"
                );

            const perfil =
                respuesta.usuario ||
                respuesta;

            setUsuario(perfil);

        } catch {

            localStorage.removeItem(
                "token"
            );

            setUsuario(null);

        } finally {

            setCargando(false);
        }
    }


    async function iniciarSesion(
        correo,
        contrasena
    ) {

        const respuesta =
            await apiFetch(
                "/auth/login",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            correo,
                            contrasena
                        })
                }
            );


        const token =
            respuesta.token ||
            respuesta.accessToken;


        if (!token) {

            throw new Error(
                "El servidor no devolvió un token de acceso."
            );
        }


        localStorage.setItem(
            "token",
            token
        );


        try {

            const respuestaPerfil =
                await apiFetch(
                    "/auth/perfil"
                );

            const perfil =
                respuestaPerfil.usuario ||
                respuestaPerfil;

            setUsuario(perfil);

            return perfil;

        } catch (error) {

            localStorage.removeItem(
                "token"
            );

            throw error;
        }
    }


    function cerrarSesion() {

        localStorage.removeItem(
            "token"
        );

        setUsuario(null);
    }


    return (
        <AuthContext.Provider
            value={{
                usuario,
                cargando,
                iniciarSesion,
                cerrarSesion
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth() {

    return useContext(
        AuthContext
    );
}