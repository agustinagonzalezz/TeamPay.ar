# Adición a REQUERIMIENTOS.md — Módulo de Super Administración (SaaS)

**Contexto:** TeamPay.ar pasa de ser una app de uso interno a un producto que se vende a distintos equipos. Se necesita un rol de super administración (uso exclusivo de la dueña del producto) para gestionar clientes (equipos), contacto y facturación — **sin acceso a los datos internos de cada equipo**.

---

## 2bis. Actor nuevo

| Actor | Descripción | Alcance |
|-------|-------------|---------|
| **Super admin** | Dueña del producto (vos). Administra la relación comercial con cada equipo-cliente: estado de suscripción, contacto, facturación. No es un rol dentro de ningún equipo, es independiente de `TeamMember`. | Fase 2 |

**Decisión de diseño confirmada:** la suscripción se factura **por equipo**, no por cuenta de usuaria, ya que el equipo es la unidad comercial que se vende.

---

## 3.10 Módulo de super administración

| ID | Requerimiento | Prioridad | Fase |
|----|---------------|-----------|------|
| RF-51 | Solo usuarias con el flag `isSuperAdmin = true` pueden acceder al panel de administración (`/admin`). El flag se asigna manualmente en base de datos, nunca desde la UI. | 🔴 Alta | 2 |
| RF-52 | El panel debe listar todos los equipos registrados en el sistema, con nombre del equipo, capitana/contacto, plan, estado de suscripción y fecha de alta. | 🔴 Alta | 2 |
| RF-53 | El super admin debe poder ver y editar los datos de contacto de cada equipo (nombre de la persona a cargo, email, teléfono). | 🔴 Alta | 2 |
| RF-54 | El super admin debe poder ver y editar los datos de facturación de cada equipo (razón social, CUIT/CUIL, email de facturación, plan contratado, monto). | 🔴 Alta | 2 |
| RF-55 | El super admin debe poder cambiar manualmente el estado de una suscripción (override): activar, marcar como pagada, extender trial, suspender, cancelar, reactivar. Esto convive con el cambio automático de RF-64/RF-65 y sirve para casos excepcionales (cortesías, reclamos, errores de Mercado Pago). | 🔴 Alta | 2 |
| RF-56 | Cuando una suscripción está `SUSPENDED`, el sistema debe pasar el equipo a **modo solo-lectura**: la capitana puede seguir viendo todos sus datos (jugadoras, eventos, pagos, gastos, dashboard) pero no puede crear, editar ni eliminar nada. | 🔴 Alta | 2 |
| RF-56b | En modo solo-lectura, el sistema debe mostrar un cartel/banner visible en toda la app indicando que la cuenta está suspendida, el motivo, y que se debe regularizar el pago para recuperar el acceso completo. | 🔴 Alta | 2 |
| RF-56c | Al reactivarse la suscripción (pago regularizado), el equipo debe recuperar automáticamente el acceso completo sin intervención manual adicional del super admin. | 🔴 Alta | 2 |
| RF-57 | El sistema NO debe permitir que el super admin vea ni consulte datos internos del equipo: jugadoras, pagos, gastos, eventos, balances. Esta restricción se implementa a nivel de código de acceso a datos, no solo ocultando componentes de UI. | 🔴 Alta | 2 |
| RF-58 | Toda acción del super admin (cambio de estado, edición de datos de facturación, etc.) debe quedar registrada en un log de auditoría: quién, qué acción, sobre qué equipo, cuándo. | 🔴 Alta | 2 |
| RF-59 | El panel debe mostrar métricas agregadas: cantidad total de equipos, desglose por estado (trial/activo/vencido/suspendido), ingreso recurrente estimado (MRR). | 🟡 Media | 2 |
| RF-60 | El super admin debe poder buscar y filtrar equipos por estado, plan o nombre. | 🟡 Media | 2 |
| RF-61 | El super admin debe poder agregar notas internas por equipo (ej. "pidió descuento", "reclamó por WhatsApp"). | 🟢 Baja | 3 |
| RF-62 | El sistema debe notificar al super admin cuando un trial está por vencer o un pago está atrasado. | 🟢 Baja | 3 |
| RF-63 | El super admin debe poder exportar el listado de cuentas (con datos de contacto y facturación) a CSV/Excel para uso contable. | 🟢 Baja | 3 |
| RF-64 | El sistema debe recibir y procesar webhooks de Mercado Pago para actualizar automáticamente el estado de la suscripción (pago aprobado → `ACTIVE`, pago rechazado/vencido → `PAST_DUE`). Depende de la integración de RF-49/RF-50. | 🔴 Alta | 4 |
| RF-65 | Si una suscripción queda en `PAST_DUE` y no se regulariza dentro de un período de gracia configurable (ej. 5-7 días), el sistema debe pasarla automáticamente a `SUSPENDED` (modo solo-lectura, RF-56). | 🟡 Media | 4 |
| RF-66 | El sistema debe notificar a la capitana (email) cuando su suscripción pasa a `PAST_DUE` y cuando pasa a `SUSPENDED`, indicando cómo regularizar el pago. | 🟡 Media | 4 |

