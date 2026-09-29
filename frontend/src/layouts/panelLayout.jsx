import {
    NavLink,
    Outlet
} from "react-router";

import {
    useAuth
} from "../context/AuthContext";


function PanelLayout() {

    const {
        usuario,
        cerrarSesion
    } = useAuth();


    const rol =
        usuario?.rol ||
        usuario?.nombre_rol ||
        "";


    return (
        <div className="panel-layout">

            <aside className="panel-sidebar">

                <div className="panel-logo">

                    <strong>
                        Mesón Buen Samaritano
                    </strong>

                    <span>
                        Administración
                    </span>

                </div>


                <nav className="panel-menu">

                    <NavLink
                        to="/panel"
                        end
                    >
                        Dashboard
                    </NavLink>


                    {(
                        rol ===
                            "Administrador" ||

                        rol ===
                            "Secretaria"
                    ) && (

                        <>
                            <NavLink
                                to="/panel/publicaciones"
                            >
                                Publicaciones
                            </NavLink>

                            <NavLink
                                to="/panel/necesidades"
                            >
                                Necesidades
                            </NavLink>

                            <NavLink
                                to="/panel/visitas"
                            >
                                Visitas
                            </NavLink>

                            <NavLink
                                to="/panel/voluntariado"
                            >
                                Voluntariado
                            </NavLink>
                        </>

                    )}


                    {rol ===
                        "Administrador" && (

                        <>
                            <NavLink
                                to="/panel/contenidos"
                            >
                                Contenido institucional
                            </NavLink>

                            <NavLink
                                to="/panel/usuarios"
                            >
                                Usuarios
                            </NavLink>
                        </>

                    )}


                    <NavLink
                        to="/panel/donaciones"
                    >
                        Donaciones
                    </NavLink>


                    {(
                        rol ===
                            "Administrador" ||

                        rol ===
                            "Secretaria" ||

                        rol ===
                            "Contador"
                    ) && (

                        <NavLink
                            to="/panel/transacciones"
                        >
                            Transacciones PayPal
                        </NavLink>

                    )}

                </nav>


                <button
                    className="cerrar-sesion"

                    onClick={
                        cerrarSesion
                    }
                >
                    Cerrar sesión
                </button>

            </aside>


            <section className="panel-contenido">

                <header className="panel-header">

                    <div>

                        <strong>
                            {
                                usuario?.nombre
                            }
                        </strong>

                        <span>
                            {rol}
                        </span>

                    </div>

                </header>


                <div className="panel-pagina">

                    <Outlet />

                </div>

            </section>

        </div>
    );
}


export default PanelLayout;