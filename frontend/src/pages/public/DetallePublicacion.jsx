import {
    useEffect,
    useState
} from "react";

import {
    Link,
    useParams
} from "react-router";

import {
    apiFetch
} from "../../services/api";

import PublicacionCard
    from "../../components/common/PublicacionCard";


function DetallePublicacion() {

    const { id } = useParams();

    const [
        publicacion,
        setPublicacion
    ] = useState(null);

    const [
        cargando,
        setCargando
    ] = useState(true);

    const [
        error,
        setError
    ] = useState("");


    useEffect(() => {

        cargarPublicacion();

    }, [id]);


    async function cargarPublicacion() {

        try {

            setCargando(true);

            const datos =
                await apiFetch(
                    `/publicaciones/${id}`
                );

            setPublicacion(datos);

        } catch (error) {

            setError(error.message);

        } finally {

            setCargando(false);
        }
    }


    if (cargando) {

        return (
            <main>
                <div className="mensaje-estado">
                    Cargando publicación...
                </div>
            </main>
        );
    }


    if (error) {

        return (
            <main>

                <div className="mensaje-error">
                    {error}
                </div>

                <Link
                    to="/publicaciones"
                    className="volver"
                >
                    Volver a publicaciones
                </Link>

            </main>
        );
    }


    return (
        <main className="detalle-publicacion">

            <Link
                to="/publicaciones"
                className="volver"
            >
                ← Volver a publicaciones
            </Link>


            {publicacion && (

                <PublicacionCard
                    publicacion={publicacion}
                    mostrarCompleta={true}
                />

            )}

        </main>
    );
}

export default DetallePublicacion;