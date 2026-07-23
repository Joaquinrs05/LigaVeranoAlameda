-- Cuartos de Final — emparejamientos según posición final de liguilla (1vs8, 2vs7, 3vs6, 4vs5)
-- Verifica antes de ejecutar que estos nombres coinciden EXACTAMENTE con equipos.nombre en Supabase.

INSERT INTO cruces (fase, equipo_local_id, equipo_visitante_id, estado)
VALUES
  ('cuartos',
    (SELECT id FROM equipos WHERE nombre = 'LA ONCE-X'),
    (SELECT id FROM equipos WHERE nombre = 'LA CONTRA FC'),
    'pendiente'),
  ('cuartos',
    (SELECT id FROM equipos WHERE nombre = 'CATENACCIO B'),
    (SELECT id FROM equipos WHERE nombre = 'LOS MENISCOS DE VELAZQUEZ F.C'),
    'pendiente'),
  ('cuartos',
    (SELECT id FROM equipos WHERE nombre = 'CF LOS ITV'),
    (SELECT id FROM equipos WHERE nombre = 'REONDA FC'),
    'pendiente'),
  ('cuartos',
    (SELECT id FROM equipos WHERE nombre = 'GRANDEZA FC'),
    (SELECT id FROM equipos WHERE nombre = 'CATENACCIO FC'),
    'pendiente');

-- Comprobación rápida tras el insert:
-- SELECT c.id, el.nombre AS local, ev.nombre AS visitante, c.estado
-- FROM cruces c
-- JOIN equipos el ON el.id = c.equipo_local_id
-- JOIN equipos ev ON ev.id = c.equipo_visitante_id
-- WHERE c.fase = 'cuartos';
