/**
 * src/types/service-result.ts — Código de error tipificado para el resultado
 * de las funciones de servicio.
 *
 * Las rutas API deben decidir el status HTTP leyendo `code`, nunca parseando
 * el texto de `error` (ese mensaje es para mostrarle a la usuaria, no para
 * tomar decisiones de la app — cambiar la redacción no debe romper el mapeo
 * a status codes).
 */
export type ServiceErrorCode =
  | "NOT_CAPITANA"
  | "SUBSCRIPTION_SUSPENDED"
  | "SELF_ACTION_FORBIDDEN"
  | "CONFLICT"
