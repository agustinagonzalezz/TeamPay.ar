# CLAUDE.md — TeamPay.ar

> Leer este archivo al inicio de cada sesión antes de tocar código.

---

## Descripción del proyecto

**TeamPay.ar** es una aplicación web para gestionar pagos y finanzas de equipos de fútbol amateur argentinos.

La **capitana** del equipo puede:
- Registrar **eventos** (cuota mensual, amistosos, torneos, gastos varios)
- Marcar qué **jugadoras** pagaron cada evento
- Registrar **gastos** del equipo (entrenador, cancha, indumentaria, etc.)
- Ver el **balance** general del equipo en tiempo real
- Invitar jugadoras a unirse al equipo

Las **jugadoras** pueden:
- Ver su estado de deuda / pagos pendientes
- Consultar el historial de pagos propios

**Objetivo dual:** producto funcional + portfolio profesional de Agus.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 con App Router |
| Lenguaje | TypeScript 5 (strict) |
| Estilos | Tailwind CSS 4 |
| Componentes UI | shadcn/ui v4 (style: base-nova, color: neutral) |
| ORM | Prisma 7 — genera cliente en `src/generated/prisma/` |
| Base de datos | PostgreSQL 16 |
| Autenticación | Auth.js v5 beta (`next-auth@beta`) con Google OAuth |
| Validaciones | Zod 4 |
| Formularios | React Hook Form 7 + @hookform/resolvers 5 |
| Dev DB local | Docker Compose |
| Linting | ESLint |

---

## Convenciones de código

### Idiomas

| Contexto | Idioma | Ejemplos |
|---|---|---|
| Entidades de negocio (modelos, tipos, UI labels) | **Español** | `Equipo`, `Jugadora`, `Evento`, `Pago`, `Gasto`, `Balance` |
| Código técnico (componentes React, hooks, utils, rutas) | **Inglés** | `TeamCard`, `useEventForm`, `formatCurrency`, `/dashboard` |
| Variables locales de negocio | **Español** | `const equipo`, `const jugadoras` |
| Props de componentes genéricos | **Inglés** | `onClick`, `isLoading`, `children` |
| Comentarios | Español cuando explican lógica de negocio; inglés para detalles técnicos |

### TypeScript

- `strict: true` siempre
- Preferir `type` sobre `interface` para shapes de datos (usar `interface` solo para extensión/implementación)
- No usar `any`; usar `unknown` + narrowing si hace falta
- Exportar tipos de dominio desde `src/types/`

### Componentes React

- Siempre componentes de función con arrow functions
- Archivos: `PascalCase.tsx` para componentes, `camelCase.ts` para utils/hooks
- Un componente principal por archivo; helpers pequeños pueden coexistir
- `"use client"` solo cuando sea estrictamente necesario; preferir Server Components

### Estilos

- Tailwind utility-first; no CSS modules salvo caso excepcional
- Variantes de shadcn/ui sin modificar los archivos base de `components/ui/`
- Clases condicionales con `cn()` (de `lib/utils.ts`)

### Prisma / Base de datos

- Nombres de modelos en **singular PascalCase en español**: `Equipo`, `Jugadora`, `Evento`, `Pago`, `Gasto`
- Nombres de campos en **camelCase**: `fechaCreacion`, `montoTotal`, `estaActivo`
- Migraciones descriptivas en español: `add-campo-descripcion-a-evento`
- Nunca usar `prisma.X.delete` en cascada sin revisar las relaciones
- **Prisma 7**: el cliente se genera en `src/generated/prisma/` (NO en `node_modules`)
  - Importar desde: `import { PrismaClient } from "@/generated/prisma/client"` (entry point es `client.ts`, no hay `index.ts`)
  - Usa driver adapter en runtime: `new PrismaPg({ connectionString })` — la URL no va en schema.prisma
  - Configuración CLI en `prisma.config.ts` (raíz del proyecto) — lee DATABASE_URL via dotenv
  - El cliente se regenera con `npx prisma generate` tras cada cambio de schema
  - El singleton de Prisma vive en `src/lib/prisma.ts` — no instanciar PrismaClient en otro lugar

### Patrón de features (repetir en cada entidad)

