function Footer() {const anio = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-contenido">
                <div className="footer-columna footer-identidad">
                    <h2>Mesón Buen Samaritano</h2>
                    <p>Un hogar dedicado al cuidado y bienestar de nuestros adultos mayores.</p>
                </div>

                <div className="footer-columna">
                    <h3>Contáctanos</h3>
                    <a href="tel:+50258257941">+502 5825-7941</a>
                    <a href="tel:+50258284464">+502 5828-4464</a>
                    <a href="mailto:hogardeancianoscomalapa@gmail.com">
                        hogardeancianoscomalapa@gmail.com
                    </a>
                </div>

                <div className="footer-columna">                   
                    <h3>Búscanos en redes</h3>
                    <a
                        href="https://www.facebook.com/atardecerfeliz"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Facebook: Hogar de Ancianos Comalapa
                    </a>
                    <a
                        href="https://www.instagram.com/hogar_de_ancianos_comalapa/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Instagram: @hogar_de_ancianos_comalapa
                    </a>
                    <a
                        href="https://www.tiktok.com/@abuelitosvaliososs.j.c"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        TikTok: @abuelitosvaliososs.j.c
                    </a>
                </div>

                <div className="footer-columna">
                    <h3>Ubicación</h3>
                    <address>
                        5ta avenida B 2-70, zona 1, Las Victorias,
                        San Juan Comalapa, Chimaltenango, Guatemala.
                    </address>
                    <a
                        href="https://maps.app.goo.gl/XXXJ44x7hFbPKGGo8"
                        
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Buscar en Google Maps ↗
                    </a>
                </div>
            </div>

            <div className="footer-inferior">
                © {anio} Mesón Buen Samaritano. Todos los derechos reservados.
            </div>
        </footer>
    );
}

export default Footer;
