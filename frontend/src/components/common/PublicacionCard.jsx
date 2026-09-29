import {
    Link
} from "react-router";

import FacebookVideo
    from "./FacebookVideo";

import GaleriaPublicacion
    from "./GaleriaPublicacion";

function PublicacionCard({
    publicacion,
    mostrarCompleta = false
}) {

    const fecha = new Date(
        publicacion.fecha_publicacion
    );

    const fechaFormateada =
        fecha.toLocaleDateString(
            "es-GT",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    return (
        <article className="publicacion-card">

            <div className="publicacion-encabezado">

                <div>
                    <strong>
                        Mesón Buen Samaritano
                    </strong>

                    <span>
                        {fechaFormateada}
                    </span>
                </div>


                <span className="publicacion-tipo">
                    {publicacion.tipo_publicacion}
                </span>

            </div>


            <h2>
                {publicacion.titulo}
            </h2>


            {publicacion.destacada === 1 && (
                <div className="publicacion-destacada">
                    Publicación destacada
                </div>
            )}


            <p className="publicacion-contenido">

                {mostrarCompleta
                    ? publicacion.contenido

                    : publicacion.contenido.length > 280
                        ? `${publicacion.contenido.substring(0, 280)}...`
                        : publicacion.contenido
                }

            </p>


            <GaleriaPublicacion

                imagenes={
                    publicacion.imagenes || []
                }

                titulo={
                    publicacion.titulo
                }

                completa={
                    mostrarCompleta
                }
            />


            {publicacion.video_url && (

                <FacebookVideo

                    url={
                        publicacion.video_url
                    }

                    modo={
                        publicacion.video_modo ||
                        "Integrado"
                    }

                    formato={
                        publicacion.video_formato ||
                        "Horizontal"
                    }

                    titulo={
                        publicacion.titulo
                    }

                    portada={
                        publicacion.imagenes?.[0]
                            ?.imagen_url ||
                        null
                    }
                />

            )}


            {publicacion.id_necesidad && (

                <div className="necesidad-relacionada">

                    <strong>
                        Necesidad relacionada
                    </strong>

                    <p>
                        {publicacion.necesidad_titulo}
                    </p>

                    {publicacion.necesidad_prioridad && (
                        <span>
                            Prioridad:{" "}
                            {publicacion.necesidad_prioridad}
                        </span>
                    )}

                    <Link
                        to={
                            `/donaciones?necesidad=${publicacion.id_necesidad}`
                        }
                        className="boton-apoyar"
                    >
                        Apoyar esta necesidad
                    </Link>

                </div>

            )}


            {!mostrarCompleta && (

                <Link
                    to={
                        `/publicaciones/${publicacion.id_publicacion}`
                    }
                    className="ver-publicacion"
                >
                    Ver publicación completa
                </Link>

            )}

        </article>
    );
}

export default PublicacionCard;