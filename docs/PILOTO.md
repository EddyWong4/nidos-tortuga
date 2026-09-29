# Plan del piloto (fase 5)

**Objetivo:** confirmar en la playa, antes de repartir la app a las ~100 personas, que no se pierde ningún registro y que se captura más rápido y con menos errores que con el papel o la app anterior.

| | |
| --- | --- |
| Duración | 2 semanas de patrullajes reales |
| Participantes | 5 a 10 observadores + 1 coordinador |
| Teléfonos | Al menos 2 iPhone y 2 Android, incluido uno de gama baja |
| Versión | La publicada en https://eddywong4.github.io/nidos-tortuga/ (ver *Ajustes → Versión*) |

## Antes de empezar

- [ ] Asignar un código distinto a cada teléfono (`B01`, `B02`…) y anotarlo en una lista.
- [ ] Instalar la app en cada teléfono con la [guía rápida](GUIA_INSTALACION.md). En iPhone, confirmar que se abre desde el ícono.
- [ ] En *Ajustes → Este teléfono*, confirmar que **App instalada: Sí**.
- [ ] El coordinador configura su perfil con rol **Coordinador**.
- [ ] Hacer 1 captura de práctica por persona en tierra y borrarla.
- [ ] Mientras dure el piloto, seguir llevando el registro de siempre (papel) como respaldo.

## Qué probar

| # | Escenario | Cómo | Resultado esperado |
| --- | --- | --- | --- |
| 1 | Captura sin señal | Modo avión, registrar un nido completo | Se guarda. Aparece en la lista como "Por entregar" |
| 2 | GPS en la playa | Registrar en la arena, lejos de techos | Precisión de ±10 m o mejor en menos de 30 s |
| 3 | GPS sin señal | Dentro de un cuarto | Mensaje claro y opción de escribir coordenadas |
| 4 | Borrador | Cerrar la app a la mitad del paso 2 y volver a abrirla | Recupera lo capturado |
| 5 | Datos inválidos | Poner más huevos sembrados que la nidada | No deja guardar y explica por qué |
| 6 | Análisis | Registrar el análisis de un nido emergido | Calcula total, éxito y días de incubación |
| 7 | Entrega | Al final del turno, **Entregar datos** por WhatsApp | El coordinador recibe un `.txt` |
| 8 | Consolidación | El coordinador importa las entregas de todos | Sin duplicados. Conteo igual al del papel |
| 9 | Folio repetido | Configurar a propósito dos teléfonos con el mismo código y capturar un nido en cada uno | Aparece en *Por revisar*; "Conservar los dos" deja B0x-0001 y B0x-0001B |
| 10 | Reporte | Descargar Excel desde *Coordinación* | Se abre en Excel con una fila por nido y acentos correctos |
| 11 | Actualización | Publicar una versión nueva durante el piloto | Aparece el aviso y los datos siguen ahí |
| 12 | Pantalla al sol | Capturar a mediodía | Se leen los campos y botones sin esfuerzo |

## Qué medir

- **Registros perdidos:** nidos en papel que no llegaron al reporte. **Meta: 0.**
- **Tiempo por captura:** del toque en *Registrar nuevo nido* a *Guardar nido*. Tomarlo en 10 capturas.
- **Errores corregidos después:** cuántas veces se usó *Editar puesta*.
- **Precisión del GPS:** la que muestra el detalle de cada nido.
- **Conflictos al consolidar:** cuántos y de qué tipo.

## Preguntas al final (a cada participante)

1. ¿Hubo algún momento en que no supiste qué hacer? ¿Cuál?
2. ¿Qué campo o paso te sobra o te falta?
3. ¿Se leía bien la pantalla de día y de noche?
4. ¿Perdiste algún dato o sentiste que se podía perder?
5. Del 1 al 5, ¿qué tan fácil fue comparado con el método anterior?

## Criterios para repartir la app a todos

- [ ] 0 registros perdidos durante las 2 semanas.
- [ ] Todos los escenarios de la tabla funcionaron en iPhone y Android.
- [ ] Ningún participante calificó la facilidad con 1 o 2.
- [ ] Los problemas encontrados están corregidos y publicados.
- [ ] El coordinador sabe importar, resolver conflictos y descargar el Excel sin ayuda.

Si algo falla, se sigue con el registro en papel y se repite el escenario después de corregirlo.
