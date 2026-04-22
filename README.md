# Orbit Nexus

Base de Fase 1 para Orbit Nexus construida con:

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma ORM
- Tailwind CSS
- shadcn/ui
- JWT custom

## Alcance actual

Esta implementacion cubre solo la Fase 1:

- autenticacion con `codigo unico + contrasena`
- registro en 2 pasos
- deteccion automatica de rol y empresa
- validacion de lideres y consultores mediante datasets ya parseados desde Excel
- validacion de clientes por `folio` de proyecto
- historial de accesos
- middleware y tenant guard
- importacion de usuarios autorizados

No incluye dashboards ni funcionalidades de Fase 2.

## Variables de entorno

Usa [`.env.example`](/C:/Users/Nathalie_Gar/OneDrive/Documentos/orbit-nexus-data/.env.example) como base.

Variables principales:

- `DATABASE_URL`
- `JWT_SECRET`
- `APP_URL`
- `DEFAULT_COMPANY_NAME`
- `DEFAULT_COMPANY_SLUG`
- `SUPERADMIN_NAME`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PHONE`
- `SUPERADMIN_PASSWORD`
- `SUPERADMIN_ACCESS_CODE`
- `DEMO_PROJECT_FOLIO`

## Arranque basico

1. Instala dependencias.
2. Configura `.env` a partir de `.env.example`.
3. Ejecuta migraciones de Prisma.
4. Genera el cliente de Prisma.
5. Ejecuta el seed inicial.
6. Inicia la aplicacion.

Scripts disponibles:

- `npm run dev`
- `npm run build`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:deploy`
- `npm run prisma:seed`

## Checklist de ejecucion local

### 1. Instalar dependencias

- Verifica que tengas Node.js 20+ y npm disponibles.
- Ejecuta `npm install`
- Confirma que exista la carpeta `node_modules`

Si falla:

- Si aparece `npm: command not found`, instala Node.js y vuelve a abrir la terminal.
- Si aparece error de version de Node, actualiza a una version compatible con Next.js 15.
- Si falla por red o certificados, valida proxy corporativo, VPN o registro npm.

### 2. Configurar variables de entorno

- Duplica `.env.example` como `.env`
- Revisa especialmente:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `APP_URL`
  - credenciales del superadmin seed
  - `DEMO_PROJECT_FOLIO`
- Usa una base PostgreSQL accesible desde tu maquina local

Validacion rapida:

- `DATABASE_URL` debe apuntar a PostgreSQL real
- `JWT_SECRET` no debe quedar con el valor de ejemplo en ambientes compartidos
- `APP_URL` normalmente debe ser `http://localhost:3000`

Si falla:

- Si Prisma no conecta, revisa host, puerto, usuario, password y nombre de base.
- Si login devuelve errores extraños de sesion, revisa `JWT_SECRET` y `APP_URL`.

### 3. Correr Prisma

Primera vez:

1. Ejecuta `npm run prisma:generate`
2. Ejecuta `npx prisma migrate dev --name phase_1_init`
3. Ejecuta `npm run prisma:seed`

Siguientes veces:

1. Ejecuta `npm run prisma:generate`
2. Ejecuta `npm run prisma:migrate`
3. Ejecuta `npm run prisma:seed` si quieres resembrar el superadmin y el proyecto demo

Validacion rapida:

- Deben existir tablas en PostgreSQL para el schema de Fase 1
- Deben sembrarse:
  - roles base
  - empresa base
  - superadmin
  - proyecto demo si `SEED_DEMO_PROJECT=true`

Si falla:

- Si aparece `P1001`, Prisma no puede conectarse a la base.
- Si aparece `P2021`, faltan tablas o la migracion no corrio bien.
- Si falla `seed`, revisa que `SUPERADMIN_ACCESS_CODE` no choque con un valor existente y que la base este accesible.
- Si `tsx prisma/seed.ts` falla por paths, confirma que se instalaron dependencias y que el proyecto se esta ejecutando desde la raiz.

### 4. Levantar el proyecto

