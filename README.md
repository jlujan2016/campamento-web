# 🎵 ¡Callate y baila! — Frontend

PWA (Progressive Web App) para el sistema de control de turnos de campamento. Instalable en iOS y Android sin pasar por las stores. Este repo es el frontend — la documentación completa de la API y el modelo de datos está en el repo del backend [`campamento-api`](../campamento-api/README.md).

---

## 📋 Tabla de contenidos

- [Stack](#stack)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Correr el proyecto](#correr-el-proyecto)
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
git clone https://github.com/tuusuario/campamento-web.git
cd campamento-web
npm install
cp .env.example .env
# Editar .env con la IP del backend
```

## 🔐 Variables de entorno

```env
# IP de la máquina donde corre campamento-api
# Usar IP de red local (no localhost) para poder probar desde el celular
VITE_API_URL=http://192.168.1.XXX:3000
```

> ⚠️ Después de cambiar `.env`, reiniciar `npm run dev` — Vite solo lee las variables al arrancar.

## 🚀 Correr el proyecto

```bash
npm run dev
# Local:   http://localhost:5173
# Network: http://192.168.1.XXX:5173  (accesible desde el celular en la misma WiFi)
```

---

## 📱 Pantallas implementadas

### Autenticación
| Pantalla | Ruta | Descripción |
|---|---|---|
| Login | `/login` | Ingreso con email y contraseña |
| Registro | `/register` | Creación de cuenta nueva |

### Participante
| Pantalla | Ruta | Descripción |
|---|---|---|
| Dashboard | `/` | Próximos turnos, métricas (4 indicadores), check-in/out con GPS, historial |
| Mi cronograma | `/events/:id/my-schedule` | Ver slots disponibles del evento y anotarse (selección múltiple) |
| Enlace temporal | `/s/:token` | Vista pública sin cuenta — anotarse con nombre y teléfono |

### Admin de evento
| Pantalla | Ruta | Descripción |
|---|---|---|
| Panel admin | `/admin` | Ranking oficial y lista de miembros, selector de evento |
| Detalle de evento | `/events/:id` | Menú central: Cronograma, Aprobaciones, Participantes, Configuración |
| Cronograma | `/events/:id/schedule` | Crear slots con horario/cupo, generar enlace temporal, ver ocupación |
| Aprobaciones | `/events/:id/approvals` | Aprobar/rechazar turnos extra y aportes pendientes |
| Configuración | `/events/:id/settings` | Editar reglas del evento, gestionar tipos de aporte |

### Super admin
| Pantalla | Ruta | Descripción |
|---|---|---|
| Crear evento | `/events/new` | Formulario completo: datos, GPS, reglas de turnos, turno nocturno |

> 📸 **Espacio para capturas**: a medida que pruebes cada pantalla, agregá el screenshot acá debajo de cada tabla (ver sección [Guía de testing](#guía-de-testing-con-datos-ficticios) para el flujo completo a capturar).

---

## 🔄 Flujo de uso por rol

```
SUPER ADMIN
  └── Crear evento (nombre, lugar, fechas, reglas)
       └── Queda automáticamente como admin de ese evento

ADMIN DE EVENTO
  ├── Configurar tipos de aporte (Configuración)
  ├── Crear slots del cronograma (Cronograma → Nuevo turno)
  ├── Generar enlace temporal (Cronograma → Generar enlace)
  ├── Compartir el enlace por Telegram/WhatsApp
  └── Aprobar turnos extra y aportes (Aprobaciones)

PARTICIPANTE
  ├── Unirse al evento (o entrar por el enlace temporal sin cuenta)
  ├── Ver cronograma y anotarse en slots (Mi cronograma)
  ├── Llegado el turno: hacer check-in con GPS (Dashboard)
  ├── Al terminar: hacer check-out
  └── Ver sus 4 métricas actualizadas en tiempo real
```

---

## 🧪 Guía de testing con datos ficticios

Esta guía simula un concierto completo de principio a fin, para validar todo el sistema con datos de prueba. Service ideal para hacer capturas de pantalla para este README.

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

### Paso 4 — Generar y probar el enlace temporal

Generá el enlace, copialo, y abrilo en una ventana de incógnito (simula a alguien sin cuenta):

```
Nombre: María Fan
Teléfono: 987654321
Anotarse en 2 slots
```

📸 *Captura: vista pública del enlace + confirmación de inscripción*

### Paso 5 — Crear participantes ficticios

Registrá 3-4 cuentas de prueba (podés usar el mismo password para todas):

```
Diego Rocker    → diego@test.com
Ana Festivalera → ana@test.com
Luis Camper     → luis@test.com
```

Para cada uno: login → unirse al evento → ir a "Mi cronograma" → anotarse en 2-3 slots distintos (incluyendo al menos un turno nocturno cada uno, para poder probar la métrica de turno noche).

📸 *Captura: "Mi cronograma" con varios slots elegidos*

### Paso 6 — Simular check-in/out

Con cada usuario, en su turno más próximo (podés crear un slot "ahora mismo" para probar sin esperar), hacé check-in y check-out real desde el dashboard:

```
1. Dashboard → "Hacer check-in" → permitir GPS
2. Esperar unos minutos
3. "Hacer check-out"
4. Verificar que las métricas se actualizan (horas reales)
```

📸 *Captura: dashboard mostrando "Turno en curso" y luego las métricas actualizadas*

### Paso 7 — Probar turno extra

Con un participante, intentá crear un turno extra (por ahora vía PowerShell, hasta que se construya esa vista):

```powershell
Invoke-WebRequest -Uri http://TU_IP:3000/events/EVENT_ID/shifts `
  -UseBasicParsing -Method POST `
  -ContentType "application/json" `
  -Headers @{Authorization="Bearer TOKEN_PARTICIPANTE"} `
  -Body '{
    "scheduled_start": "2026-08-02T14:00:00Z",
    "scheduled_end": "2026-08-02T17:00:00Z",
    "notes": "Tengo la tarde libre, voy a ayudar"
  }' | Select-Object -ExpandProperty Content
```

Como admin: Aprobaciones → pestaña "Turnos extra" → Aprobar.

📸 *Captura: panel de aprobaciones con el turno extra pendiente, y luego aprobado*

### Paso 8 — Probar aportes

Vía PowerShell, registrá un aporte para un participante:

```powershell
Invoke-WebRequest -Uri http://TU_IP:3000/events/EVENT_ID/contributions `
  -UseBasicParsing -Method POST `
  -ContentType "application/json" `
  -Headers @{Authorization="Bearer TOKEN_PARTICIPANTE"} `
  -Body '{
    "contribution_type_id": "ID_DEL_TIPO_CARPA",
    "description": "Carpa para 4 personas"
  }' | Select-Object -ExpandProperty Content
```

Como admin: Aprobaciones → pestaña "Aportes" → Aprobar.

📸 *Captura: aporte pendiente y luego aprobado, ver el bono reflejado en métricas*

### Paso 9 — Revisar el ranking final

Con varios participantes con horas y aportes distintos, andá a:

```
Panel admin → Ranking
```

Verificá que el orden tiene sentido (mayor `hours_total` primero) y que el ícono de mínimo cumplido/no cumplido se ve correctamente.

📸 *Captura: ranking con varios participantes, distintas posiciones*

### Paso 10 — Probar retiro de participante

Como admin, retirá a uno de los participantes ficticios (vía PowerShell por ahora):

```powershell
Invoke-WebRequest -Uri http://TU_IP:3000/events/EVENT_ID/members/USER_ID/withdraw `
  -UseBasicParsing -Method POST `
  -Headers @{Authorization="Bearer TOKEN_ADMIN"} |
  Select-Object -ExpandProperty Content
```

Verificá en Telegram que llega la notificación de "huecos liberados", y en Cronograma que el slot recuperó su cupo.

📸 *Captura: notificación de Telegram + cronograma con el cupo liberado*

---

## 📁 Estructura del proyecto

```
campamento-web/
├── public/
│   └── manifest.json              # Configuración PWA
├── src/
│   ├── api/
│   │   ├── client.ts              # Cliente HTTP base, agrega JWT automático
│   │   ├── auth.ts
│   │   ├── events.ts
│   │   ├── shifts.ts
│   │   └── admin.ts                # CRUD de eventos, slots, aprobaciones, config
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── CheckinButton.tsx
│   │   ├── MetricsCard.tsx
│   │   ├── ShiftCard.tsx
│   │   ├── SlotPicker.tsx          # Reutilizado en cronograma propio y enlace público
│   │   ├── CreateSlotModal.tsx
│   │   └── ContributionTypeModal.tsx
│   ├── hooks/
│   │   └── useAuth.ts              # Context + hook de autenticación
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx       # Home del participante
│   │   ├── AdminPage.tsx           # Ranking + miembros
│   │   ├── CreateEventPage.tsx     # Solo super admin
│   │   ├── EventDetailPage.tsx     # Menú del admin de evento
│   │   ├── SchedulePage.tsx        # Cronograma (admin)
│   │   ├── MyScheduleePage.tsx     # Cronograma (participante)
│   │   ├── ApprovalsPage.tsx       # Turnos extra + aportes pendientes
│   │   ├── SettingsPage.tsx        # Reglas + tipos de aporte
│   │   └── ScheduleLinkPage.tsx    # Enlace público sin cuenta
│   ├── types/
│   │   └── index.ts                # Tipos TypeScript de la API
│   ├── main.tsx                    # Rutas
│   └── index.css                   # Tailwind + clases globales (.card, .btn-primary, etc)
├── vite.config.ts
├── .env.example
└── .gitignore
```

---

## 📲 PWA — Instalar en el celular

> El celular y la PC que corre el frontend (`npm run dev`) deben estar en la **misma red WiFi**. El backend puede estar en otra máquina de la red, eso no afecta el acceso desde el celular — solo importa la URL del frontend.

**Android (Chrome)**
1. Abrir `http://IP_DEL_FRONTEND:5173` (la IP que muestra Vite como "Network" al correr `npm run dev`)
2. Menú (⋮) → "Agregar a pantalla de inicio"

**iOS (Safari)**
1. Abrir `http://IP_DEL_FRONTEND:5173`
2. Botón compartir → "Agregar a pantalla de inicio"

---

## 🗺️ Pendientes

- [ ] Registrar aporte desde la app (sin PowerShell)
- [ ] Solicitar turno extra desde la app (sin PowerShell)
- [ ] Vista de detalle de un slot (ver quién más está anotado)
- [ ] Solicitar/confirmar reemplazo desde la app
- [ ] Vista del tramo final (registrar presencia)
- [ ] Subida de foto en check-in/out
- [ ] Adaptación a escritorio (breakpoints `md:` de Tailwind)
- [ ] Indicador visual de notificaciones no leídas

---

## 🔗 Repos relacionados

- Backend (API en Rust): [`campamento-api`](../campamento-api) — documentación completa de endpoints, modelo de datos y arquitectura