```
src/lib/validations/<entidad>.ts    ← Zod schema (cliente + servidor)
src/services/<entidad>Service.ts    ← Lógica de negocio con Prisma
src/app/api/<entidad>s/route.ts     ← API route (valida con Zod, delega al service)
src/components/dashboard/<Component>.tsx ← Componentes de UI reutilizables
src/app/(dashboard)/<entidad>s/...  ← Páginas (Server Components que leen data)
```

- El **service** encapsula toda la lógica de negocio y queries de Prisma
- Las **API routes** solo parsean el request, validan con Zod y llaman al service
- Los **Server Components** llaman al service directamente (sin fetch)
- Los **formularios** son Client Components con react-hook-form + zodResolver → `POST /api/...`
- Los **services** nunca lanzan excepciones: retornan `{ success: true, data }` | `{ success: false, error: string }`

### Button como enlace (shadcn v4 base-nova)

El `Button` usa `@base-ui/react/button` que NO tiene `asChild`. Para links con estilos de botón:
```tsx
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
// En lugar de <Button asChild><Link>...</Link></Button>:
<Link href="..." className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
  Texto
</Link>
```

### Errores y loading states

- Usar `error.tsx` y `loading.tsx` de App Router
- Services devuelven `{ success: true, data }` o `{ success: false, error: string }`
- No hacer `throw` en services ni API routes; capturar y retornar el error tipado

---

## Estructura de carpetas

```
TeamPay.ar/
├── prisma/
│   ├── schema.prisma          # Modelos: Equipo, Jugadora, Evento, Pago, Gasto, User
│   └── migrations/
├── src/
│   ├── app/                   # App Router de Next.js
│   │   ├── (auth)/            # Grupo de rutas de autenticación
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/       # Grupo protegido (requiere sesión)
│   │   │   ├── layout.tsx     # Verifica sesión, sidebar/nav
│   │   │   ├── page.tsx       # Redirect a /equipos o página principal
│   │   │   ├── equipos/
│   │   │   │   ├── page.tsx           # Lista de equipos del usuario
│   │   │   │   ├── nuevo/page.tsx     # Crear equipo
│   │   │   │   └── [equipoId]/
│   │   │   │       ├── page.tsx       # Dashboard del equipo
│   │   │   │       ├── eventos/
│   │   │   │       │   ├── page.tsx
│   │   │   │       │   ├── nuevo/page.tsx
│   │   │   │       │   └── [eventoId]/page.tsx
│   │   │   │       ├── jugadoras/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── gastos/
│   │   │   │           └── page.tsx
│   │   │   └── perfil/page.tsx
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/route.ts
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css
│   ├── actions/               # Server Actions
│   │   ├── equipos.ts
│   │   ├── eventos.ts
│   │   ├── jugadoras.ts
│   │   ├── pagos.ts
│   │   └── gastos.ts
│   ├── components/
│   │   ├── ui/                # shadcn/ui (NO modificar directamente)
│   │   ├── equipos/           # Componentes específicos de equipo
│   │   │   ├── TeamCard.tsx
│   │   │   └── TeamForm.tsx
│   │   ├── eventos/
│   │   │   ├── EventoCard.tsx
│   │   │   ├── EventoForm.tsx
│   │   │   └── PagosList.tsx
│   │   ├── jugadoras/
│   │   │   └── JugadoraRow.tsx
│   │   └── shared/            # Componentes reutilizables genéricos
│   │       ├── PageHeader.tsx
│   │       ├── EmptyState.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   ├── prisma.ts          # Singleton de PrismaClient
│   │   ├── auth.ts            # Configuración de Auth.js
│   │   └── utils.ts           # cn(), formatCurrency(), formatDate()
│   ├── types/
│   │   ├── equipo.ts          # Types/schemas Zod de Equipo
│   │   ├── evento.ts
│   │   ├── jugadora.ts
│   │   ├── pago.ts
│   │   └── gasto.ts
│   └── hooks/                 # Client hooks reutilizables
│       └── useToast.ts
├── docker-compose.yml         # PostgreSQL local
├── .env.local                 # Variables de entorno (NO commitear)
├── .env.example               # Template de variables (SÍ commitear)
├── CLAUDE.md                  # Este archivo
└── README.md
```

