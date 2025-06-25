# 🛠️ Tech Context - Fitbro

## 🚀 Stack Tecnológico Completo

### **Frontend Stack**
| Tecnología | Versión | Propósito | Estado |
|------------|---------|-----------|---------|
| **React** | 18.3.1 | Framework UI | ✅ Implementado |
| **TypeScript** | 5.6.3 | Type Safety | ✅ Implementado |
| **Vite** | 5.4.14 | Build Tool & Dev Server | ✅ Configurado |
| **TailwindCSS** | 3.4.17 | Styling Framework | ✅ Configurado |
| **Radix UI** | Latest | Headless Components | ✅ Implementado |
| **TanStack Query** | 5.60.5 | Server State Management | ✅ Implementado |
| **Wouter** | 3.3.5 | Routing | ✅ Implementado |
| **React Hook Form** | 7.55.0 | Form Management | ✅ Implementado |
| **Zod** | 3.24.2 | Schema Validation | ✅ Implementado |

### **Backend Stack**
| Tecnología | Versión | Propósito | Estado |
|------------|---------|-----------|---------|
| **Node.js** | 20.15.0 | Runtime | ✅ Implementado |
| **Express** | 4.21.2 | Web Framework | ✅ Implementado |
| **TypeScript** | 5.6.3 | Type Safety | ✅ Implementado |
| **JWT** | 9.0.2 | Authentication | ✅ Implementado |
| **bcrypt** | 6.0.0 | Password Hashing | ✅ Implementado |
| **Multer** | 2.0.0 | File Upload | ✅ Configurado |
| **Drizzle ORM** | 0.39.1 | Database ORM | ✅ Configurado |

### **Development Tools**
| Herramienta | Versión | Propósito | Estado |
|-------------|---------|-----------|---------|
| **tsx** | 4.19.1 | TypeScript Execution | ✅ Configurado |
| **esbuild** | 0.25.0 | Bundling | ✅ Configurado |
| **PostCSS** | 8.4.47 | CSS Processing | ✅ Configurado |
| **Autoprefixer** | 10.4.20 | CSS Vendor Prefixes | ✅ Configurado |

## 🗄️ Base de Datos

### **Configuración Actual**
- **Tipo:** Memory Storage (desarrollo)
- **ORM:** Drizzle ORM
- **Esquemas:** Definidos en `/shared/schema.ts`

### **Configuración Futura (PostgreSQL)**
```typescript
// drizzle.config.ts
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

### **Esquemas de Datos**
```typescript
// Principales entidades
- users           // Información de usuarios
- workoutPlans    // Planes de entrenamiento
- workoutSessions // Sesiones completadas
- meals           // Registro nutricional
- progressEntries // Seguimiento de progreso
- achievements    // Sistema de logros
```

## 🔧 Configuraciones Clave

### **Vite Configuration**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), runtimeErrorOverlay()],
  resolve: {
    alias: {
      "@": path.resolve("client", "src"),
      "@shared": path.resolve("shared"),
    },
  },
  root: path.resolve("client"),
});
```

### **TypeScript Configuration**
```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",
    "strict": true,
    "jsx": "preserve",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
```

### **TailwindCSS Configuration**
```typescript
// tailwind.config.ts
export default {
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(231 76% 66%)",
        secondary: "hsl(153 60% 53%)",
        accent: "hsl(43 96% 56%)",
      }
    }
  }
}
```

## 🔐 Autenticación y Seguridad

### **JWT Configuration**
```typescript
// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Token generation
const token = jwt.sign({ userId, username }, JWT_SECRET);

// Token validation middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  jwt.verify(token, JWT_SECRET, callback);
};
```

### **Password Security**
```typescript
// bcrypt configuration
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);
const isValid = await bcrypt.compare(password, hashedPassword);
```

## 📁 Estructura de Archivos

### **Organización del Proyecto**
```
Fitbro/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   │   ├── ui/        # Componentes base (Radix)
│   │   │   └── *.tsx      # Componentes específicos
│   │   ├── pages/         # Páginas principales
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilidades y servicios
│   │   ├── App.tsx        # Componente raíz
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Estilos globales
│   └── index.html         # Template HTML
├── server/                # Backend Express
│   ├── index.ts          # Servidor principal
│   ├── routes.ts         # Definición de rutas API
│   ├── storage.ts        # Capa de almacenamiento
│   └── vite.ts           # Configuración Vite dev
├── shared/               # Código compartido
│   └── schema.ts         # Esquemas y tipos
├── memory-bank/          # Documentación del proyecto
└── package.json          # Dependencias y scripts
```

## 🌐 APIs y Servicios Externos

### **Servicios Mock Implementados**
```typescript
// Mock AI service para análisis de fotos
const analyzeFoodImage = async (imageBuffer: Buffer) => {
  // Simulación de Google Cloud Vision API
  return {
    name: "Mixed Meal",
    calories: Math.floor(Math.random() * 400) + 200,
    protein: Math.floor(Math.random() * 30) + 15,
    // ... más datos nutricionales
  };
};
```

### **APIs Futuras a Integrar**
- **Google Cloud Vision API** - Análisis real de imágenes
- **OpenAI API** - Generación avanzada de planes
- **Nutrition APIs** - Base de datos nutricional
- **Fitness APIs** - Ejercicios y rutinas

## 🔄 Scripts de Desarrollo

### **Package.json Scripts**
```json
{
  "scripts": {
    "dev": "set NODE_ENV=development && tsx server/index.ts",
    "dev:unix": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "set NODE_ENV=production && node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

### **Variables de Entorno**
```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/fitbro
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
```

## 🚀 Deployment Configuration

### **Build Process**
1. **Frontend Build:** `vite build` → `dist/public/`
2. **Backend Build:** `esbuild` → `dist/index.js`
3. **Static Serving:** Express sirve archivos estáticos

### **Production Considerations**
- **Environment Variables** - Configurar para producción
- **Database Migration** - Migrar a PostgreSQL
- **SSL/HTTPS** - Certificados de seguridad
- **CDN** - Para assets estáticos
- **Monitoring** - Logs y métricas

## 🧪 Testing Setup (Futuro)

### **Testing Stack Propuesto**
```typescript
// Frontend Testing
- Vitest (unit tests)
- React Testing Library (component tests)
- Playwright (e2e tests)

// Backend Testing
- Jest (unit tests)
- Supertest (API tests)
```

## 📊 Performance Optimizations

### **Frontend Optimizations**
- **Code Splitting** - Lazy loading de páginas
- **Tree Shaking** - Eliminación de código no usado
- **Asset Optimization** - Compresión de imágenes y assets
- **Caching** - TanStack Query para cache de datos

### **Backend Optimizations**
- **Memory Storage** - Rápido para desarrollo
- **Middleware Optimization** - Orden eficiente de middlewares
- **Response Compression** - Gzip para respuestas

## 🔧 Development Workflow

### **Hot Module Replacement**
- Cambios instantáneos en desarrollo
- Preservación de estado de la aplicación
- Recarga automática del navegador

### **Type Checking**
- Verificación continua de tipos
- Errores detectados en tiempo de desarrollo
- IntelliSense mejorado

---
**Última Actualización:** Enero 2025  
**Responsable:** Colin (Tech Lead)  
**Estado:** 🟢 Configurado y Funcionando
