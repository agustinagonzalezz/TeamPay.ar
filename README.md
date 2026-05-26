# TeamPay.ar

Aplicación web para gestionar pagos y finanzas de equipos de fútbol amateur argentinos.
La capitana del equipo registra eventos (cuotas, amistosos, torneos), lleva el control de
quién pagó y monitorea el balance general del equipo.

> **Estado:** En desarrollo activo 🚧

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 (strict) |
| Estilos | Tailwind CSS 4 |
| Componentes | shadcn/ui v4 |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL 16 |
| Autenticación | Auth.js v5 (NextAuth) — Google OAuth |
| Validaciones | Zod 4 |
| Formularios | React Hook Form 7 |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para la base de datos local)
- [Git](https://git-scm.com/)
- Una cuenta de Google Cloud (para las credenciales OAuth)

---

## Setup desde cero

### 1. Clonar el repositorio

```bash
git clone https://github.com/agustinagonzalezz/TeamPay.ar.git
cd TeamPay.ar
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiá el archivo de ejemplo y completá los valores:

```bash
cp .env.example .env
```

Editá `.env` con tus valores:

```env
DATABASE_URL="postgresql://dev:dev@localhost:5432/gestion_equipo"

# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_SECRET="tu-secreto-aquí"

AUTH_URL="http://localhost:3000"

# Obtener en https://console.cloud.google.com
AUTH_GOOGLE_ID="tu-google-client-id"
AUTH_GOOGLE_SECRET="tu-google-client-secret"
```

<details>
<summary>Cómo obtener las credenciales de Google OAuth</summary>

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un proyecto nuevo (o usar uno existente)
3. Activar la API **"Google+ API"** o **"Google Identity"**
4. Ir a **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Tipo de aplicación: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copiar **Client ID** y **Client Secret** en `.env`

</details>

### 4. Levantar la base de datos

```bash
docker compose up -d
```

Verificar que esté corriendo:

```bash
docker compose ps
# o
docker compose logs postgres
```

### 5. Aplicar el schema de base de datos

```bash
npx prisma migrate dev --name "init"
```

Esto crea las tablas y genera el cliente de Prisma en `src/generated/prisma/`.

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Comandos frecuentes

### Desarrollo

```bash
npm run dev          # Servidor de desarrollo en localhost:3000
npm run build        # Build de producción
npm run start        # Iniciar en modo producción
npm run lint         # Linting con ESLint
```

### Base de datos

```bash
# Docker
docker compose up -d              # Levantar Postgres
docker compose down               # Bajar Postgres
docker compose down -v            # Bajar Postgres y borrar datos

# Prisma
npx prisma migrate dev            # Aplicar migraciones pendientes
npx prisma migrate dev --name "descripcion-del-cambio"
npx prisma generate               # Regenerar cliente (después de cambiar schema)
npx prisma studio                 # GUI de BD en localhost:5555
npx prisma db push                # Push sin migración (prototipado rápido)
npx prisma migrate reset          # ⚠️ Reset total de la BD
```

### shadcn/ui — Agregar componentes

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form input label
npx shadcn@latest add select textarea badge
npx shadcn@latest add dialog sheet
npx shadcn@latest add table
npx shadcn@latest add toast sonner
```

---

## Estructura del proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Rutas de autenticación
│   ├── (dashboard)/        # Rutas protegidas
│   ├── api/auth/           # Auth.js handler
│   └── globals.css
├── actions/                # Server Actions (por entidad)
├── components/
│   ├── ui/                 # shadcn/ui (no modificar)
│   ├── equipos/
│   ├── eventos/
│   ├── jugadoras/
│   └── shared/
├── lib/
│   ├── prisma.ts           # Singleton PrismaClient
│   ├── auth.ts             # Configuración Auth.js
│   └── utils.ts            # cn(), helpers
├── types/                  # Tipos Zod / TypeScript
└── hooks/                  # Client hooks
prisma/
├── schema.prisma           # Modelos de BD
└── migrations/
docker-compose.yml          # Postgres 16 local
.env.example                # Template de variables
```

---

## Convención de nombres

- **Entidades de negocio** → español: `Equipo`, `Jugadora`, `Evento`, `Pago`, `Gasto`
- **Código técnico** → inglés: `TeamCard`, `useEventForm`, `formatCurrency`
- **Archivos de componentes** → PascalCase: `EventoCard.tsx`
- **Archivos de utils/hooks** → camelCase: `formatCurrency.ts`

Ver [CLAUDE.md](./CLAUDE.md) para la guía completa de convenciones.

---

## Contribuir

Este es un proyecto personal. Si encontrás algún bug o tenés sugerencias, abrí un issue.

---

*Desarrollado por [Agustina González](https://github.com/agustinagonzalezz)*
