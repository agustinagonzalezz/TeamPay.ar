# TeamPay.ar — Documento de Requerimientos

**Versión:** 0.1 (borrador inicial)
**Fecha:** Mayo 2026
**Autora:** [Tu nombre]

---

## 1. Visión general del producto

TeamPay.ar es una aplicación web responsive para gestionar la economía de equipos deportivos amateur. Le permite a la capitana (o tesorera) del equipo registrar eventos con costos (cuotas mensuales, amistosos, torneos), llevar el control de quién pagó y quién debe, registrar los gastos del equipo (entrenador, alquiler de cancha, árbitros) y conocer el balance financiero en cualquier momento.

### 1.1 Problema que resuelve

Las capitanas de equipos amateurs hoy llevan las cuentas en Google Sheets o WhatsApp, lo cual es propenso a errores, poco visual, no permite ver el estado de pago de forma clara, y obliga a reclamar pagos manualmente uno por uno.

### 1.2 Usuario principal

Capitana o tesorera de un equipo deportivo amateur, entre 18 y 40 años, sin formación contable, que actualmente usa planillas de cálculo.

### 1.3 Alcance del MVP

El alcance inicial cubre la gestión interna por parte de la capitana. La jugadora no necesita registrarse ni tener cuenta en la app en esta primera versión: la coordinación de pagos sigue ocurriendo por WhatsApp y la capitana registra los movimientos en TeamPay.

---

## 2. Actores del sistema

| Actor | Descripción | Alcance en el MVP |
|-------|-------------|-------------------|
| **Capitana** | Usuaria registrada con un equipo a su cargo. Administra jugadoras, eventos, pagos y gastos. | Sí |
| **Co-administradora** | Usuaria registrada con permisos de administración delegados por la capitana. | Fase 2 |
| **Jugadora** | Integrante del equipo. Aparece como registro gestionado por la capitana. | Sí (como entidad, sin login) |
| **Jugadora registrada** | Jugadora con cuenta propia en la app que puede consultar su deuda. | Fase 3 |

---

## 3. Requerimientos funcionales

Cada requerimiento tiene un identificador (`RF-XX`), prioridad y la fase en la que se va a implementar.

**Prioridades:**
- 🔴 **Alta** — Indispensable para el MVP
- 🟡 **Media** — Importante, pero el MVP puede vivir sin esto
- 🟢 **Baja** — Nice to have / mejora futura

### 3.1 Módulo de autenticación y usuarios

| ID | Requerimiento | Prioridad | Fase |
|----|---------------|-----------|------|
| RF-01 | El sistema debe permitir el registro de usuarias mediante cuenta de Google (OAuth) o mediante email y contraseña, con verificación de email obligatoria en este último caso. | 🔴 Alta | 1 |
| RF-02 | El sistema debe permitir el inicio y cierre de sesión. | 🔴 Alta | 1 |
| RF-03 | El sistema debe mantener la sesión activa entre visitas (recordar usuaria). | 🔴 Alta | 1 |
| RF-04 | El sistema debe permitir a la usuaria ver y editar su perfil básico (nombre, foto). | 🟡 Media | 1 |
| RF-05 | El sistema debe permitir cerrar la cuenta y eliminar todos los datos asociados. | 🟢 Baja | 3 |

### 3.2 Módulo de equipos

| ID | Requerimiento | Prioridad | Fase |
|----|---------------|-----------|------|
| RF-06 | La capitana debe poder crear un equipo indicando nombre y descripción opcional. | 🔴 Alta | 1 |
| RF-07 | La capitana debe poder editar los datos básicos del equipo. | 🔴 Alta | 1 |
| RF-08 | La capitana debe poder ver el listado de equipos que administra. | 🔴 Alta | 1 |
| RF-09 | La capitana debe poder eliminar un equipo (con confirmación previa). | 🟡 Media | 1 |
| RF-10 | La capitana debe poder subir un logo o imagen del equipo. | 🟢 Baja | 2 |
| RF-11 | Una capitana debe poder administrar más de un equipo desde una misma cuenta. | 🟡 Media | 2 |

