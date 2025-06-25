# 📸🔔 Sistema de Fotos de Perfil y Notificaciones - Fitbro

## Resumen de Implementación

Se ha implementado un sistema completo de **fotos de perfil** y **notificaciones** para mejorar la experiencia del usuario en Fitbro.

---

## 📸 Sistema de Fotos de Perfil

### Características Implementadas

✅ **Subida de Fotos**
- Soporte para JPEG, PNG, WebP
- Límite de 5MB por archivo
- Validación de tipo y tamaño
- Almacenamiento local en `/uploads/profiles/`

✅ **Gestión de Fotos**
- Reemplazo automático de fotos existentes
- Eliminación de archivos antiguos
- URLs optimizadas con cache
- Integración con avatar en navegación

✅ **Componentes Frontend**
- `ProfilePhotoUpload`: Componente de carga con preview
- `useProfilePhoto`: Hook para gestión de estado
- Integración en página de perfil
- Avatar actualizado en navegación

### Estructura de Base de Datos

```sql
CREATE TABLE profile_photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    photo_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

- `GET /api/profile/photo` - Obtener foto de perfil
- `POST /api/profile/photo` - Subir/actualizar foto
- `DELETE /api/profile/photo` - Eliminar foto

---

## 🔔 Sistema de Notificaciones

### Tipos de Notificaciones

🏋️ **Entrenamiento**
- Recordatorios de rutina diaria
- Rutina completada
- Rachas de entrenamientos
- Nueva rutina generada

🥗 **Nutrición**
- Plan alimenticio generado
- Recordatorios de comidas
- Meta de agua alcanzada
- Configuración nutricional pendiente

📊 **Progreso**
- Nuevo logro desbloqueado
- Meta de peso alcanzada
- Progreso semanal
- Recordatorio de medición

🤖 **AI Trainer**
- Mensaje del entrenador
- Configuración pendiente
- Análisis emocional

⚙️ **Sistema**
- Perfil incompleto
- Notificación de bienvenida
- Actualizaciones disponibles

### Estructura de Base de Datos

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'workout', 'nutrition', 'progress', 'ai_trainer', 'system'
    category TEXT NOT NULL, -- 'reminder', 'achievement', 'update', 'alert'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    icon TEXT, -- emoji o nombre de icono
    action_url TEXT, -- enlace opcional
    action_label TEXT, -- texto del botón de acción
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB, -- datos adicionales
    expires_at TIMESTAMP, -- expiración opcional
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);
```

### Componentes Frontend

✅ **NotificationCenter**
- Dropdown con lista de notificaciones
- Contador de no leídas
- Acciones: marcar como leída, eliminar
- Filtros por tipo y prioridad

✅ **useNotifications Hook**
- Gestión de estado de notificaciones
- Operaciones CRUD
- Conteo de no leídas
- Filtros y utilidades

✅ **NotificationTestPanel**
- Panel de pruebas para desarrolladores
- Creación de notificaciones de ejemplo
- Diferentes tipos y prioridades

### API Endpoints

- `GET /api/notifications` - Listar notificaciones
- `GET /api/notifications/unread-count` - Contador de no leídas
- `POST /api/notifications` - Crear notificación
- `PATCH /api/notifications/:id/read` - Marcar como leída
- `PATCH /api/notifications/read-all` - Marcar todas como leídas
- `DELETE /api/notifications/:id` - Eliminar notificación

### Servicio de Notificaciones

✅ **NotificationService**
- Métodos para crear notificaciones automáticas
- Integración con eventos del sistema
- Limpieza de notificaciones expiradas

```typescript
// Ejemplos de uso
await notificationService.createWorkoutReminder(userId);
await notificationService.createWorkoutCompleted(userId, workoutName);
await notificationService.createWaterGoalReached(userId);
await notificationService.createWeightGoalProgress(userId, 75, 'lose_weight');
```

---

## 🚀 Cómo Usar

### Para Desarrolladores

1. **Probar Notificaciones**
   ```
   Visita: /notification-test
   ```

2. **Crear Notificaciones Programáticamente**
   ```typescript
   import { notificationService } from '@/server/services/notificationService';
   
   await notificationService.createWorkoutCompleted(userId, 'Rutina de Pecho');
   ```

3. **Usar Hook de Notificaciones**
   ```typescript
   const { notifications, unreadCount, markAsRead } = useNotifications();
   ```

### Para Usuarios

1. **Subir Foto de Perfil**
   - Ir a Perfil → Hacer clic en avatar → Subir foto

2. **Ver Notificaciones**
   - Hacer clic en el icono de campana en la navegación
   - Ver contador de notificaciones no leídas

3. **Gestionar Notificaciones**
   - Marcar como leída individualmente
   - Marcar todas como leídas
   - Eliminar notificaciones

---

## 🔧 Configuración Técnica

### Variables de Entorno
```env
# Ya configuradas en el proyecto existente
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### Migración de Base de Datos
```bash
# Ejecutar migración SQL
psql -d your_database -f server/migrations/add_profile_photos_and_notifications.sql
```

### Estructura de Archivos
```
server/
├── services/
│   └── notificationService.ts
├── migrations/
│   └── add_profile_photos_and_notifications.sql
└── supabaseStorage.ts (actualizado)

client/src/
├── components/
│   ├── ProfilePhotoUpload.tsx
│   ├── NotificationCenter.tsx
│   └── NotificationTestPanel.tsx
├── hooks/
│   ├── useProfilePhoto.ts
│   └── useNotifications.ts
└── pages/
    └── NotificationTest.tsx
```

---

## 🎯 Próximos Pasos

### Mejoras Sugeridas

1. **Notificaciones Push**
   - Integrar con service workers
   - Notificaciones del navegador

2. **Notificaciones por Email**
   - Resúmenes semanales
   - Recordatorios importantes

3. **Configuración de Notificaciones**
   - Permitir al usuario elegir tipos
   - Horarios personalizados

4. **Analytics de Notificaciones**
   - Tasas de apertura
   - Efectividad por tipo

5. **Notificaciones Inteligentes**
   - Basadas en comportamiento del usuario
   - Machine learning para personalización

---

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Fotos no se cargan**
   - Verificar permisos de carpeta `/uploads`
   - Comprobar límites de tamaño

2. **Notificaciones no aparecen**
   - Verificar conexión a base de datos
   - Revisar logs del servidor

3. **Contador incorrecto**
   - Refrescar datos con `refetch()`
   - Verificar invalidación de cache

### Logs Útiles
```bash
# Ver logs de subida de archivos
tail -f server.log | grep "profile/photo"

# Ver logs de notificaciones
tail -f server.log | grep "notifications"
```

---

## 📊 Métricas de Éxito

- ✅ Sistema de fotos de perfil funcional
- ✅ 6 tipos de notificaciones implementados
- ✅ Centro de notificaciones interactivo
- ✅ API completa con todas las operaciones
- ✅ Componentes reutilizables
- ✅ Documentación completa
- ✅ Panel de pruebas para desarrollo

**Estado: ✅ COMPLETADO**
