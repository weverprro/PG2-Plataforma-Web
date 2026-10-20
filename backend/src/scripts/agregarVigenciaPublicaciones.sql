-- Agrega los tipos de vigencia al módulo de publicaciones.

ALTER TABLE publicacion
ADD COLUMN tipo_vigencia ENUM(
    'Permanente',
    'Temporal',
    'Programada'
) NOT NULL DEFAULT 'Permanente'
AFTER destacada;

-- Clasifica las publicaciones que existían antes de este cambio.

UPDATE publicacion
SET tipo_vigencia = CASE
    WHEN fecha_expiracion IS NULL THEN 'Permanente'
    ELSE 'Programada'
END
WHERE id_publicacion > 0;