import { Outlet } from "react-router";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

function PublicLayout() {

    return (
        <>
            <Navbar />

            <div className="contenido-principal">
                <Outlet />
            </div>

            <Footer />
        </>
    );
}

export default PublicLayout;