### 3.3 Módulo de jugadoras

| ID | Requerimiento | Prioridad | Fase |
|----|---------------|-----------|------|
| RF-12 | La capitana debe poder agregar jugadoras al equipo con su nombre. | 🔴 Alta | 1 |
| RF-13 | La capitana debe poder agregar datos opcionales de cada jugadora (teléfono, posición, número de camiseta). | 🟡 Media | 1 |
| RF-14 | La capitana debe poder editar los datos de una jugadora. | 🔴 Alta | 1 |
| RF-15 | La capitana debe poder marcar a una jugadora como activa o inactiva, sin eliminar su historial de pagos. | 🔴 Alta | 1 |
| RF-16 | La capitana debe poder eliminar a una jugadora del equipo (con confirmación). | 🟡 Media | 1 |
| RF-17 | El sistema debe mostrar el listado completo de jugadoras del equipo, ordenable y filtrable. | 🔴 Alta | 1 |
| RF-18 | El sistema debe permitir importar jugadoras masivamente desde un CSV. | 🟢 Baja | 3 |

### 3.4 Módulo de eventos y cobros

Por "evento" se entiende cualquier concepto que genera un cobro a las jugadoras: una cuota mensual, un amistoso, un torneo, una compra de indumentaria, un asado, etc.

| ID | Requerimiento | Prioridad | Fase |
|----|---------------|-----------|------|
| RF-19 | La capitana debe poder crear un evento indicando nombre, tipo (cuota, amistoso, torneo, otro), monto por jugadora y fecha de vencimiento. | 🔴 Alta | 1 |
| RF-20 | La capitana debe poder elegir qué jugadoras participan del evento (por defecto, todas las activas). | 🔴 Alta | 1 |
| RF-21 | La capitana debe poder definir montos diferenciados por jugadora dentro de un mismo evento (por ejemplo, descuento para la arquera). | 🟡 Media | 2 |
| RF-22 | La capitana debe poder eximir a una jugadora del cobro de un evento puntual. | 🔴 Alta | 1 |
| RF-23 | La capitana debe poder editar un evento mientras esté abierto. | 🔴 Alta | 1 |
| RF-24 | La capitana debe poder cerrar un evento (no se pueden registrar más pagos contra él). | 🟡 Media | 2 |
| RF-25 | La capitana debe poder eliminar un evento (con confirmación, solo si no tiene pagos asociados). | 🟡 Media | 1 |
| RF-26 | El sistema debe permitir duplicar un evento para reutilizar la configuración (por ejemplo, para repetir cuota mes a mes). | 🟡 Media | 2 |
| RF-27 | El sistema debe permitir crear cuotas recurrentes automáticas (mensuales) que se generen solas. | 🟢 Baja | 3 |

### 3.5 Módulo de pagos

| ID | Requerimiento | Prioridad | Fase |
|----|---------------|-----------|------|
| RF-28 | La capitana debe poder marcar manualmente que una jugadora pagó un evento. | 🔴 Alta | 1 |
| RF-29 | El sistema debe registrar la fecha y la hora del pago. | 🔴 Alta | 1 |
| RF-30 | La capitana debe poder registrar un pago parcial (la jugadora pagó menos del monto total). | 🟡 Media | 2 |
| RF-31 | La capitana debe poder adjuntar un comprobante (imagen) al registro del pago. | 🟡 Media | 2 |
| RF-32 | La capitana debe poder desmarcar un pago si se equivocó. | 🔴 Alta | 1 |
| RF-33 | La capitana debe poder ver el historial de pagos de cada jugadora. | 🔴 Alta | 1 |
| RF-34 | El sistema debe calcular automáticamente cuánto debe cada jugadora considerando todos los eventos abiertos. | 🔴 Alta | 1 |

### 3.6 Módulo de gastos del equipo

