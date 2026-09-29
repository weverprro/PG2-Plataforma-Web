import {
    useEffect,
    useState
} from "react";

import {
    Link
} from "react-router";

import {
    apiFetch,
    obtenerUrlArchivo
} from "../../services/api";


function Inicio() {

    const [
        contenidoNosotros,
        setContenidoNosotros
    ] = useState(null);

    const [
        publicaciones,
        setPublicaciones
    ] = useState([]);

    const [
        cargando,
        setCargando
    ] = useState(true);

    const [
        comoAyudar,
        setComoAyudar
    ] = useState(null);

    useEffect(() => {

        cargarInicio();
        cargarComoAyudar();
    }, []);


    async function cargarInicio() {

        try {

            const [
                respuestaNosotros,
                respuestaPublicaciones
            ] = await Promise.all([

                apiFetch(
                    "/contenidos/tipo/QuienesSomos"
                ),

                apiFetch(
                    "/publicaciones?destacadas=true"
                )

            ]);


            if (
                Array.isArray(respuestaNosotros) &&
                respuestaNosotros.length > 0
            ) {

                setContenidoNosotros(
                    respuestaNosotros[0]
                );
            }


            if (
                Array.isArray(
                    respuestaPublicaciones
                )
            ) {

                /*
                 * Solo mostramos las
                 * primeras 3 destacadas.
                 */
                setPublicaciones(
                    respuestaPublicaciones.slice(
                        0,
                        3
                    )
                );
            }

        } catch (error) {

            console.error(
                "Error cargando inicio:",
                error.message
            );

        } finally {

            setCargando(false);
        }
    }

    async function cargarComoAyudar() {

        try {

            const respuesta =
                await apiFetch(
                    "/contenidos/tipo/ComoAyudar"
                );


            let lista = [];


            if (
                Array.isArray(respuesta)
            ) {

                lista = respuesta;

            } else if (
                Array.isArray(
                    respuesta?.contenidos
                )
            ) {

                lista =
                    respuesta.contenidos;

            } else if (
                respuesta
            ) {

                lista = [
                    respuesta
                ];

            }


            setComoAyudar(
                lista[0] || null
            );


        } catch (error) {

            console.error(
                "No fue posible cargar Cómo ayudar:",
                error
            );

        }

    }


    return (
        <>

            {/* ======================
                HERO
            ====================== */}

            <section className="inicio-hero">

                <div className="inicio-hero-capa" />


                <div className="inicio-hero-contenido">

                    <span>
                        Hogar de adultos mayores
                    </span>

                    <h1>
                        Mesón Buen Samaritano
                    </h1>

                    <p>
                        Acompañamos y cuidamos a
                        nuestros adultos mayores,
                        creando un hogar donde puedan
                        recibir atención, cariño y
                        dignidad.
                    </p>


                    <div className="inicio-acciones">

                        <Link
                            to="/donaciones"
                            className="boton-hero-principal"
                        >
                            Donar ahora
                        </Link>


                        <Link
                            to="/publicaciones"
                            className="boton-hero-secundario"
                        >
                            Ver publicaciones
                        </Link>

                    </div>

                </div>

            </section>


            {/* ======================
                ACCESOS PRINCIPALES
            ====================== */}

            <main className="inicio">
              
                <section className="inicio-accesos">

                    <Link
                        to="/donaciones"
                        className="acceso-card"
                    >

                        <div className="acceso-icono">
                            ♡
                        </div>

                        <h2>
                            Donaciones
                        </h2>

                        <p>
                            Apoya las necesidades
                            del hogar mediante una
                            donación.
                        </p>

                        <span>
                            Quiero ayudar →
                        </span>

                    </Link>


                    <Link
                        to="/visitas"
                        className="acceso-card"
                    >

                        <div className="acceso-icono">
                            ◷
                        </div>

                        <h2>
                            Visitas
                        </h2>

                        <p>
                            Consulta los horarios
                            disponibles y solicita
                            una visita.
                        </p>

                        <span>
                            Solicitar visita →
                        </span>

                    </Link>


                    <Link
                        to="/voluntariado"
                        className="acceso-card"
                    >

                        <div className="acceso-icono">
                            ☆
                        </div>

                        <h2>
                            Voluntariado
                        </h2>

                        <p>
                            Participa en actividades
                            y comparte tu tiempo con
                            nuestros residentes.
                        </p>

                        <span>
                            Ser voluntario →
                        </span>

                    </Link>

                </section>

                {comoAyudar && (

                    <section className="inicio-como-ayudar">

                        <div className="inicio-como-ayudar-contenido">

                            <div className="inicio-como-ayudar-texto">

                                <span className="subtitulo">
                                    Cómo ayudar
                                </span>

                                <h2>
                                    {
                                        comoAyudar.titulo ||
                                        "¿Cómo puedes ayudarnos?"
                                    }
                                </h2>


                                {comoAyudar.contenido && (

                                    <div>

                                        {
                                            comoAyudar.contenido
                                                .split("\n")
                                                .map(
                                                    (
                                                        parrafo,
                                                        indice
                                                    ) => (

                                                        <p
                                                            key={
                                                                indice
                                                            }
                                                        >
                                                            {
                                                                parrafo
                                                            }
                                                        </p>

                                                    )
                                                )
                                        }

                                    </div>

                                )}

                            </div>


                            {comoAyudar.imagen_url && (

                                <div className="inicio-como-ayudar-imagen">

                                    <img
                                        src={
                                            obtenerUrlArchivo(
                                                comoAyudar.imagen_url
                                            )
                                        }

                                        alt={
                                            comoAyudar.titulo ||
                                            "Cómo ayudar"
                                        }
                                    />

                                </div>

                            )}

                        </div>

                    </section>

                )}

                {/* ======================
                    QUIENES SOMOS
                ====================== */}

                <section className="inicio-nosotros">

                    <div className="inicio-nosotros-imagen">

                        {contenidoNosotros?.imagen_url ? (

                            <img
                                src={
                                    obtenerUrlArchivo(
                                        contenidoNosotros.imagen_url
                                    )
                                }

                                alt={
                                    contenidoNosotros.titulo
                                }
                            />

                        ) : (

                            <div className="imagen-placeholder">
                                Mesón Buen Samaritano
                            </div>

                        )}

                    </div>


                    <div className="inicio-nosotros-texto">

                        <span className="subtitulo">
                            Nuestra institución
                        </span>

                        <h2>
                            {
                                contenidoNosotros?.titulo ||
                                "Un hogar para nuestros adultos mayores"
                            }
                        </h2>

                        <p>
                            {
                                contenidoNosotros?.contenido ||
                                "Trabajamos para brindar atención y acompañamiento a nuestros residentes, promoviendo un ambiente digno, seguro y humano."
                            }
                        </p>

                        <Link
                            to="/nosotros"
                            className="enlace-destacado"
                        >
                            Conocer más sobre nosotros →
                        </Link>

                    </div>

                </section>


                {/* ======================
                    PUBLICACIONES
                ====================== */}

                <section className="inicio-publicaciones">

                    <div className="inicio-seccion-titulo">

                        <div>

                            <span className="subtitulo">
                                Actualidad
                            </span>

                            <h2>
                                Publicaciones destacadas
                            </h2>

                        </div>


                        <Link
                            to="/publicaciones"
                        >
                            Ver todas →
                        </Link>

                    </div>


                    {cargando ? (

                        <div className="mensaje-estado">
                            Cargando publicaciones...
                        </div>

                    ) : publicaciones.length > 0 ? (

                        <div className="inicio-publicaciones-grid">

                            {publicaciones.map(
                                publicacion => (

                                    <article
                                        className="inicio-publicacion-card"

                                        key={
                                            publicacion.id_publicacion
                                        }
                                    >

                                        {publicacion.imagenes?.[0] && (

                                            <div className="inicio-publicacion-imagen">

                                                <img
                                                    src={
                                                        obtenerUrlArchivo(
                                                            publicacion.imagenes[0]
                                                                .imagen_url
                                                        )
                                                    }

                                                    alt={
                                                        publicacion.titulo
                                                    }
                                                />

                                            </div>

                                        )}


                                        <div className="inicio-publicacion-contenido">

                                            <span>
                                                {
                                                    publicacion.tipo_publicacion
                                                }
                                            </span>


                                            <h3>
                                                {
                                                    publicacion.titulo
                                                }
                                            </h3>


                                            <p>

                                                {
                                                    publicacion.contenido.length > 140

                                                        ? `${publicacion.contenido.substring(
                                                            0,
                                                            140
                                                        )}...`

                                                        : publicacion.contenido
                                                }

                                            </p>


                                            <Link
                                                to={
                                                    `/publicaciones/${publicacion.id_publicacion}`
                                                }
                                            >
                                                Ver publicación →
                                            </Link>

                                        </div>

                                    </article>

                                )
                            )}

                        </div>

                    ) : (

                        <div className="mensaje-estado">

                            No hay publicaciones
                            destacadas actualmente.

                        </div>

                    )}

                </section>


                {/* ======================
                    LLAMADO FINAL
                ====================== */}

                <section className="inicio-llamado">

                    <div>

                        <span>
                            Tu ayuda puede hacer
                            una diferencia
                        </span>

                        <h2>
                            Ayúdanos a continuar
                            cuidando a nuestros
                            adultos mayores
                        </h2>

                    </div>


                    <Link
                        to="/donaciones"
                        className="boton-principal"
                    >
                        Hacer una donación
                    </Link>

                </section>

            </main>

        </>
    );
}


export default Inicio;