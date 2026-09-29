const pool = require("../config/database");


async function obtenerResumenDashboard(req, res) {

    try {

        const rol =
            req.usuario?.rol;


        const resumen = {};


        /*
         * ==========================
         * ADMINISTRADOR
         * ==========================
         */

        if (
            rol === "Administrador"
        ) {

            const [[usuarios]] =
                await pool.execute(
                    `SELECT COUNT(*) AS total
                     FROM usuario_administrativo
                     WHERE estado = 1`
                );


            resumen.usuariosActivos =
                Number(usuarios.total);

        }


        /*
         * ==========================
         * ADMINISTRADOR / SECRETARÍA
         * ==========================
         */

        if (
            rol === "Administrador" ||
            rol === "Secretaria"
        ) {

            const [[necesidades]] =
                await pool.execute(
                    `SELECT COUNT(*) AS total
                    FROM necesidad
                    WHERE estado = 'Activa'`
                );


            const [[visitas]] =
                await pool.execute(
                    `SELECT COUNT(*) AS total
                    FROM solicitud_visita
                    WHERE estado = 'Pendiente'`
                );


            const [[voluntariado]] =
                await pool.execute(
                    `SELECT COUNT(*) AS total
                    FROM solicitud_voluntariado
                    WHERE estado = 'Pendiente'`
                );


            const [[visitasProximas]] =
                await pool.execute(
                    `SELECT COUNT(*) AS total
                    FROM solicitud_visita sv

                    INNER JOIN disponibilidad_visita dv
                        ON dv.id_disponibilidad =
                            sv.id_disponibilidad

                    WHERE sv.estado IN (
                        'Aprobada',
                        'Aprobado'
                    )

                    AND TIMESTAMP(
                        dv.fecha,
                        dv.hora_fin
                    ) >= NOW()`
                );


            const [[voluntariadosProximos]] =
                await pool.execute(
                    `SELECT COUNT(*) AS total
                    FROM solicitud_voluntariado sv

                    INNER JOIN actividad_voluntariado av
                        ON av.id_actividad =
                            sv.id_actividad

                    WHERE sv.estado IN (
                        'Aprobada',
                        'Aprobado'
                    )

                    AND TIMESTAMP(
                        av.fecha,
                        av.hora_fin
                    ) >= NOW()`
                );


            resumen.necesidadesActivas =
                Number(
                    necesidades.total
                );


            resumen.visitasPendientes =
                Number(
                    visitas.total
                );


            resumen.voluntariadosPendientes =
                Number(
                    voluntariado.total
                );


            resumen.visitasProximas =
                Number(
                    visitasProximas.total
                );


            resumen.voluntariadosProximos =
                Number(
                    voluntariadosProximos.total
                );

        }


        /*
         * ==========================
         * DONACIONES
         * Todos los roles internos
         * pueden consultarlas.
         * ==========================
         */

        const [[especie]] =
            await pool.execute(
                `SELECT COUNT(*) AS total
                 FROM donacion
                 WHERE tipo_donacion = 'Especie'
                 AND estado IN (
                    'Pendiente',
                    'Contactada',
                    'Coordinada'
                 )`
            );


        const [[monetarias]] =
            await pool.execute(
                `SELECT
                    COUNT(*) AS total,
                    COALESCE(
                        SUM(monto),
                        0
                    ) AS monto_total
                 FROM donacion
                 WHERE tipo_donacion = 'Monetaria'
                 AND estado = 'Confirmada'`
            );


        const [[transacciones]] =
            await pool.execute(
                `SELECT COUNT(*) AS total
                 FROM transaccion_pago
                 WHERE estado = 'COMPLETED'`
            );


        resumen.donacionesEspecieEnProceso =
            Number(
                especie.total
            );


        resumen.donacionesMonetariasConfirmadas =
            Number(
                monetarias.total
            );


        resumen.montoMonetarioConfirmado =
            Number(
                monetarias.monto_total
            );


        resumen.transaccionesCompletadas =
            Number(
                transacciones.total
            );

        /*
        * ==========================
        * DONACIONES ÚLTIMOS 3 MESES
        * ==========================
        */

        const [donacionesPorSemana] =
            await pool.execute(
                `SELECT
                    YEAR(fecha) AS anio,
                    MONTH(fecha) AS mes,

                    CASE
                        WHEN DAY(fecha) BETWEEN 1 AND 7
                            THEN 1

                        WHEN DAY(fecha) BETWEEN 8 AND 14
                            THEN 2

                        WHEN DAY(fecha) BETWEEN 15 AND 21
                            THEN 3

                        ELSE 4
                    END AS semana,

                    COUNT(*) AS cantidad,

                    COALESCE(
                        SUM(monto),
                        0
                    ) AS total

                FROM donacion

                WHERE tipo_donacion = 'Monetaria'

                AND estado = 'Confirmada'

                AND fecha >=
                    DATE_FORMAT(
                        DATE_SUB(
                            CURDATE(),
                            INTERVAL 2 MONTH
                        ),
                        '%Y-%m-01'
                    )

                GROUP BY
                    YEAR(fecha),
                    MONTH(fecha),
                    semana

                ORDER BY
                    anio,
                    mes,
                    semana`
            );


        const nombresMeses = [
            "Enero",
            "Febrero",
            "Marzo",
            "Abril",
            "Mayo",
            "Junio",
            "Julio",
            "Agosto",
            "Septiembre",
            "Octubre",
            "Noviembre",
            "Diciembre"
        ];


        const hoy =
            new Date();


        const mesesDonaciones = [];


        /*
        * Se generan siempre los últimos
        * tres meses, incluso si alguno
        * no tuvo donaciones.
        */
        for (
            let i = 2;
            i >= 0;
            i--
        ) {

            const fechaMes =
                new Date(
                    hoy.getFullYear(),
                    hoy.getMonth() - i,
                    1
                );


            const anio =
                fechaMes.getFullYear();

            const mes =
                fechaMes.getMonth() + 1;


            const semanas = [
                {
                    numero: 1,
                    periodo: "1 al 7"
                },
                {
                    numero: 2,
                    periodo: "8 al 14"
                },
                {
                    numero: 3,
                    periodo: "15 al 21"
                },
                {
                    numero: 4,
                    periodo: "22 al final del mes"
                }
            ].map(
                (semana) => {

                    const registro =
                        donacionesPorSemana.find(
                            (fila) =>
                                Number(fila.anio) ===
                                    anio &&
                                Number(fila.mes) ===
                                    mes &&
                                Number(fila.semana) ===
                                    semana.numero
                        );


                    return {
                        ...semana,

                        cantidad:
                            registro
                                ? Number(
                                    registro.cantidad
                                )
                                : 0,

                        total:
                            registro
                                ? Number(
                                    registro.total
                                )
                                : 0
                    };

                }
            );


            const totalMes =
                semanas.reduce(
                    (
                        acumulado,
                        semana
                    ) =>
                        acumulado +
                        semana.total,
                    0
                );


            const cantidadMes =
                semanas.reduce(
                    (
                        acumulado,
                        semana
                    ) =>
                        acumulado +
                        semana.cantidad,
                    0
                );


            mesesDonaciones.push({

                anio,

                mes,

                nombre:
                    nombresMeses[
                        mes - 1
                    ],

                cantidad:
                    cantidadMes,

                total:
                    totalMes,

                semanas

            });

        }


        resumen.donacionesUltimosTresMeses =
            mesesDonaciones;


        return res.json({
            rol,
            resumen
        });


    } catch (error) {

        console.error(
            "Error al obtener dashboard:",
            error
        );


        return res
            .status(500)
            .json({
                mensaje:
                    "Ocurrió un error al obtener el resumen del sistema."
            });

    }

}


module.exports = {
    obtenerResumenDashboard
};