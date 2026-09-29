const API_URL =
    import.meta.env.VITE_API_URL;

const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL;


function obtenerUrlArchivo(ruta) {

    if (!ruta) {
        return "";
    }

    if (
        ruta.startsWith("http://") ||
        ruta.startsWith("https://")
    ) {
        return ruta;
    }

    return `${BACKEND_URL}${ruta}`;
}


async function apiFetch(
    ruta,
    opciones = {}
) {

    const token =
        localStorage.getItem("token");

    const esFormData =
        opciones.body instanceof FormData;


    const headers = {
        ...(
            !esFormData
                ? {
                    "Content-Type":
                        "application/json"
                }
                : {}
        ),

        ...(
            token
                ? {
                    Authorization:
                        `Bearer ${token}`
                }
                : {}
        ),

        ...opciones.headers
    };


    const respuesta = await fetch(
        `${API_URL}${ruta}`,
        {
            ...opciones,
            headers
        }
    );


    let datos = null;

    try {
        datos = await respuesta.json();
    } catch {
        datos = null;
    }


    if (!respuesta.ok) {

        throw new Error(
            datos?.mensaje ||
            "Ocurrió un error al comunicarse con el servidor."
        );
    }


    return datos;
}


export {
    API_URL,
    BACKEND_URL,
    apiFetch,
    obtenerUrlArchivo
};