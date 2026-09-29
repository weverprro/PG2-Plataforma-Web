import {
    useEffect,
    useState
} from "react";

import {
    apiFetch,
    obtenerUrlArchivo
} from "../../services/api";


function Nosotros() {

    const [
        secciones,
        setSecciones
    ] = useState({
        quienesSomos: null,
        historia: null,
        mision: null,
        vision: null,
        valores: null
    });

    const [
        cargando,
        setCargando
    ] = useState(true);

    const [
        error,
        setError
    ] = useState("");


    useEffect(() => {

        cargarContenido();

    }, []);


    async function cargarContenido() {

        try {

            setCargando(true);
            setError("");


            const [
                quienesSomos,
                historia,
                mision,
                vision,
                valores
            ] = await Promise.all([

                apiFetch(
                    "/contenidos/tipo/QuienesSomos"
                ),

                apiFetch(
                    "/contenidos/tipo/Historia"
                ),

                apiFetch(
                    "/contenidos/tipo/Mision"
                ),

                apiFetch(
                    "/contenidos/tipo/Vision"
                ),

                apiFetch(
                    "/contenidos/tipo/Valores"
                )

            ]);


            setSecciones({

                quienesSomos:
                    Array.isArray(quienesSomos)
                        ? quienesSomos[0] || null
                        : quienesSomos,

                historia:
                    Array.isArray(historia)
                        ? historia[0] || null
                        : historia,

                mision:
                    Array.isArray(mision)
                        ? mision[0] || null
                        : mision,

                vision:
                    Array.isArray(vision)
                        ? vision[0] || null
                        : vision,

                valores:
                    Array.isArray(valores)
                        ? valores[0] || null
                        : valores

            });

        } catch (error) {

            console.error(
                "Error cargando página Nosotros:",
                error
            );

            setError(
                "No fue posible cargar la información institucional."
            );

        } finally {

            setCargando(false);
        }
    }


    if (cargando) {

        return (
            <main className="pagina-nosotros">

                <div className="mensaje-estado">
                    Cargando información...
                </div>

            </main>
        );
    }


    if (error) {

        return (
            <main className="pagina-nosotros">

                <div className="mensaje-estado">
                    {error}
                </div>

            </main>
        );
    }


    const {
        quienesSomos,
        historia,
        mision,
        vision,
        valores
    } = secciones;


    return (
        <main className="pagina-nosotros">

            {/* ======================
                ENCABEZADO
            ====================== */}

            <section className="nosotros-encabezado">

                <span>
                    Nuestra institución
                </span>

                <h1>
                    Conoce nuestro hogar
                </h1>

                <p>
                    Un espacio dedicado al
                    cuidado, acompañamiento y
                    bienestar de nuestros
                    adultos mayores.
                </p>

            </section>


            {/* ======================
                QUIÉNES SOMOS
            ====================== */}

            <section className="nosotros-seccion nosotros-principal">

                <div className="nosotros-texto">

                    <span className="subtitulo">
                        Quiénes somos
                    </span>

                    <h2>
                        {
                            quienesSomos?.titulo ||
                            "Mesón Buen Samaritano"
                        }
                    </h2>

                    <p>
                        {
                            quienesSomos?.contenido ||
                            "Somos una institución dedicada al cuidado y acompañamiento de adultos mayores."
                        }
                    </p>

                </div>


                <div className="nosotros-imagen">

                    {quienesSomos?.imagen_url ? (

                        <img
                            src={
                                obtenerUrlArchivo(
                                    quienesSomos.imagen_url
                                )
                            }

                            alt={
                                quienesSomos.titulo ||
                                "Quiénes somos"
                            }
                        />

                    ) : (

                        <div className="nosotros-placeholder">
                            Mesón Buen Samaritano
                        </div>

                    )}

                </div>

            </section>


            {/* ======================
                HISTORIA
            ====================== */}

            <section className="nosotros-seccion nosotros-historia">

                <div className="nosotros-imagen">

                    {historia?.imagen_url ? (

                        <img
                            src={
                                obtenerUrlArchivo(
                                    historia.imagen_url
                                )
                            }

                            alt={
                                historia.titulo ||
                                "Historia"
                            }
                        />

                    ) : (

                        <div className="nosotros-placeholder">
                            Nuestra historia
                        </div>

                    )}

                </div>


                <div className="nosotros-texto">

                    <span className="subtitulo">
                        Nuestra historia
                    </span>

                    <h2>
                        {
                            historia?.titulo ||
                            "Una historia de servicio"
                        }
                    </h2>

                    <p>
                        {
                            historia?.contenido ||
                            "Nuestra historia refleja el compromiso de brindar un hogar digno y humano a quienes más lo necesitan."
                        }
                    </p>

                </div>

            </section>


            {/* ======================
                MISIÓN Y VISIÓN
            ====================== */}

            <section className="nosotros-mision-vision">

                <article className="nosotros-card">

                    <span>
                        Misión
                    </span>

                    <h2>
                        {
                            mision?.titulo ||
                            "Nuestra misión"
                        }
                    </h2>

                    <p>
                        {
                            mision?.contenido ||
                            "Brindar atención, cuidado y acompañamiento integral a nuestros adultos mayores."
                        }
                    </p>

                </article>


                <article className="nosotros-card">

                    <span>
                        Visión
                    </span>

                    <h2>
                        {
                            vision?.titulo ||
                            "Nuestra visión"
                        }
                    </h2>

                    <p>
                        {
                            vision?.contenido ||
                            "Ser una institución reconocida por ofrecer una atención humana, responsable y digna."
                        }
                    </p>

                </article>

            </section>


            {/* ======================
                VALORES
            ====================== */}

            <section className="nosotros-valores">

                <div className="nosotros-valores-cabecera">

                    <span className="subtitulo">
                        Lo que nos guía
                    </span>

                    <h2>
                        {
                            valores?.titulo ||
                            "Nuestros valores"
                        }
                    </h2>

                </div>


                <div className="nosotros-valores-contenido">

                    <p>
                        {
                            valores?.contenido ||
                            "Respeto, solidaridad, responsabilidad, empatía y compromiso."
                        }
                    </p>

                </div>

            </section>

        </main>
    );
}


export default Nosotros;