---

## Modelos de dominio (Prisma — referencia rápida)

```
User          → autenticación (NextAuth)
Jugadora      → perfil dentro de un Equipo (linked a User)
Equipo        → tiene muchas Jugadoras y Eventos
Evento        → cuota | amistoso | torneo | gasto_general
               tiene monto esperado y fecha
Pago          → Jugadora pagó un Evento (monto real + fecha de pago)
Gasto         → gasto del equipo (cancha, entrenador) contra un Evento o suelto
```

Relaciones clave:
- `User` 1—N `Jugadora` (una persona puede estar en varios equipos)
- `Equipo` 1—N `Jugadora` (a través de membresía con rol: capitana | jugadora)
- `Equipo` 1—N `Evento`
- `Evento` 1—N `Pago`
- `Jugadora` 1—N `Pago`

---

## Variables de entorno requeridas

```env
# .env.local
DATABASE_URL="postgresql://teampay:teampay@localhost:5432/teampay_db"

AUTH_SECRET=""                  # openssl rand -base64 32
AUTH_GOOGLE_ID=""               # Google Cloud Console
AUTH_GOOGLE_SECRET=""           # Google Cloud Console

NEXTAUTH_URL="http://localhost:3000"
```

---

## Comandos comunes

```bash
# Desarrollo
npm run dev                     # Inicia Next.js en localhost:3000

# Base de datos (Docker)
docker compose up -d            # Levanta PostgreSQL local
docker compose down             # Baja el contenedor
docker compose logs postgres    # Ver logs de Postgres

# Prisma
npx prisma migrate dev          # Aplica migraciones (NO genera cliente en Prisma 7 — correr generate después)
npx prisma migrate dev --name "descripcion-en-español"
npx prisma generate             # Regenerar cliente (obligatorio tras migrate dev en Prisma 7)
npx prisma db push              # Push sin migración (solo prototipado)
npx prisma studio               # GUI de base de datos en localhost:5555
npx prisma db seed              # Cargar datos de prueba (config en prisma.config.ts)
npx prisma migrate reset        # ⚠️ Resetea BD + corre seed automáticamente

# shadcn/ui
npx shadcn@latest add button    # Agregar componente
npx shadcn@latest add form input select card badge

# Linting
npm run lint                    # ESLint
npm run typecheck               # tsc --noEmit

# Build
npm run build                   # Build de producción (correr antes de commitear)
```

---

## Estado del proyecto

- [x] Setup inicial (Next.js 16, Tailwind, shadcn/ui, Prisma 7, Auth.js v5)
- [x] Docker Compose + schema Prisma con todos los modelos de dominio
- [x] Seed con datos realistas (Las Pibas FC)
- [x] Autenticación con Google (Auth.js v5 + PrismaAdapter + JWT strategy)
- [x] CRUD de Equipos — Crear + Listar + Ver (`/equipos`, `/equipos/nuevo`, `/equipos/[id]`)
- [x] Gestión de Jugadoras — Agregar + Listar + Dar de baja (`/equipos/[id]/jugadoras`)
- [x] CRUD de Eventos — Crear + Listar + Ver detalle con participantes (`/equipos/[id]/eventos/nuevo`, `/equipos/[id]/eventos/[eventoId]`)
- [x] Registro de Pagos por evento — marcar/desmarcar pago por jugadora desde la página del evento
- [x] Registro de Gastos — crear/listar/eliminar gastos del equipo (`/equipos/[id]/gastos`)
- [x] Dashboard de Balance — resumen financiero por equipo (`/equipos/[id]/balance`)
- [x] Vista de Jugadora — perfil personal con deudas pendientes e historial de pagos (`/perfil`)
- [ ] Deploy (Vercel + Neon o Supabase)

---

## Notas de portfolio

- El código debe ser legible y estar bien comentado donde haya lógica no obvia
- Priorizar patrones modernos de Next.js (App Router, Server Actions, streaming)
- Cada feature bien delimitada en su carpeta para mostrar organización
- README.md final debe incluir capturas y descripción para recruiters
