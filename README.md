# 🎵 ¡Callate y baila! — Frontend

PWA (Progressive Web App) para el sistema de control de turnos de campamento. Instalable en iOS y Android sin pasar por las stores. **En producción en [https://appconcert.online](https://appconcert.online)** vía Cloudflare Tunnel.

Este repo es el frontend — la documentación de la API, el modelo de datos y la guía de despliegue están en el repo del backend [`campamento-api`](../campamento-api/README.md) y su [`DESPLIEGUE.md`](../campamento-api/DESPLIEGUE.md).

---

## 📋 Tabla de contenidos

- [Stack](#stack)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Correr el proyecto](#correr-el-proyecto)
- [Desarrollo vs producción](#desarrollo-vs-producción)
- [Pantallas implementadas](#pantallas-implementadas)
- [Flujo de uso por rol](#flujo-de-uso-por-rol)
- [Guía de testing con datos ficticios](#guía-de-testing-con-datos-ficticios)
- [Estructura del proyecto](#estructura-del-proyecto)
- [PWA — instalar en el celular](#pwa--instalar-en-el-celular)
- [Pendientes](#pendientes)

---

## 🛠️ Stack

| Tecnología | Rol |
|---|---|
| React 18 + TypeScript | Framework UI |
| Vite | Bundler y dev server |
| Tailwind CSS v4 | Estilos (`@tailwindcss/vite`) |
| React Router v6 | Navegación |
| TanStack Query | Estado del servidor |
| date-fns | Formateo de fechas |
| lucide-react | Iconos |

---

## ⚙️ Instalación

```bash
git clone https://github.com/jlujan2016/campamento-web.git
cd campamento-web
npm install
cp .env.example .env    # Windows: copy .env.example .env
```

## 🔐 Variables de entorno

```env
# URL base de la API
# /api = relativa (recomendada) — el proxy de Vite la redirige al backend en dev,
#        y en producción el backend Axum la sirve desde el mismo origen
VITE_API_URL=/api

# Puerto del servidor de desarrollo Vite
VITE_PORT=5174

# URL del backend para el proxy de Vite (solo desarrollo)
VITE_BACKEND_URL=http://localhost:8090
```

> ⚠️ Después de cambiar `.env`, reiniciar `npm run dev` — Vite solo lee las variables al arrancar. Las variables `VITE_*` se resuelven en **tiempo de compilación**: quedan quemadas dentro del build (`npm run build`), por eso `/api` relativa es portable y una URL absoluta no.

## 🚀 Correr el proyecto

```bash
npm run dev
# Local:   http://localhost:5174
# Network: http://192.168.X.X:5174  (accesible desde el celular en la misma WiFi)
```

El backend (`campamento-api`) debe estar corriendo en `:8090` — el proxy de Vite redirige `/api/*` hacia él.

---

## 🔀 Desarrollo vs producción

| | Desarrollo | Producción |
|---|---|---|
| Frontend | Vite en `:5174` (`npm run dev`) | Compilado (`npm run build`), servido por Axum |
| Backend | `cargo run` en `:8090` (solo API) | `cargo run` en `:8090` (API + frontend) |
| CORS backend | `CORS_ORIGINS=http://localhost:5174,...` | `CORS_ORIGINS=` (vacío, mismo origen) |
| `FRONTEND_DIST` backend | comentado | `C:/Users/.../campamento-web/dist` |
| URL | `http://localhost:5174` | `https://appconcert.online` |

**Para llevar cambios del frontend a producción:**
```bash
npm run build          # regenera dist/
# reiniciar cargo run en el backend (sirve el dist/ nuevo automáticamente)
```

---

## 📱 Pantallas implementadas

### Autenticación
| Pantalla | Ruta | Descripción |
|---|---|---|
| Login | `/login` | Ingreso con email y contraseña (rechaza usuarios bloqueados) |
| Registro | `/register` | Creación de cuenta nueva |

### Participante
| Pantalla | Ruta | Descripción |
|---|---|---|
| Dashboard | `/` | Próximos turnos, métricas (4 indicadores), check-in/out con GPS, historial, accesos a cronograma/aporte/turno extra |
| Mi cronograma | `/events/:id/my-schedule` | Ver slots disponibles del evento y anotarse (selección múltiple) |
| Registrar aporte | `/events/:id/contribute` | Elegir tipo de aporte configurado (carpa, colchón...) con descripción opcional |
| Turno extra | `/events/:id/extra-shift` | Solicitar turno espontáneo fuera del cronograma (queda pendiente de aprobación) |
| Enlace temporal | `/s/:token` | Vista pública — anotarse **creando cuenta completa** (email+contraseña, auto-login al dashboard) o solo como invitado (nombre+teléfono) |

### Admin de evento
| Pantalla | Ruta | Descripción |
|---|---|---|
| Panel admin | `/admin` | Ranking oficial y lista de miembros con promoción/degradación de admins, selector de evento |
| Detalle de evento | `/events/:id` | Menú central: Cronograma, Aprobaciones, Participantes, Configuración |
| Cronograma | `/events/:id/schedule` | Crear slots con horario/cupo, generar enlace temporal, ver ocupación |
| Aprobaciones | `/events/:id/approvals` | Aprobar/rechazar turnos extra y aportes pendientes |
| Configuración | `/events/:id/settings` | Editar reglas del evento, gestionar tipos de aporte |

### Super admin
| Pantalla | Ruta | Descripción |
|---|---|---|
| Crear evento | `/events/new` | Formulario completo: datos, GPS, reglas de turnos, turno nocturno |
| Gestión de usuarios | `/users` | Lista con búsqueda (debounce), crear usuario (participante o super admin), bloquear/desbloquear, eliminar con confirmación |
| Promover/degradar admin | `/admin` → Miembros | Botones de escudo para asignar o quitar rol de admin de evento |

> 📸 **Espacio para capturas**: a medida que pruebes cada pantalla, agregá el screenshot debajo de cada tabla (ver [Guía de testing](#guía-de-testing-con-datos-ficticios) para el flujo completo a capturar).

---

## 🔄 Flujo de uso por rol

```
SUPER ADMIN
  ├── Crear evento (nombre, lugar, fechas, reglas)
  │    └── Queda automáticamente como admin de ese evento
  ├── Crear usuarios (participantes o super admins) desde /users
  ├── Bloquear / eliminar usuarios
  └── Promover participantes a admin de evento (y degradarlos)

ADMIN DE EVENTO
  ├── Configurar tipos de aporte (Configuración)
  ├── Crear slots del cronograma (Cronograma → Nuevo turno)
  ├── Generar enlace temporal (Cronograma → Generar enlace)
  ├── Compartir el enlace por Telegram/WhatsApp
  └── Aprobar turnos extra y aportes (Aprobaciones)

PARTICIPANTE
  ├── Entrar por el enlace temporal:
  │    ├── CON cuenta nueva (email+contraseña) → auto-login al dashboard
  │    └── Solo invitado (nombre+teléfono) → sin acceso a la app
  ├── Ver cronograma y anotarse en slots (Mi cronograma)
  ├── Registrar aportes y solicitar turnos extra
  ├── Llegado el turno: check-in con GPS (Dashboard)
  ├── Al terminar: check-out
  └── Ver sus 4 métricas actualizadas en tiempo real
```

---

## 🧪 Guía de testing con datos ficticios

Esta guía simula un concierto completo de principio a fin, para validar todo el sistema con datos de prueba. Ideal para hacer las capturas de pantalla de este README. Podés correrla en desarrollo (`localhost:5174`) o directamente en producción (`appconcert.online`).

### Paso 1 — Crear el concierto ficticio

Logueate con tu cuenta de super admin y creá un evento de prueba:

```
Nombre: Arctic Monkeys - Lima 2026
Lugar: Estadio San Marcos
Fechas: dentro de 1 mes, duración de campamento de 5 días
Mín. horas/turno: 2
Tolerancia tardanza: 15 min
Mín. horas totales: 10
Turno nocturno: 00:00 - 06:00, obligatorio
```

📸 *Captura: pantalla de creación de evento completada*

### Paso 2 — Configurar tipos de aporte

Desde Configuración, creá estos 4 tipos:

```
Carpa          → 5h
Colchón        → 2h
Comida grupal  → 3h
Pasaje         → 1h
```

📸 *Captura: lista de tipos de aporte*

### Paso 3 — Crear el cronograma

Desde Cronograma, creá 6-8 slots distribuidos en los 5 días, variando horarios y cupos:

```
Día 1, 18:00-21:00, cupo 3
Día 1, 21:00-00:00, cupo 2
Día 2, 00:00-03:00, cupo 2   ← turno nocturno
Día 2, 03:00-06:00, cupo 2   ← turno nocturno
Día 2, 09:00-12:00, cupo 3
Día 3, 15:00-18:00, cupo 3
Día 4, 22:00-01:00, cupo 2   ← turno nocturno
Día 5, 08:00-11:00, cupo 4
```

📸 *Captura: cronograma completo con barras de ocupación*

### Paso 4 — Probar el enlace temporal (con cuenta y sin cuenta)

Generá el enlace, copialo, y abrilo en ventana de incógnito. Probá los dos caminos:

**4a. Con cuenta nueva (Enfoque completo):**
```
Nombre: María Fan
Teléfono: 987654321
Toggle "Crear cuenta" ACTIVADO
Email: maria@test.com / Contraseña: 12345678
Anotarse en 2 slots
→ Verificar: crea la cuenta, redirige al dashboard YA LOGUEADA,
  y los turnos aparecen en "Tus próximos turnos"
```

**4b. Solo invitado:**
```
Nombre: Pedro Invitado / Teléfono: 999888777
Toggle "Crear cuenta" DESACTIVADO
Anotarse en 1 slot
→ Verificar: pantalla de éxito sin redirección
```

📸 *Captura: formulario del enlace con toggle de cuenta + dashboard post auto-login*

### Paso 5 — Crear participantes desde gestión de usuarios

Como super admin, andá a `/users` (botón "Usuarios" en el panel admin) y creá:

```
Diego Rocker    → diego@test.com
Ana Festivalera → ana@test.com
```

Verificá también el buscador (escribí "die" y esperá el filtrado).

Para cada uno: login en incógnito → unirse al evento → "Mi cronograma" → anotarse en 2-3 slots (incluyendo al menos un turno nocturno).

📸 *Captura: pantalla de gestión de usuarios con la lista y el buscador*

### Paso 6 — Probar bloqueo de usuario

```
1. /users → bloquear a Diego (candado ámbar) → badge "Bloqueado"
2. Incógnito → login diego@test.com → debe rechazar:
   "Tu cuenta ha sido bloqueada..."
3. Desbloquear (candado verde) → login funciona de nuevo
```

📸 *Captura: usuario bloqueado en la lista + mensaje de rechazo en login*

### Paso 7 — Promover un participante a admin

```
1. Panel admin → Miembros → escudo morado junto a Ana
2. Toast de confirmación → su badge pasa a "Admin"
3. Login como Ana → verificar que ve "Gestionar →" y las opciones de admin
4. Degradarla con el escudo tachado gris → vuelve a "Participante"
```

📸 *Captura: lista de miembros con los botones de escudo*

### Paso 8 — Simular check-in/out

Con cada usuario, en su turno más próximo (podés crear un slot "ahora mismo" para no esperar), hacé check-in y check-out desde el dashboard:

```
1. Dashboard → "Hacer check-in" → permitir GPS
   (en producción HTTPS el GPS funciona también en iOS)
2. Esperar unos minutos
3. "Hacer check-out"
4. Verificar que las métricas se actualizan (horas reales)
```

> 💡 El GPS registra la ubicación del **dispositivo del usuario**, no del servidor. Podés verificarlo pegando las coordenadas guardadas en Google Maps.

📸 *Captura: dashboard con "Turno en curso" y métricas actualizadas*

### Paso 9 — Turno extra desde la app

Como participante:

```
Dashboard → "Solicitar turno extra" → elegir horario
(el fin se autocompleta con el mínimo del evento) → confirmar
```

Como admin: Aprobaciones → pestaña "Turnos extra" → Aprobar.
Verificar que el participante puede hacer check-in en ese turno.

📸 *Captura: formulario de turno extra + panel de aprobaciones*

### Paso 10 — Aporte desde la app

Como participante:

```
Dashboard → "Registrar un aporte" → elegir "Carpa" (+5h)
→ descripción: "Carpa para 4 personas" → confirmar
```

Como admin: Aprobaciones → pestaña "Aportes" → Aprobar.
Verificar en el dashboard del participante que `Aportes: +5.0h` y el total oficial subió.

📸 *Captura: selección de aporte + métricas con el bono reflejado*

### Paso 11 — Revisar el ranking final

Con varios participantes con horas y aportes distintos:

```
Panel admin → Ranking
```

Verificá el orden (mayor `hours_total` primero), las medallas de posición, y los íconos de mínimo cumplido / turno noche.

📸 *Captura: ranking con varios participantes*

### Paso 12 — Probar retiro de participante

Como admin, retirá a un participante ficticio (vía PowerShell por ahora):

```powershell
Invoke-WebRequest -Uri https://appconcert.online/api/events/EVENT_ID/members/USER_ID/withdraw `
  -UseBasicParsing -Method POST `
  -Headers @{Authorization="Bearer TOKEN_ADMIN"} |
  Select-Object -ExpandProperty Content
```

Verificá en Telegram la notificación de "turnos liberados" y en Cronograma que el cupo se recuperó.

📸 *Captura: notificación de Telegram + cronograma con cupo liberado*

---

## 📁 Estructura del proyecto

```
campamento-web/
├── public/
│   └── manifest.json              # Configuración PWA
├── src/
│   ├── api/
│   │   ├── client.ts              # Cliente HTTP base (URL /api relativa, JWT automático)
│   │   ├── auth.ts
│   │   ├── events.ts
│   │   ├── shifts.ts
│   │   └── admin.ts               # Eventos, slots, aprobaciones, config, usuarios
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── CheckinButton.tsx      # Check-in/out con GPS (fallback si no hay HTTPS)
│   │   ├── MetricsCard.tsx
│   │   ├── ShiftCard.tsx
│   │   ├── SlotPicker.tsx         # Reutilizado en cronograma propio y enlace público
│   │   ├── CreateSlotModal.tsx
│   │   ├── ContributionTypeModal.tsx
│   │   └── CreateUserModal.tsx    # Crear usuario desde gestión
│   ├── hooks/
│   │   └── useAuth.ts             # Context de auth + setTokenAndReload (auto-login)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx      # Home del participante
│   │   ├── AdminPage.tsx          # Ranking + miembros + promover/degradar admin
│   │   ├── UsersPage.tsx          # Gestión de usuarios (super admin)
│   │   ├── CreateEventPage.tsx
│   │   ├── EventDetailPage.tsx
│   │   ├── SchedulePage.tsx       # Cronograma (admin)
│   │   ├── MyScheduleePage.tsx    # Cronograma (participante)
│   │   ├── ApprovalsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── RegisterContributionPage.tsx
│   │   ├── CreateExtraShiftPage.tsx
│   │   └── ScheduleLinkPage.tsx   # Enlace público (crea cuenta o invitado)
│   ├── types/
│   │   └── index.ts
│   ├── main.tsx                   # Rutas
│   └── index.css                  # Tailwind + clases globales
├── vite.config.ts                 # Puerto 5174, host, proxy /api → :8090
├── .env.example
└── .gitignore
```

---

## 📲 PWA — Instalar en el celular

**En producción** (recomendado — HTTPS habilita GPS en iOS):

1. Abrir `https://appconcert.online` en el celular
2. Android/Chrome: menú (⋮) → "Agregar a pantalla de inicio"
3. iOS/Safari: botón compartir → "Agregar a pantalla de inicio"

**En desarrollo** (misma red WiFi que la PC con Vite):

1. Abrir `http://IP_DEL_FRONTEND:5174` (la IP "Network" que muestra Vite)
2. Mismos pasos de instalación
3. ⚠️ En iOS con HTTP el GPS no funciona (requiere HTTPS) — usar producción para probar GPS en iPhone

---

## 🗺️ Pendientes

- [ ] Botón "calcular sugerencia" para el mínimo de horas totales (backend + frontend)
- [ ] Retirar participante desde la app (hoy vía API)
- [ ] Solicitar/confirmar reemplazo desde la app
- [ ] Vista del tramo final (registrar presencia)
- [ ] Subida de foto en check-in/out
- [ ] Fondo animado Three.js en el login (rama `feat/login-concert-background`)
- [ ] Adaptación a escritorio (breakpoints `md:` de Tailwind)
- [ ] Apps nativas iOS/Android (Capacitor) + landing page

---

## 🔗 Repos relacionados

- Backend (API en Rust): [`campamento-api`](../campamento-api) — endpoints, modelo de datos, arquitectura y [guía de despliegue](../campamento-api/DESPLIEGUE.md) con Cloudflare Tunnel
