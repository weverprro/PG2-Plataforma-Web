import {
    Navigate,
    Outlet
} from "react-router";

import {
    useAuth
} from "../../context/AuthContext";


function RutaProtegida() {

    const {
        usuario,
        cargando
    } = useAuth();


    if (cargando) {

        return (
            <main>
                <div className="mensaje-estado">
                    Comprobando sesión...
                </div>
            </main>
        );
    }


    if (!usuario) {

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }


    return <Outlet />;
}


export default RutaProtegida;