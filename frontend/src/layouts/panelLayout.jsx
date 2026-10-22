import {
    useEffect,
    useState
} from "react";

import {
    NavLink,
    Outlet,
    useLocation
} from "react-router";

import {
    useAuth
} from "../context/AuthContext";


function PanelLayout() {

    const {
        usuario,
        cerrarSesion
    } = useAuth();

    const [
        menuAbierto,
        setMenuAbierto
    ] = useState(false);

    const ubicacion = useLocation();


    const rol =
        usuario?.rol ||
        usuario?.nombre_rol ||
        "";


    useEffect(() => {
        setMenuAbierto(false);
    }, [ubicacion.pathname]);


    useEffect(() => {
        document.body.style.overflow =
            menuAbierto
                ? "hidden"
                : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [menuAbierto]);


    function cerrarMenu() {
        setMenuAbierto(false);
    }


    function manejarCerrarSesion() {
        cerrarMenu();
        cerrarSesion();
    }


    return (
        <div className="panel-layout">

            <button
                type="button"
                className={`panel-menu-toggle ${
                    menuAbierto
                        ? "panel-menu-toggle-oculto"
                        : ""
                }`}
                aria-label="Abrir menú administrativo"
                aria-expanded={menuAbierto}
                onClick={() =>
                    setMenuAbierto(true)
                }
            >
                <span />
                <span />
                <span />
            </button>


            <aside
                className={`panel-sidebar ${
                    menuAbierto
                        ? "panel-sidebar-abierto"
                        : ""
                }`}
            >

                <div className="panel-sidebar-superior">

                    <div className="panel-logo">

                        <strong>
                            Mesón Buen Samaritano
                        </strong>

                        <span>
                            Administración
                        </span>

                    </div>


                    <button
                        type="button"
                        className="panel-sidebar-cerrar"
                        aria-label="Cerrar menú administrativo"
                        onClick={cerrarMenu}
                    >
                        ×
                    </button>

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
                        <>
                        <NavLink
                            to="/panel/transacciones"
                        >
                            Transacciones PayPal
                        </NavLink>
                        <NavLink
                            to="/panel/transacciones-recurrente"
                        >
                            Transacciones Recurrente
                        </NavLink>
                        </>
                    )}

                </nav>


                <div className="panel-sidebar-pie">
                    <button
                        className="cerrar-sesion"
                        onClick={
                            manejarCerrarSesion
                        }
                    >
                        Cerrar sesión
                    </button>
                </div>

            </aside>


            {menuAbierto && (
                <button
                    type="button"
                    className="panel-menu-capa"
                    aria-label="Cerrar menú administrativo"
                    onClick={cerrarMenu}
                />
            )}


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