- Ejecuta `npm run dev`
- Abre [http://localhost:3000](http://localhost:3000)
- Valida que carguen:
  - `/`
  - `/login`
  - `/register`

Si falla:

- Si aparece error de build por Tailwind o PostCSS, reinstala dependencias y revisa `tailwind.config.ts` y `postcss.config.js`.
- Si aparece error de alias `@/`, revisa `tsconfig.json`.
- Si aparece error por fuentes o `next/font`, limpia cache `.next` y vuelve a correr.

### 5. Validar login, registro, importacion y middleware

#### Login

- Usa el superadmin sembrado en `.env`
- Credenciales esperadas:
  - codigo: `SUPERADMIN_ACCESS_CODE`
  - password: `SUPERADMIN_PASSWORD`
- Resultado esperado:
  - responde `200`
  - crea cookie `orbit_nexus_session`
  - redirige a `/workspace`

Si falla:

- Si devuelve `401`, revisa password, codigo unico y que el seed haya corrido.
- Si no se crea cookie, revisa `JWT_SECRET`.

#### Registro

Cliente:

- Usa el folio definido en `DEMO_PROJECT_FOLIO`
- Resultado esperado:
  - crea usuario `CLIENT`
  - genera codigo `CLT-XXX`
  - asocia `clientUserId` al proyecto

Lider o consultor:

- Antes del registro, importa usuarios autorizados usando el endpoint admin
- Resultado esperado:
  - valida `nombre_completo` normalizado
  - valida `correo` exacto
  - genera codigo `LDR-XXX` o `CDN-XXX`

Si falla:

- Si devuelve mensaje de base autorizada, el usuario no fue importado o no coincide el dataset.
- Si devuelve error de folio, el proyecto demo no existe o el folio no coincide.
- Si devuelve conflicto por usuario ya registrado, ese correo ya fue activado.

#### Importacion de usuarios autorizados

Flujo sugerido:

1. Inicia sesion como superadmin
2. Llama `POST /api/admin/authorized-users/import`
3. Envía datasets ya parseados para `LEADER` o `CONSULTANT`

Resultado esperado:

- crea o actualiza usuarios `PENDING_REGISTRATION`
- marca `importedFromDirectory=true`
- guarda `directorySyncedAt`

Si falla:

- Si devuelve `401`, no hay sesion valida.
- Si devuelve `403`, el rol no tiene permisos o el lider intenta importar otra empresa.
- Si falla la validacion del body, revisa `companyId`, `role` y `rows`.

#### Middleware y tenant guard

Validaciones manuales:

- Abre `/workspace` sin login: debe redirigir a `/login`
- Abre `/login` con sesion activa: debe redirigir a `/workspace`
- Llama `/api/admin/authorized-users/import` sin sesion: debe responder `401`
- Llama importacion con lider de otra empresa: debe responder `403`

Si falla:

- Revisa `middleware.ts`
- Revisa que la cookie se llame `orbit_nexus_session`
- Revisa que el JWT incluya `companyId`, `role`, `accessCode` y `fullName`

## Resolucion rapida de errores

- `prisma generate` falla:
  - revisa que `schema.prisma` no tenga errores de sintaxis
  - revisa que `@prisma/client` y `prisma` esten instalados

- `migrate dev` falla:
  - valida `DATABASE_URL`
  - confirma que PostgreSQL este arriba
  - verifica permisos de creacion sobre la base

- `seed` falla:
  - revisa variables `SUPERADMIN_*`
  - revisa colisiones de `accessCode`
  - valida que las tablas ya existan

- login falla siempre:
  - confirma que el usuario este `ACTIVE`
  - confirma que `passwordHash` exista
  - vuelve a correr seed para el superadmin

- registro de lider/consultor falla siempre:
  - confirma que importaste antes el dataset autorizado
  - confirma coincidencia exacta de correo
  - confirma coincidencia de nombre normalizado

- middleware no protege rutas:
  - revisa `matcher` en `middleware.ts`
  - valida que la cookie JWT se este seteando en login

- errores de compilacion frontend:
  - elimina `.next`
  - reinstala dependencias
  - vuelve a correr `npm run dev`

## Endpoints de Fase 1

### `POST /api/auth/register`

Body:

```json
{
  "fullName": "Nombre Completo",
  "email": "correo@empresa.com",
  "phone": "+525551234567",
  "password": "Secret123!",
  "role": "LEADER",
  "projectFolio": "ORBIT-DEMO-001"
}
```

Notas:

- `projectFolio` solo es obligatorio para `CLIENT`
- `LEADER` y `CONSULTANT` requieren que el usuario exista previamente en la base autorizada importada

### `POST /api/auth/login`

Body:

```json
{
  "accessCode": "LDR-001",
  "password": "Secret123!"
}
```

### `POST /api/auth/logout`

Cierra la sesion actual y limpia la cookie JWT.

### `POST /api/admin/authorized-users/import`

Este endpoint no parsea Excel directamente. Recibe los datos ya parseados y normalizados desde otro proceso.

Body:

```json
{
  "datasets": [
    {
      "companyId": "cmp_123",
      "role": "CONSULTANT",
      "rows": [
        {
          "fullName": "Maria Lopez",
          "email": "maria@correo.com"
        }
      ]
    }
  ]
}
```

Acceso:

- `SUPERADMIN` puede importar para cualquier empresa
- `LEADER` solo puede importar para su propia empresa

## Archivos clave

- [schema Prisma](/C:/Users/Nathalie_Gar/OneDrive/Documentos/orbit-nexus-data/prisma/schema.prisma)
- [middleware](/C:/Users/Nathalie_Gar/OneDrive/Documentos/orbit-nexus-data/middleware.ts)
- [login route](/C:/Users/Nathalie_Gar/OneDrive/Documentos/orbit-nexus-data/app/api/auth/login/route.ts)
- [register route](/C:/Users/Nathalie_Gar/OneDrive/Documentos/orbit-nexus-data/app/api/auth/register/route.ts)
- [import route](/C:/Users/Nathalie_Gar/OneDrive/Documentos/orbit-nexus-data/app/api/admin/authorized-users/import/route.ts)
- [register service](/C:/Users/Nathalie_Gar/OneDrive/Documentos/orbit-nexus-data/lib/services/auth/register-user.ts)
- [login service](/C:/Users/Nathalie_Gar/OneDrive/Documentos/orbit-nexus-data/lib/services/auth/login-user.ts)
- [import service](/C:/Users/Nathalie_Gar/OneDrive/Documentos/orbit-nexus-data/lib/services/import/import-authorized-users.ts)