| ID | Requerimiento | Prioridad | Fase |
|----|---------------|-----------|------|
| RF-35 | La capitana debe poder registrar un gasto del equipo indicando concepto, monto, fecha y a quién se le pagó. | 🔴 Alta | 1 |
| RF-36 | La capitana debe poder categorizar los gastos (entrenador, cancha, árbitros, indumentaria, otros). | 🟡 Media | 1 |
| RF-37 | La capitana debe poder editar y eliminar un gasto registrado. | 🔴 Alta | 1 |
| RF-38 | La capitana debe poder adjuntar un comprobante al gasto. | 🟡 Media | 2 |
| RF-39 | El sistema debe permitir registrar gastos recurrentes (sueldo del entrenador mensual). | 🟢 Baja | 3 |

### 3.7 Módulo de dashboard y reportes

| ID | Requerimiento | Prioridad | Fase |
|----|---------------|-----------|------|
| RF-40 | El sistema debe mostrar un dashboard principal con: total recaudado del mes, monto pendiente por cobrar, total de gastos del mes y balance neto. | 🔴 Alta | 1 |
| RF-41 | El sistema debe mostrar el listado de eventos activos con su progreso de cobro (cuántas pagaron / cuántas faltan). | 🔴 Alta | 1 |
| RF-42 | El sistema debe mostrar un ranking de jugadoras con deuda pendiente, ordenadas por monto adeudado. | 🔴 Alta | 1 |
| RF-43 | El sistema debe permitir filtrar el dashboard por período (mes, trimestre, año, custom). | 🟡 Media | 2 |
| RF-44 | El sistema debe permitir exportar reportes (deudoras, balance) a Excel o PDF. | 🟡 Media | 2 |
| RF-45 | El sistema debe mostrar gráficos de evolución del balance del equipo a lo largo del tiempo. | 🟢 Baja | 3 |

### 3.8 Módulo de notificaciones (Fase 3)

| ID | Requerimiento | Prioridad | Fase |
|----|---------------|-----------|------|
| RF-46 | El sistema debe permitir generar un mensaje listo para copiar y pegar en WhatsApp con el listado de deudoras y montos. | 🟡 Media | 2 |
| RF-47 | El sistema debe enviar recordatorios automáticos por email a las jugadoras registradas con deudas pendientes. | 🟢 Baja | 3 |
| RF-48 | El sistema debe integrarse con la API de WhatsApp Business para enviar recordatorios automáticos. | 🟢 Baja | 4 |

### 3.9 Módulo de cobros online (Fase 4)

| ID | Requerimiento | Prioridad | Fase |
|----|---------------|-----------|------|
| RF-49 | El sistema debe integrarse con Mercado Pago para generar links de pago por evento. | 🟢 Baja | 4 |
| RF-50 | El sistema debe registrar automáticamente los pagos confirmados por Mercado Pago. | 🟢 Baja | 4 |

---

## 4. Requerimientos no funcionales

| ID | Requerimiento |
|----|---------------|
| RNF-01 | **Responsive**: la aplicación debe funcionar correctamente en pantallas desde 360px (mobile) hasta desktop. El uso principal es desde celular. |
| RNF-02 | **Performance**: las pantallas principales (dashboard, listado de jugadoras) deben cargar en menos de 2 segundos con conexión 4G. |
| RNF-03 | **Seguridad**: la autenticación admite Google OAuth y email/contraseña. Las contraseñas nunca se almacenan en texto plano: se guardan hasheadas (bcrypt). El registro por email requiere verificación de la casilla antes de poder iniciar sesión, y existe un flujo de recuperación de contraseña con tokens de un solo uso y expiración corta. Los endpoints públicos de autenticación (registro, reenvío de verificación, recuperación de contraseña) tienen rate limiting. Todas las comunicaciones deben usar HTTPS. |
| RNF-04 | **Autorización**: una usuaria solo puede ver y modificar los datos de los equipos que administra. |
| RNF-05 | **Persistencia**: los datos no se pierden entre sesiones; toda operación queda guardada en base de datos. |
| RNF-06 | **Disponibilidad**: el sistema debe estar disponible al menos un 99% del tiempo. |
| RNF-07 | **Compatibilidad**: debe funcionar en las últimas dos versiones de Chrome, Safari, Firefox y Edge. |
| RNF-08 | **Localización**: la interfaz está en español rioplatense; los montos se muestran con formato argentino (separador de miles con punto, decimales con coma, símbolo `$`). |
| RNF-09 | **Manejo de errores**: ante un error, el sistema debe mostrar un mensaje claro a la usuaria, sin exponer detalles técnicos. |
| RNF-10 | **Backup**: la base de datos debe respaldarse al menos una vez por día. |
| RNF-11 | **Mantenibilidad**: el código debe seguir las convenciones del stack (TypeScript estricto, ESLint, Prettier) y estar organizado por capas (UI, servicios, persistencia). |
| RNF-12 | **Privacidad**: los datos del equipo son privados; ninguna otra usuaria del sistema debe poder verlos. |