---

## 4bis. Requerimientos no funcionales — Super administración

| ID | Requerimiento |
|----|---------------|
| RNF-13 | **Separación de roles**: `isSuperAdmin` es un flag a nivel de `User`, completamente independiente de los roles dentro de un equipo (`TeamMember.role`). Un super admin no es automáticamente capitana de ningún equipo, y viceversa. |
| RNF-14 | **Aislamiento de datos a nivel de código**: ninguna función/endpoint usado por el panel de super admin debe hacer queries a las tablas de datos internos del equipo (jugadoras, pagos, gastos, eventos). Esto se valida con revisión de código, no confiando en que la UI simplemente no muestre esos datos. |
| RNF-15 | **Protección de rutas**: todas las rutas bajo `/admin` deben validar `isSuperAdmin` en el servidor (middleware o chequeo en cada route handler), nunca solo en el cliente. |
| RNF-16 | **Autenticación reforzada**: se recomienda exigir verificación adicional (2FA) para cuentas con `isSuperAdmin = true`, dado el nivel de privilegio y la sensibilidad de los datos de facturación. |
| RNF-17 | **Confirmación en acciones destructivas**: suspender, cancelar o eliminar una cuenta debe requerir confirmación explícita (no debe poder hacerse con un solo clic accidental). |
| RNF-18 | **Datos sensibles**: CUIT/CUIL, email de facturación y demás datos de facturación no deben aparecer en logs de aplicación ni en respuestas de API sin autenticar. |
| RNF-19 | **Auditoría**: el log de acciones del super admin debe ser de solo-append (no editable ni borrable desde la propia app). |
| RNF-20 | **Seguridad del webhook**: el endpoint que recibe notificaciones de Mercado Pago debe validar la firma/token del webhook antes de procesar cualquier cambio de estado, para evitar que alguien fuerce un cambio de estado de suscripción con una request falsa. |
| RNF-21 | **Idempotencia**: el procesamiento del webhook de Mercado Pago debe ser idempotente (recibir la misma notificación dos veces no debe duplicar efectos ni romper el estado de la suscripción). |

---

## Modelo de datos — propuesta inicial

```prisma
enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  SUSPENDED
  CANCELED
}

enum Plan {
  TRIAL
  BASIC
  PRO
}

model Subscription {
  id                String             @id @default(cuid())
  teamId            String             @unique
  team              Team               @relation(fields: [teamId], references: [id])
  plan              Plan               @default(TRIAL)
  status            SubscriptionStatus @default(TRIALING)
  trialEndsAt       DateTime?
  currentPeriodEnd  DateTime?

  contactName       String
  contactEmail      String
  contactPhone      String?

  billingName       String?
  billingTaxId      String?   // CUIT/CUIL
  billingEmail      String?

  notes             String?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model SuperAdminAuditLog {
  id            String   @id @default(cuid())
  adminUserId   String
  admin         User     @relation(fields: [adminUserId], references: [id])
  action        String   // e.g. "SUBSCRIPTION_STATUS_CHANGED", "BILLING_INFO_EDITED"
  targetTeamId  String
  metadata      Json?
  createdAt     DateTime @default(now())
}
```

En `User`, agregar:

```prisma
isSuperAdmin  Boolean  @default(false)
```

---

## Decisiones confirmadas

1. **Unidad de facturación**: por equipo.
2. **Suspensión**: modo solo-lectura, con banner visible indicando el motivo y cómo regularizar (RF-56/RF-56b/RF-56c).
3. **Actualización de estado**: automática vía webhook de Mercado Pago (RF-64), con override manual del super admin disponible para excepciones (RF-55).

## Puntos a definir durante la implementación (no bloquean el arranque)

- **Duración del período de gracia** antes de pasar de `PAST_DUE` a `SUSPENDED` (RF-65) — propuesta inicial: 5-7 días, ajustable.
- **Alcance exacto del modo solo-lectura**: ¿se bloquean también acciones de "solo lectura pero con efecto", como exportar reportes o generar el mensaje de WhatsApp de deudoras (RF-46)? Definir caso por caso al implementar los guards.
- **Secuenciación**: RF-64/RF-65/RF-66 dependen de que la integración de Mercado Pago (RF-49/RF-50, Fase 4) esté lista. El módulo de super admin en sí (listado, contacto, facturación, override manual) puede implementarse antes, en Fase 2, usando solo el cambio de estado manual (RF-55) hasta que la automatización esté disponible.