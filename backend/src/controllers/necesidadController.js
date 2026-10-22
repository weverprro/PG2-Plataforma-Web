const pool = require("../config/database");

const estadosValidos = ["Activa", "Atendida", "Inactiva"];

// La columna estado de MySQL es numérica: 1 activa, 0 inactiva y 2 atendida.
// El frontend seguirá trabajando con nombres para facilitar su lectura.
const codigosEstado = { Activa: 1, Inactiva: 0, Atendida: 2 };

const columnas = `
    id_necesidad,
    titulo,
    descripcion,
    categoria,
    prioridad,
    CASE
        WHEN estado = 0 THEN 'Inactiva'
        WHEN estado = 1 THEN 'Activa'
        WHEN estado = 2 THEN 'Atendida'
        ELSE 'Inactiva'
    END AS estado,
    fecha_publicacion`;

// Vista pública: no exponer necesidades inactivas ni atendidas.
async function listarNecesidades(req, res) {
    try {
        const [necesidades] = await pool.execute(
            `SELECT ${columnas}
             FROM necesidad
             WHERE estado = 1
             ORDER BY fecha_publicacion DESC, id_necesidad DESC`
        );
        return res.json(necesidades);
    } catch (error) {
        console.error("Error al listar necesidades:", error);
        return res.status(500).json({ mensaje: "Ocurrió un error al obtener las necesidades." });
    }
}

// Vista del personal autorizado: incluye las desactivadas para poder reactivarlas.
async function listarNecesidadesAdmin(req, res) {
    try {
        const [necesidades] = await pool.execute(
            `SELECT ${columnas}
             FROM necesidad
             ORDER BY fecha_publicacion DESC, id_necesidad DESC`
        );
        return res.json(necesidades);
    } catch (error) {
        console.error("Error al listar necesidades administrativas:", error);
        return res.status(500).json({ mensaje: "Ocurrió un error al obtener las necesidades." });
    }
}

async function obtenerNecesidad(req, res) {
    try {
        const [necesidades] = await pool.execute(
            `SELECT ${columnas}
             FROM necesidad
             WHERE id_necesidad = ? AND estado = 1
             LIMIT 1`,
            [req.params.id]
        );
        if (!necesidades.length) {
            return res.status(404).json({ mensaje: "Necesidad no encontrada." });
        }
        return res.json(necesidades[0]);
    } catch (error) {
        console.error("Error al obtener necesidad:", error);
        return res.status(500).json({ mensaje: "Ocurrió un error al obtener la necesidad." });
    }
}

async function crearNecesidad(req, res) {
    try {
        const { titulo, descripcion, categoria, prioridad } = req.body;
        if (![titulo, descripcion, categoria, prioridad].every(v => typeof v === "string" && v.trim())) {
            return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
        }
        if (!["Baja", "Media", "Alta"].includes(prioridad)) {
            return res.status(400).json({ mensaje: "Prioridad no válida." });
        }
        const estado = req.body.estado || "Activa";
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ mensaje: "Estado de necesidad no válido." });
        }
        const [resultado] = await pool.execute(
            `INSERT INTO necesidad (titulo, descripcion, categoria, prioridad, estado)
             VALUES (?, ?, ?, ?, ?)`,
            [titulo.trim(), descripcion.trim(), categoria.trim(), prioridad, codigosEstado[estado]]
        );
        return res.status(201).json({
            mensaje: "Necesidad creada correctamente.",
            idNecesidad: resultado.insertId
        });
    } catch (error) {
        console.error("Error al crear necesidad:", error);
        return res.status(500).json({ mensaje: "Ocurrió un error al crear la necesidad." });
    }
}

async function actualizarNecesidad(req, res) {
    try {
        const { titulo, descripcion, categoria, prioridad, estado } = req.body;
        if (![titulo, descripcion, categoria, prioridad].every(v => typeof v === "string" && v.trim())) {
            return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
        }
        if (!["Baja", "Media", "Alta"].includes(prioridad) || !estadosValidos.includes(estado)) {
            return res.status(400).json({ mensaje: "La prioridad o el estado no son válidos." });
        }
        const [resultado] = await pool.execute(
            `UPDATE necesidad
             SET titulo = ?, descripcion = ?, categoria = ?, prioridad = ?, estado = ?
             WHERE id_necesidad = ?`,
            [titulo.trim(), descripcion.trim(), categoria.trim(), prioridad, codigosEstado[estado], req.params.id]
        );
        if (!resultado.affectedRows) {
            return res.status(404).json({ mensaje: "Necesidad no encontrada." });
        }
        return res.json({ mensaje: "Necesidad actualizada correctamente." });
    } catch (error) {
        console.error("Error al actualizar necesidad:", error);
        return res.status(500).json({ mensaje: "Ocurrió un error al actualizar la necesidad." });
    }
}

async function cambiarEstadoNecesidad(req, res) {
    try {
        const { estado } = req.body;
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ mensaje: "Estado de necesidad no válido." });
        }
        const [resultado] = await pool.execute(
            `UPDATE necesidad SET estado = ? WHERE id_necesidad = ?`,
            [codigosEstado[estado], req.params.id]
        );
        if (!resultado.affectedRows) {
            return res.status(404).json({ mensaje: "Necesidad no encontrada." });
        }
        return res.json({ mensaje: `Necesidad marcada como ${estado.toLowerCase()}.` });
    } catch (error) {
        console.error("Error al cambiar estado de necesidad:", error);
        return res.status(500).json({ mensaje: "No fue posible cambiar el estado de la necesidad." });
    }
}

// Mantener el endpoint DELETE para compatibilidad, con desactivación lógica.
async function eliminarNecesidad(req, res) {
    req.body = { ...req.body, estado: "Inactiva" };
    return cambiarEstadoNecesidad(req, res);
}

module.exports = {
    listarNecesidades,
    listarNecesidadesAdmin,
    obtenerNecesidad,
    crearNecesidad,
    actualizarNecesidad,
    cambiarEstadoNecesidad,
    eliminarNecesidad
};
