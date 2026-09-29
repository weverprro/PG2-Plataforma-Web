import {
    useEffect,
    useState
} from "react";

import {
    apiFetch
} from "../../services/api";

import PublicacionCard
    from "../../components/common/PublicacionCard";


const filtros = [
    "Todas",
    "Necesidad",
    "Actividad",
    "Noticia",
    "Agradecimiento",
    "Campaña",
    "General"
];


function Publicaciones() {

    const [
        publicaciones,
        setPublicaciones
    ] = useState([]);

    const [
        filtro,
        setFiltro
    ] = useState("Todas");

    const [
        cargando,
        setCargando
    ] = useState(true);

    const [
        error,
        setError
    ] = useState("");


    useEffect(() => {

        cargarPublicaciones();

    }, [filtro]);


    async function cargarPublicaciones() {

        try {

            setCargando(true);
            setError("");

            let ruta =
                "/publicaciones";

            if (filtro !== "Todas") {

                ruta +=
                    `?tipo=${encodeURIComponent(filtro)}`;
            }

            const datos =
                await apiFetch(ruta);

            setPublicaciones(datos);

        } catch (error) {

            setError(error.message);

        } finally {

            setCargando(false);
        }
    }


    return (
        <main className="pagina-publicaciones">

            <section className="encabezado-pagina">

                <span className="subtitulo">
                    Nuestro día a día
                </span>

                <h1>
                    Publicaciones
                </h1>

                <p>
                    Conoce nuestras actividades,
                    necesidades, historias y formas
                    en las que puedes colaborar.
                </p>

            </section>


            <div className="filtros-publicaciones">

                {filtros.map(tipo => (

                    <button
                        key={tipo}

                        className={
                            filtro === tipo
                                ? "filtro activo"
                                : "filtro"
                        }

                        onClick={() =>
                            setFiltro(tipo)
                        }
                    >
                        {tipo}
                    </button>

                ))}

            </div>


            {cargando && (

                <div className="mensaje-estado">
                    Cargando publicaciones...
                </div>

            )}


            {error && (

                <div className="mensaje-error">
                    {error}
                </div>

            )}


            {!cargando &&
                !error &&
                publicaciones.length === 0 && (

                    <div className="mensaje-estado">

                        No hay publicaciones disponibles
                        en esta categoría.

                    </div>

                )}


            <section className="muro-publicaciones">

                {publicaciones.map(publicacion => (

                    <PublicacionCard

                        key={
                            publicacion.id_publicacion
                        }

                        publicacion={
                            publicacion
                        }

                    />

                ))}

            </section>

        </main>
    );
}

export default Publicaciones;