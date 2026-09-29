import {
    useEffect,
    useState
} from "react";

import {
    obtenerUrlArchivo
} from "../../services/api";


function GaleriaPublicacion({
    imagenes = [],
    titulo = "Publicación",
    completa = false
}) {

    const [
        indiceActivo,
        setIndiceActivo
    ] = useState(null);


    const modalAbierto =
        indiceActivo !== null;


    function abrirImagen(indice) {
        setIndiceActivo(indice);
    }


    function cerrarModal() {
        setIndiceActivo(null);
    }


    function anterior() {

        setIndiceActivo(indice => {

            if (indice === 0) {
                return imagenes.length - 1;
            }

            return indice - 1;
        });
    }


    function siguiente() {

        setIndiceActivo(indice => {

            if (
                indice ===
                imagenes.length - 1
            ) {
                return 0;
            }

            return indice + 1;
        });
    }


    useEffect(() => {

        if (!modalAbierto) {
            return;
        }


        function manejarTeclado(event) {

            if (event.key === "Escape") {
                cerrarModal();
            }

            if (event.key === "ArrowLeft") {
                anterior();
            }

            if (event.key === "ArrowRight") {
                siguiente();
            }
        }


        document.addEventListener(
            "keydown",
            manejarTeclado
        );


        const overflowAnterior =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";


        return () => {

            document.removeEventListener(
                "keydown",
                manejarTeclado
            );

            document.body.style.overflow =
                overflowAnterior;
        };

    }, [
        modalAbierto,
        imagenes.length
    ]);


    if (imagenes.length === 0) {
        return null;
    }


    const imagenesVisibles =
        completa
            ? imagenes
            : imagenes.slice(0, 4);


    const imagenActiva =
        modalAbierto
            ? imagenes[indiceActivo]
            : null;


    const urlActiva =
        imagenActiva
            ? obtenerUrlArchivo(
                imagenActiva.imagen_url
            )
            : "";


    return (
        <>

            <div
                className={
                    completa
                        ? "galeria-publicacion galeria-completa"
                        : `galeria-publicacion galeria-${Math.min(
                            imagenesVisibles.length,
                            4
                        )}`
                }
            >

                {imagenesVisibles.map(
                    (imagen, indice) => {

                        const url =
                            obtenerUrlArchivo(
                                imagen.imagen_url
                            );


                        return (

                            <button
                                type="button"

                                className={
                                    completa
                                        ? "galeria-imagen galeria-imagen-completa"
                                        : "galeria-imagen"
                                }

                                key={
                                    imagen.id_imagen ||
                                    `${imagen.imagen_url}-${indice}`
                                }

                                onClick={() =>
                                    abrirImagen(indice)
                                }
                            >

                                {completa && (

                                    <span
                                        className="fondo-imagen-difuminado"

                                        style={{
                                            backgroundImage:
                                                `url("${url}")`
                                        }}
                                    />

                                )}


                                <img
                                    src={url}

                                    alt={
                                        imagen.texto_alternativo ||
                                        titulo
                                    }
                                />


                                {!completa &&
                                    indice === 3 &&
                                    imagenes.length > 4 && (

                                        <div className="mas-imagenes">

                                            +
                                            {
                                                imagenes.length - 4
                                            }

                                        </div>

                                    )}

                            </button>

                        );
                    }
                )}

            </div>


            {modalAbierto && (

                <div
                    className="visor-imagenes"

                    onClick={
                        cerrarModal
                    }
                >

                    {/* Fondo usando la propia fotografía */}
                    <div
                        className="visor-fondo"

                        style={{
                            backgroundImage:
                                `url("${urlActiva}")`
                        }}
                    />


                    <div className="visor-capa" />


                    <div className="visor-superior">

                        <div>

                            <strong>
                                {titulo}
                            </strong>

                            <span>
                                {indiceActivo + 1}
                                {" de "}
                                {imagenes.length}
                            </span>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="visor-cerrar"

                        onClick={
                            cerrarModal
                        }
                    >
                        ×
                    </button>


                    {imagenes.length > 1 && (

                        <button
                            type="button"

                            className="
                                visor-navegacion
                                visor-anterior
                            "

                            onClick={
                                event => {

                                    event.stopPropagation();

                                    anterior();
                                }
                            }
                        >
                            ‹
                        </button>

                    )}


                    <div
                        className="visor-contenido"

                        onClick={
                            event =>
                                event.stopPropagation()
                        }
                    >

                        <img
                            src={urlActiva}

                            alt={
                                imagenActiva
                                    ?.texto_alternativo ||
                                titulo
                            }
                        />

                    </div>


                    {imagenes.length > 1 && (

                        <button
                            type="button"

                            className="
                                visor-navegacion
                                visor-siguiente
                            "

                            onClick={
                                event => {

                                    event.stopPropagation();

                                    siguiente();
                                }
                            }
                        >
                            ›
                        </button>

                    )}


                    {imagenes.length > 1 && (

                        <div
                            className="visor-miniaturas"

                            onClick={
                                event =>
                                    event.stopPropagation()
                            }
                        >

                            {imagenes.map(
                                (imagen, indice) => (

                                    <button
                                        type="button"

                                        key={
                                            imagen.id_imagen ||
                                            indice
                                        }

                                        className={
                                            indice ===
                                            indiceActivo
                                                ? "miniatura activa"
                                                : "miniatura"
                                        }

                                        onClick={() =>
                                            setIndiceActivo(
                                                indice
                                            )
                                        }
                                    >

                                        <img
                                            src={
                                                obtenerUrlArchivo(
                                                    imagen.imagen_url
                                                )
                                            }

                                            alt=""
                                        />

                                    </button>

                                )
                            )}

                        </div>

                    )}

                </div>

            )}

        </>
    );
}


export default GaleriaPublicacion;