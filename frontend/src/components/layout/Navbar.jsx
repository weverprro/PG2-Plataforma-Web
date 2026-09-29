import { NavLink, Link } from "react-router";

function Navbar() {

    return (
        <header className="navbar">

            <Link
                to="/"
                className="navbar-logo"
            >
                Mesón Buen Samaritano
            </Link>

            <nav className="navbar-links">

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

            </nav>

            <Link
                to="/donaciones"
                className="boton-donar"
            >
                Donar
            </Link>

        </header>
    );
}

export default Navbar;