---

## 5. Restricciones técnicas

- **Stack frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, shadcn/ui.
- **Stack backend**: Next.js API routes, Prisma ORM.
- **Base de datos**: PostgreSQL 16+.
- **Autenticación**: Auth.js (NextAuth v5) con provider de Google.
- **Validación**: Zod en cliente y servidor.
- **Deploy**: Vercel (frontend + API) y Supabase o Neon (base de datos).
- **Desarrollo local**: Docker Compose para levantar Postgres.

---

## 6. Roadmap de fases

| Fase | Contenido | Duración estimada |
|------|-----------|-------------------|
| **Fase 1 — MVP** | Auth, equipos, jugadoras, eventos básicos, pagos manuales, gastos básicos, dashboard. | 3-4 semanas |
| **Fase 2 — Refinamiento** | Comprobantes, montos diferenciados, exportar reportes, mensaje pre-armado para WhatsApp, multi-equipo. | 2-3 semanas |
| **Fase 3 — Automatización** | Recordatorios por email, cuotas recurrentes, vista para jugadora registrada, gastos recurrentes. | 3-4 semanas |
| **Fase 4 — Monetización** | Mercado Pago, integración WhatsApp Business, planes de suscripción. | 4+ semanas |

---

## 7. Supuestos y dependencias

- La coordinación inicial del cobro (avisarle a las jugadoras que deben pagar) sigue ocurriendo por WhatsApp manualmente.
- La capitana es quien confirma los pagos (no hay confirmación automática hasta integrar Mercado Pago en Fase 4).
- La aplicación es responsive pero **no es una app nativa**: se accede desde el navegador.
- El acceso a internet es requerido; no hay modo offline en el MVP.

---

## 8. Riesgos identificados

| Riesgo | Mitigación |
|--------|------------|
| El nombre TeamPay tiene productos similares en otros mercados. | Se diferencia con el sufijo `.ar` y enfoque local. Validar disponibilidad de dominio y marca antes de Fase 4. |
| Las jugadoras pueden no querer descargar otra app. | El MVP no requiere que las jugadoras se registren. Sólo la capitana usa la app. |
| Bajo poder adquisitivo del segmento dificulta monetizar. | Empezar gratis para captar usuarias y monetizar con freemium o comisión sobre pagos. |
| Dependencia de Google OAuth como único login. | Considerar agregar email/password o login con Apple en una próxima fase. |

---

## 9. Glosario

| Término | Definición |
|---------|------------|
| **Capitana** | Usuaria principal del sistema, administra el equipo. |
| **Equipo** | Conjunto de jugadoras organizado para participar en alguna actividad deportiva. |
| **Jugadora** | Integrante del equipo, sujeta al cobro de cuotas y eventos. |
| **Evento** | Concepto de cobro que se aplica a una o varias jugadoras (cuota, amistoso, torneo, etc.). |
| **Cuota** | Tipo de evento, generalmente mensual y recurrente. |
| **Pago** | Registro de que una jugadora abonó la totalidad o parte de lo que adeudaba por un evento. |
| **Gasto** | Egreso del equipo (sueldo del entrenador, alquiler de cancha, árbitro, etc.). |
| **Balance** | Diferencia entre lo recaudado y lo gastado en un período determinado. |