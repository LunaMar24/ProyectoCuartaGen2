# Contrato de Polling para Reserva Temporal de Citas

## Objetivo
Permitir que la web muestre un contador regresivo de reserva y fuerce reinicio del flujo cuando la reserva expire.

## Endpoints involucrados

- `POST /api/v1/citas/reservar`
- `GET /api/v1/citas/reservas/:idReserva/estado`
- `POST /api/v1/citas/confirmar`

## Respuesta esperada al reservar

Al crear reserva, el API devuelve `idReserva` y `reserva` para iniciar contador inmediato:

```json
{
  "success": true,
  "message": "Reserva temporal creada correctamente",
  "idReserva": 48,
  "reserva": {
    "idReserva": 48,
    "mascotaId": 5,
    "usuarioId": 12,
    "fechaInicio": "2026-03-10T10:00:00.000Z",
    "fechaFin": "2026-03-10T10:30:00.000Z",
    "fechaExpiracion": "2026-03-10T10:09:59.000Z",
    "segundosRestantes": 600,
    "activa": true,
    "debeReiniciarFlujo": false
  }
}
```

## Respuesta esperada de estado

`GET /api/v1/citas/reservas/:idReserva/estado`

```json
{
  "success": true,
  "message": "Estado de reserva obtenido correctamente",
  "data": {
    "idReserva": 48,
    "mascotaId": 5,
    "usuarioId": 12,
    "fechaInicio": "2026-03-10T10:00:00.000Z",
    "fechaFin": "2026-03-10T10:30:00.000Z",
    "fechaExpiracion": "2026-03-10T10:09:59.000Z",
    "segundosRestantes": 321,
    "activa": true,
    "debeReiniciarFlujo": false
  }
}
```

Si no existe la reserva para el usuario autenticado:

- HTTP `404`
- `code: "RESERVATION_NOT_FOUND"`

## Contrato de frontend recomendado

1. Al reservar:
   - Guardar `idReserva`.
   - Inicializar contador con `reserva.segundosRestantes`.

2. Polling de estado:
   - Consultar `GET /citas/reservas/:idReserva/estado` cada `5` segundos.
   - Actualizar contador con `data.segundosRestantes`.

3. Reglas de expiración:
   - Si `data.debeReiniciarFlujo === true` o `data.activa === false`, detener polling y mostrar mensaje de expiración.
   - Regresar al usuario a selección de fecha/hora.

4. Confirmación:
   - Al confirmar (`POST /citas/confirmar`), detener polling inmediatamente.
   - Si confirma y recibe error `RESERVATION_EXPIRED`, mostrar mensaje y reiniciar flujo.

## Recomendaciones de UX

- Mostrar aviso de tiempo en formato `mm:ss`.
- Cuando queden <= 60 segundos, mostrar alerta visual.
- Deshabilitar botón de confirmar cuando `segundosRestantes <= 0`.
