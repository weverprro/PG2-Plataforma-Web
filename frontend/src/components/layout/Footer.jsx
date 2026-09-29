function Footer() {

    const anio = new Date().getFullYear();

    return (
        <footer className="footer">

            <p>
                Mesón Buen Samaritano
            </p>

            <p>
                © {anio} Todos los derechos reservados.
            </p>

        </footer>
    );
}

export default Footer;