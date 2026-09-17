const pool = require("../config/database");

async function listarNecesidades(req, res) {
    try {
        const [necesidades] = await pool.execute(
            `SELECT
                id_necesidad,
                titulo,
                descripcion,
                categoria,
                prioridad,
                estado,
                fecha_publicacion
             FROM necesidad
             WHERE estado = TRUE
             ORDER BY fecha_publicacion DESC`
        );

        res.json(necesidades);

    } catch (error) {
        console.error(
            "Error al listar necesidades:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al obtener las necesidades."
        });
    }
}

async function obtenerNecesidad(req, res) {
    try {
        const { id } = req.params;

        const [necesidades] = await pool.execute(
            `SELECT
                id_necesidad,
                titulo,
                descripcion,
                categoria,
                prioridad,
                estado,
                fecha_publicacion
             FROM necesidad
             WHERE id_necesidad = ?
             AND estado = TRUE`,
            [id]
        );

        if (necesidades.length === 0) {
            return res.status(404).json({
                mensaje: "Necesidad no encontrada."
            });
        }

        res.json(necesidades[0]);

    } catch (error) {
        console.error(
            "Error al obtener necesidad:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al obtener la necesidad."
        });
    }
}

async function crearNecesidad(req, res) {
    try {
        const {
            titulo,
            descripcion,
            categoria,
            prioridad
        } = req.body;

        if (
            !titulo ||
            !descripcion ||
            !categoria ||
            !prioridad
        ) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios."
            });
        }

        const [resultado] = await pool.execute(
            `INSERT INTO necesidad
            (
                titulo,
                descripcion,
                categoria,
                prioridad
            )
            VALUES (?, ?, ?, ?)`,
            [
                titulo,
                descripcion,
                categoria,
                prioridad
            ]
        );

        res.status(201).json({
            mensaje: "Necesidad creada correctamente.",
            idNecesidad: resultado.insertId
        });

    } catch (error) {
        console.error(
            "Error al crear necesidad:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al crear la necesidad."
        });
    }
}

async function actualizarNecesidad(req, res) {
    try {
        const { id } = req.params;

        const {
            titulo,
            descripcion,
            categoria,
            prioridad
        } = req.body;

        const [resultado] = await pool.execute(
            `UPDATE necesidad
             SET titulo = ?,
                 descripcion = ?,
                 categoria = ?,
                 prioridad = ?
             WHERE id_necesidad = ?`,
            [
                titulo,
                descripcion,
                categoria,
                prioridad,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Necesidad no encontrada."
            });
        }

        res.json({
            mensaje: "Necesidad actualizada correctamente."
        });

    } catch (error) {
        console.error(
            "Error al actualizar necesidad:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al actualizar la necesidad."
        });
    }
}

async function eliminarNecesidad(req, res) {
    try {
        const { id } = req.params;

        const [resultado] = await pool.execute(
            `UPDATE necesidad
             SET estado = FALSE
             WHERE id_necesidad = ?`,
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: "Necesidad no encontrada."
            });
        }

        res.json({
            mensaje: "Necesidad desactivada correctamente."
        });

    } catch (error) {
        console.error(
            "Error al eliminar necesidad:",
            error.message
        );

        res.status(500).json({
            mensaje: "Ocurrió un error al eliminar la necesidad."
        });
    }
}

module.exports = {
    listarNecesidades,
    obtenerNecesidad,
    crearNecesidad,
    actualizarNecesidad,
    eliminarNecesidad
};