import {
    Routes,
    Route
} from "react-router";


import PublicLayout
    from "./layouts/PublicLayout";

import PanelLayout
    from "./layouts/PanelLayout";

import PublicacionesPanel
    from "./pages/panel/PublicacionesPanel";

import RutaProtegida
    from "./components/common/RutaProtegida";

import Inicio
    from "./pages/public/Inicio";

import Nosotros
    from "./pages/public/Nosotros";

import Publicaciones
    from "./pages/public/Publicaciones";

import DetallePublicacion
    from "./pages/public/DetallePublicacion";

import Donaciones
    from "./pages/public/Donaciones";

import Visitas
    from "./pages/public/Visitas";

import Voluntariado
    from "./pages/public/Voluntariado";

import Contacto
    from "./pages/public/Contacto";

import Login
    from "./pages/auth/Login";

import Dashboard
    from "./pages/panel/Dashboard";

import ModuloPanel
    from "./pages/panel/ModuloPanel";

import ContenidoPanel
    from "./pages/panel/ContenidoPanel";

import VisitasPanel
    from "./pages/panel/VisitasPanel";

import VoluntariadoPanel
    from "./pages/panel/VoluntariadoPanel";

import DonacionesPanel 
    from "./pages/panel/DonacionesPanel";
    
import TransaccionesPanel
    from "./pages/panel/TransaccionesPanel";

import NecesidadesPanel
    from "./pages/panel/NecesidadesPanel";
    
import UsuariosPanel
    from "./pages/panel/UsuariosPanel";
    
function App() {

    return (
        <Routes>

            {/* ======================
                PUBLICO
            ====================== */}

            <Route
                element={
                    <PublicLayout />
                }
            >

                <Route
                    path="/"
                    element={
                        <Inicio />
                    }
                />

                <Route
                    path="/nosotros"
                    element={
                        <Nosotros />
                    }
                />

                <Route
                    path="/publicaciones"
                    element={
                        <Publicaciones />
                    }
                />

                <Route
                    path="/publicaciones/:id"
                    element={
                        <DetallePublicacion />
                    }
                />

                <Route
                    path="/donaciones"
                    element={
                        <Donaciones />
                    }
                />

                <Route
                    path="/visitas"
                    element={
                        <Visitas />
                    }
                />

                <Route
                    path="/voluntariado"
                    element={
                        <Voluntariado />
                    }
                />

                <Route
                    path="/contacto"
                    element={
                        <Contacto />
                    }
                />

            </Route>


            {/* LOGIN */}

            <Route
                path="/login"
                element={
                    <Login />
                }
            />


            {/* ======================
                PANEL PROTEGIDO
            ====================== */}

            <Route
                element={
                    <RutaProtegida />
                }
            >

                <Route
                    path="/panel"
                    element={
                        <PanelLayout />
                    }
                >

                    <Route
                        index
                        element={
                            <Dashboard />
                        }
                    />


                    <Route
                        path="publicaciones"

                        element={
                            <PublicacionesPanel />
                        }
                    />


                    <Route
                        path="necesidades"
                        element={
                            <NecesidadesPanel />
                        }
                    />


                    <Route
                        path="visitas"
                        element={
                            <VisitasPanel />
                        }
                    />


                    <Route
                        path="voluntariado"

                        element={
                            <VoluntariadoPanel />
                        }
                    />


                    <Route
                        path="contenidos"

                        element={
                            <ContenidoPanel />
                        }
                    />


                    <Route
                        path="usuarios"

                        element={
                            <UsuariosPanel />
                        }
                    />


                    <Route
                        path="donaciones"

                        element={
                            <DonacionesPanel />
                        }
                    />


                    <Route
                        path="transacciones"
                        element={
                            <TransaccionesPanel />
                        }
                    />

                </Route>

            </Route>

        </Routes>
    );
}


export default App;