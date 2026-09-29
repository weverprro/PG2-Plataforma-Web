const pool = require("../config/database");


async function listarRoles(req, res) {

    try {

        const [roles] =
            await pool.execute(
                `SELECT
                    id_rol,
                    nombre,
                    descripcion,
                    estado
                 FROM rol
                 WHERE estado = 1
                 ORDER BY nombre`
            );


        return res.json({
            roles
        });


    } catch (error) {

        console.error(
            "Error al listar roles:",
            error
        );


        return res.status(500).json({
            mensaje:
                "Ocurrió un error al obtener los roles."
        });

    }

}


module.exports = {
    listarRoles
};