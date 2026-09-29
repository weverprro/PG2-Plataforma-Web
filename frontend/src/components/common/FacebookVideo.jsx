import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    obtenerUrlArchivo
} from "../../services/api";


function FacebookVideo({
    url,
    modo = "Integrado",
    formato = "Horizontal",
    portada = null,
    titulo = "Video de Facebook"
}) {

    const contenedorRef =
        useRef(null);

    const [
        anchoDisponible,
        setAnchoDisponible
    ] = useState(500);


    useEffect(() => {

        if (!contenedorRef.current) {
            return;
        }


        const observer =
            new ResizeObserver(
                entradas => {

                    const ancho =
                        Math.floor(
                            entradas[0]
                                ?.contentRect
                                ?.width || 0
                        );


                    if (ancho > 0) {
                        setAnchoDisponible(
                            ancho
                        );
                    }
                }
            );


        observer.observe(
            contenedorRef.current
        );


        return () => {
            observer.disconnect();
        };

    }, []);


    if (!url) {
        return null;
    }


    /*
     * ==========================
     * ABRIR EN FACEBOOK
     * ==========================
     */

    if (modo === "Enlace") {

        const portadaUrl =
            portada
                ? obtenerUrlArchivo(
                    portada
                )
                : null;


        return (
            <a
                href={url}

                target="_blank"

                rel="noopener noreferrer"

                className="facebook-enlace-card"

                style={
                    portadaUrl
                        ? {
                            backgroundImage:
                                `url("${portadaUrl}")`
                        }
                        : undefined
                }
            >

                <div
                    className="facebook-enlace-capa"
                />


                <div
                    className="facebook-enlace-contenido"
                >

                    <div className="facebook-play">
                        ▶
                    </div>

                    <strong>
                        {titulo}
                    </strong>

                    <span>
                        Ver video en Facebook
                    </span>

                </div>

            </a>
        );
    }


    /*
     * ==========================
     * CALCULAR FORMATO
     * ==========================
     */

    let anchoVideo;
    let altoVideo;


    if (formato === "Vertical") {

        anchoVideo =
            Math.min(
                anchoDisponible,
                420
            );

        altoVideo =
            Math.round(
                anchoVideo *
                16 / 9
            );

    } else if (
        formato === "Cuadrado"
    ) {

        anchoVideo =
            Math.min(
                anchoDisponible,
                560
            );

        altoVideo =
            anchoVideo;

    } else {

        /*
         * Horizontal 16:9
         */
        anchoVideo =
            Math.min(
                anchoDisponible,
                760
            );

        altoVideo =
            Math.round(
                anchoVideo *
                9 / 16
            );
    }


    const enlace =
        encodeURIComponent(url);


    const src =
        `https://www.facebook.com/plugins/video.php` +
        `?href=${enlace}` +
        `&show_text=false` +
        `&width=${anchoVideo}` +
        `&height=${altoVideo}`;


    return (
        <div
            ref={contenedorRef}

            className={
                `facebook-video facebook-video-${formato.toLowerCase()}`
            }
        >

            <iframe
                src={src}

                title={titulo}

                width={anchoVideo}

                height={altoVideo}

                scrolling="no"

                frameBorder="0"

                allowFullScreen

                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />

        </div>
    );
}


export default FacebookVideo;