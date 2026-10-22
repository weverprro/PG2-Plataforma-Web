import {
    useEffect,
    useState
} from "react";

import {
    NavLink,
    Link,
    useLocation
} from "react-router";


function Navbar() {

    const [
        menuAbierto,
        setMenuAbierto
    ] = useState(false);

    const ubicacion = useLocation();


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


    return (
        <>
            <header className="navbar">

                <Link
                    to="/"
                    className="navbar-logo"
                    onClick={cerrarMenu}
                >
                    Mesón Buen Samaritano
                </Link>


                <button
                    type="button"
                    className="navbar-menu-toggle"
                    aria-label={
                        menuAbierto
                            ? "Cerrar menú"
                            : "Abrir menú"
                    }
                    aria-expanded={menuAbierto}
                    onClick={() =>
                        setMenuAbierto(
                            anterior => !anterior
                        )
                    }
                >
                    <span />
                    <span />
                    <span />
                </button>


                <nav
                    className={`navbar-links ${
                        menuAbierto
                            ? "navbar-links-abierto"
                            : ""
                    }`}
                >

                    <div className="navbar-menu-cabecera">
                        <strong>
                            Menú
                        </strong>

                        <button
                            type="button"
                            className="navbar-menu-cerrar"
                            aria-label="Cerrar menú"
                            onClick={cerrarMenu}
                        >
                            ×
                        </button>
                    </div>


                    <NavLink to="/">
                        Inicio
                    </NavLink>

                    <NavLink to="/nosotros">
                        Nosotros
                    </NavLink>

                    <NavLink to="/publicaciones">
                        Publicaciones
                    </NavLink>

                    <NavLink to="/visitas">
                        Visitas
                    </NavLink>

                    <NavLink to="/voluntariado">
                        Voluntariado
                    </NavLink>

                    <NavLink to="/contacto">
                        Contacto
                    </NavLink>

                    <Link
                        to="/donaciones"
                        className="navbar-donar-movil"
                    >
                        Donar
                    </Link>

                </nav>


                <Link
                    to="/donaciones"
                    className="boton-donar"
                    onClick={cerrarMenu}
                >
                    Donar
                </Link>

            </header>


            {menuAbierto && (
                <button
                    type="button"
                    className="navbar-menu-capa"
                    aria-label="Cerrar menú"
                    onClick={cerrarMenu}
                />
            )}
        </>
    );
}

export default Navbar;
