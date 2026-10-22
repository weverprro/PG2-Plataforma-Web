const pool = require("../config/database");

// Asociar como máximo una transacción confirmada a cada donación.
// Nunca mezclar USD y GTQ ni contar varias veces una misma donación.
const unionPagoConfirmado = `
    LEFT JOIN transaccion_pago tp
        ON tp.id_transaccion = (
            SELECT MAX(t2.id_transaccion)
            FROM transaccion_pago t2
            WHERE t2.id_donacion = d.id_donacion
              AND (
                  (t2.proveedor = 'PayPal' AND UPPER(t2.estado) = 'COMPLETED')
                  OR (t2.proveedor = 'Recurrente' AND LOWER(t2.estado) = 'succeeded')
              )
        )`;

const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const periodos = [
    { numero: 1, periodo: "1 al 7" },
    { numero: 2, periodo: "8 al 14" },
    { numero: 3, periodo: "15 al 21" },
    { numero: 4, periodo: "22 al final del mes" }
];

function canalesConocidos() {
    return [
        { proveedor: "PayPal", moneda: "USD" },
        { proveedor: "Recurrente", moneda: "GTQ" }
    ];
}

async function obtenerResumenDashboard(req, res) {
    try {
        const rol = req.usuario?.rol;
        const resumen = {};

        if (rol === "Administrador") {
            const [[usuarios]] = await pool.execute(
                `SELECT COUNT(*) AS total FROM usuario_administrativo WHERE estado = 1`
            );
            resumen.usuariosActivos = Number(usuarios.total);
        }

        if (rol === "Administrador" || rol === "Secretaria") {
            const [[necesidades]] = await pool.execute(
                `SELECT COUNT(*) AS total FROM necesidad WHERE estado = 1`
            );
            const [[visitas]] = await pool.execute(
                `SELECT COUNT(*) AS total
                 FROM solicitud_visita sv
                 INNER JOIN disponibilidad_visita dv
                     ON dv.id_disponibilidad = sv.id_disponibilidad
                 WHERE sv.estado = 'Pendiente'
                   AND TIMESTAMP(dv.fecha, dv.hora_fin) > NOW()`
            );
            const [[voluntariado]] = await pool.execute(
                `SELECT COUNT(*) AS total
                 FROM solicitud_voluntariado sv
                 INNER JOIN actividad_voluntariado av
                     ON av.id_actividad = sv.id_actividad
                 WHERE sv.estado = 'Pendiente'
                   AND COALESCE(
                       TIMESTAMP(av.fecha, av.hora_fin),
                       DATE_ADD(av.fecha, INTERVAL 1 DAY)
                   ) > NOW()`
            );
            const [[visitasProximas]] = await pool.execute(
                `SELECT COUNT(*) AS total
                 FROM solicitud_visita sv
                 INNER JOIN disponibilidad_visita dv
                     ON dv.id_disponibilidad = sv.id_disponibilidad
                 WHERE sv.estado IN ('Aprobada', 'Aprobado')
                   AND TIMESTAMP(dv.fecha, dv.hora_fin) > NOW()`
            );
            const [[voluntariadosProximos]] = await pool.execute(
                `SELECT COUNT(*) AS total
                 FROM solicitud_voluntariado sv
                 INNER JOIN actividad_voluntariado av
                     ON av.id_actividad = sv.id_actividad
                 WHERE sv.estado IN ('Aprobada', 'Aprobado')
                   AND COALESCE(
                       TIMESTAMP(av.fecha, av.hora_fin),
                       DATE_ADD(av.fecha, INTERVAL 1 DAY)
                   ) > NOW()`
            );
            resumen.necesidadesActivas = Number(necesidades.total);
            resumen.visitasPendientes = Number(visitas.total);
            resumen.voluntariadosPendientes = Number(voluntariado.total);
            resumen.visitasProximas = Number(visitasProximas.total);
            resumen.voluntariadosProximos = Number(voluntariadosProximos.total);
        }

        const [[especie]] = await pool.execute(
            `SELECT COUNT(*) AS total FROM donacion
             WHERE tipo_donacion = 'Especie'
               AND estado IN ('Pendiente', 'Contactada', 'Coordinada')`
        );
        resumen.donacionesEspecieEnProceso = Number(especie.total);

        const [resumenMonetario] = await pool.execute(
            `SELECT
                 COALESCE(tp.proveedor, 'Sin proveedor') AS proveedor,
                 COALESCE(d.moneda, 'Sin moneda') AS moneda,
                 COUNT(*) AS cantidad,
                 COALESCE(SUM(d.monto), 0) AS total
             FROM donacion d
             ${unionPagoConfirmado}
             WHERE d.tipo_donacion = 'Monetaria'
               AND d.estado = 'Confirmada'
             GROUP BY proveedor, moneda`
        );

        const canales = canalesConocidos().map(canal => ({
            ...canal, cantidad: 0, total: 0
        }));
        for (const fila of resumenMonetario) {
            const proveedor = fila.proveedor;
            const moneda = fila.moneda;
            let canal = canales.find(c => c.proveedor === proveedor && c.moneda === moneda);
            if (!canal) {
                canal = { proveedor, moneda, cantidad: 0, total: 0 };
                canales.push(canal);
            }
            canal.cantidad += Number(fila.cantidad);
            canal.total += Number(fila.total);
        }
        resumen.donacionesPorProveedor = canales;
        resumen.donacionesMonetariasConfirmadas = canales.reduce((s, c) => s + c.cantidad, 0);

        const [[transaccionesPayPal]] = await pool.execute(
            `SELECT COUNT(*) AS total FROM transaccion_pago
             WHERE proveedor = 'PayPal' AND UPPER(estado) = 'COMPLETED'`
        );
        const [[transaccionesRecurrente]] = await pool.execute(
            `SELECT COUNT(*) AS total FROM transaccion_pago
             WHERE proveedor = 'Recurrente' AND LOWER(estado) = 'succeeded'`
        );
        resumen.transaccionesPayPalCompletadas = Number(transaccionesPayPal.total);
        resumen.transaccionesRecurrenteCompletadas = Number(transaccionesRecurrente.total);

        const [donacionesPorSemana] = await pool.execute(
            `SELECT
                 YEAR(COALESCE(tp.fecha, d.fecha)) AS anio,
                 MONTH(COALESCE(tp.fecha, d.fecha)) AS mes,
                 CASE
                     WHEN DAY(COALESCE(tp.fecha, d.fecha)) BETWEEN 1 AND 7 THEN 1
                     WHEN DAY(COALESCE(tp.fecha, d.fecha)) BETWEEN 8 AND 14 THEN 2
                     WHEN DAY(COALESCE(tp.fecha, d.fecha)) BETWEEN 15 AND 21 THEN 3
                     ELSE 4
                 END AS semana,
                 COALESCE(tp.proveedor, 'Sin proveedor') AS proveedor,
                 COALESCE(d.moneda, 'Sin moneda') AS moneda,
                 COUNT(*) AS cantidad,
                 COALESCE(SUM(d.monto), 0) AS total
             FROM donacion d
             ${unionPagoConfirmado}
             WHERE d.tipo_donacion = 'Monetaria'
               AND d.estado = 'Confirmada'
               AND COALESCE(tp.fecha, d.fecha) >= DATE_FORMAT(
                   DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-01'
               )
             GROUP BY anio, mes, semana, proveedor, moneda
             ORDER BY anio, mes, semana, proveedor, moneda`
        );

        const hoy = new Date();
        const mesesDonaciones = [];
        for (let i = 2; i >= 0; i--) {
            const fechaMes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            const anio = fechaMes.getFullYear();
            const mes = fechaMes.getMonth() + 1;
            const registrosMes = donacionesPorSemana.filter(f =>
                Number(f.anio) === anio && Number(f.mes) === mes
            );
            const tiposMes = canalesConocidos();
            for (const fila of registrosMes) {
                if (!tiposMes.some(c => c.proveedor === fila.proveedor && c.moneda === fila.moneda)) {
                    tiposMes.push({ proveedor: fila.proveedor, moneda: fila.moneda });
                }
            }
            const canalesMes = tiposMes.map(tipo => {
                const semanas = periodos.map(periodo => {
                    const registro = registrosMes.find(f =>
                        Number(f.semana) === periodo.numero &&
                        f.proveedor === tipo.proveedor && f.moneda === tipo.moneda
                    );
                    return {
                        ...periodo,
                        cantidad: registro ? Number(registro.cantidad) : 0,
                        total: registro ? Number(registro.total) : 0
                    };
                });
                return {
                    ...tipo,
                    cantidad: semanas.reduce((s, v) => s + v.cantidad, 0),
                    total: semanas.reduce((s, v) => s + v.total, 0),
                    semanas
                };
            });
            mesesDonaciones.push({
                anio, mes, nombre: nombresMeses[mes - 1], canales: canalesMes
            });
        }
        resumen.donacionesUltimosTresMeses = mesesDonaciones;
        return res.json({ rol, resumen });
    } catch (error) {
        console.error("Error al obtener dashboard:", error);
        return res.status(500).json({
            mensaje: "Ocurrió un error al obtener el resumen del sistema."
        });
    }
}

module.exports = { obtenerResumenDashboard };
