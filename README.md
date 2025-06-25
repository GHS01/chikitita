# 🏋️‍♂️ Fitbro

Una aplicación web de fitness que ofrece planes de entrenamiento y nutrición personalizados, análisis de alimentos a través de fotos y seguimiento en tiempo real del progreso.

## 🚀 Características Principales

### 💪 Planes de Entrenamiento Personalizados
- Generación automática de rutinas basadas en objetivos del usuario
- Adaptación dinámica según el progreso
- Planes para diferentes niveles: principiante, intermedio, avanzado
- Seguimiento de sesiones de entrenamiento

### 🍎 Análisis Nutricional Inteligente
- Análisis de fotos de alimentos (mock implementation)
- Cálculo automático de macronutrientes y calorías
- Registro manual de comidas
- Seguimiento de objetivos nutricionales diarios

### 📊 Seguimiento de Progreso
- Registro de peso y medidas corporales
- Historial de entrenamientos completados
- Sistema de logros y recompensas
- Gráficos y estadísticas visuales

### 🏥 Sistema de Monitoreo de Salud
- Monitoreo en tiempo real del sistema
- Métricas de rendimiento y disponibilidad
- Dashboard de salud de servicios
- Alertas automáticas de estado

### 🎯 Dashboard Interactivo
- Resumen diario de calorías y macronutrientes
- Progreso semanal de entrenamientos
- Estadísticas de racha de entrenamientos
- Vista general del plan activo

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Vite** para desarrollo y build
- **TailwindCSS** para estilos
- **Radix UI** para componentes
- **TanStack Query** para gestión de estado
- **Wouter** para routing
- **React Hook Form** para formularios

### Backend
- **Node.js** con Express
- **TypeScript** para type safety
- **JWT** para autenticación
- **bcrypt** para hash de contraseñas
- **Multer** para upload de archivos
- **Drizzle ORM** (configurado para PostgreSQL)

### Base de Datos
- Actualmente: **Almacenamiento en memoria** (para desarrollo)
- Configurado para: **PostgreSQL** con Drizzle ORM

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd Fitbro
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# El archivo .env ya está creado con valores por defecto
# Editar si es necesario para producción
```

4. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

5. **Abrir en el navegador**
```
http://localhost:5000
```

## 📝 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo (Windows)
- `npm run dev:unix` - Ejecutar en modo desarrollo (Unix/Linux/Mac)
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en modo producción (Windows)
- `npm run start:unix` - Ejecutar en modo producción (Unix/Linux/Mac)
- `npm run check` - Verificar tipos TypeScript
- `npm run db:push` - Sincronizar esquema de base de datos

## 🏗️ Estructura del Proyecto

```
Fitbro/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilidades y configuración
│   │   └── App.tsx        # Componente principal
│   └── index.html         # Template HTML
├── server/                # Backend Express
│   ├── index.ts          # Servidor principal
│   ├── routes.ts         # Rutas de la API
│   ├── storage.ts        # Capa de almacenamiento
│   └── vite.ts           # Configuración de Vite
├── shared/               # Código compartido
│   └── schema.ts         # Esquemas y tipos
└── package.json          # Dependencias y scripts
```

## 🔐 Autenticación

La aplicación utiliza JWT para autenticación:
- Registro de nuevos usuarios
- Login con username/password
- Tokens almacenados en localStorage
- Middleware de autenticación en rutas protegidas

## 📱 Funcionalidades por Página

### 🏠 Dashboard
- Resumen de estadísticas diarias
- Plan de entrenamiento activo
- Progreso de macronutrientes
- Racha de entrenamientos

### 💪 Entrenamientos
- Lista de planes disponibles
- Generación de nuevos planes
- Inicio de sesiones de entrenamiento
- Historial de entrenamientos

### 🍽️ Nutrición
- Registro de comidas
- Análisis de fotos (mock)
- Seguimiento de macronutrientes
- Historial nutricional

### 📈 Progreso
- Gráficos de peso y medidas
- Registro de nuevas medidas
- Historial de progreso
- Sistema de logros

## 🔮 Futuras Mejoras

- [ ] Integración real con Google Cloud Vision API
- [ ] Base de datos PostgreSQL en producción
- [ ] Notificaciones push
- [ ] Modo offline
- [ ] Integración con wearables
- [ ] Planes de nutrición personalizados
- [ ] Comunidad y social features
- [ ] Aplicación móvil nativa

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Agradecimientos

- Inspirado en Fitbro
- Construido con tecnologías modernas de React y Node.js
- UI components por Radix UI
- Iconos por Lucide React
