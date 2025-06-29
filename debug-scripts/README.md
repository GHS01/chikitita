# 🔧 Scripts de Diagnóstico y Corrección - FitnessPro

## 📋 Descripción

Estos scripts te ayudan a diagnosticar y corregir problemas con la generación automática de rutinas en FitnessPro.

## 🚨 Problema Identificado

El sistema está generando rutinas en días de descanso debido a:
1. **Datos corruptos** en `user_split_assignments`
2. **Cache corrupto** en `pre_generated_workouts`
3. **Asignaciones incorrectas** de splits por día

## 🔧 Scripts Disponibles

### 1. 🔍 Diagnóstico de Asignaciones
```bash
cd server
node ../debug-scripts/diagnose-split-assignments.js
```

**Qué hace:**
- ✅ Muestra todas las asignaciones de splits por día
- ✅ Identifica días de descanso vs días de entrenamiento
- ✅ Verifica cache actual
- ✅ Detecta inconsistencias automáticamente

### 2. 🔧 Corrección de Datos Corruptos
```bash
cd server
node ../debug-scripts/fix-corrupted-data.js
```

**Qué hace:**
- ✅ Elimina rutinas en cache para días sin asignación
- ✅ Mantiene rutinas válidas
- ✅ Proporciona reporte detallado

### 3. ⏰ Verificación de Cron Jobs
```bash
cd server
node ../debug-scripts/check-cron-status.js
```

**Qué hace:**
- ✅ Verifica si los cron jobs están funcionando
- ✅ Muestra rutinas generadas recientemente
- ✅ Identifica problemas en la generación automática

## 📋 Proceso de Corrección Recomendado

### PASO 1: Diagnóstico
```bash
cd server
node ../debug-scripts/diagnose-split-assignments.js
```
- Ejecuta este script para ver exactamente qué está mal
- Identifica qué días tienen asignaciones incorrectas

### PASO 2: Corrección
```bash
cd server
node ../debug-scripts/fix-corrupted-data.js
```
- Limpia automáticamente las rutinas corruptas
- Mantiene solo las rutinas válidas

### PASO 3: Verificación
```bash
cd server
node ../debug-scripts/check-cron-status.js
```
- Verifica que el sistema esté funcionando correctamente
- Confirma que no hay más problemas

### PASO 4: Configuración Manual
1. Ve a la app de FitnessPro
2. Accede a la configuración de splits
3. Verifica que:
   - **Domingo**: NO tenga asignación (día de descanso)
   - **Sábado**: Tenga asignado "Pull" (no "Push")
   - Los demás días tengan las asignaciones correctas

## 🚨 Problemas Comunes y Soluciones

### Problema: "Rutinas en días de descanso"
**Causa:** Cache corrupto con rutinas para días sin asignación
**Solución:** Ejecutar `fix-corrupted-data.js`

### Problema: "Músculos incorrectos en rutina"
**Causa:** Asignación de split incorrecta en la base de datos
**Solución:** Corregir asignaciones en la app + limpiar cache

### Problema: "No se generan rutinas automáticamente"
**Causa:** Cron jobs no funcionando o no hay usuarios activos
**Solución:** Verificar con `check-cron-status.js`

## 📊 Interpretación de Resultados

### ✅ Estado Normal
```
✅ Lunes: Push (chest, shoulders, triceps)
✅ Martes: Pull (back, biceps)
✅ Miércoles: Legs (legs, glutes, calves)
🛌 Jueves: DÍA DE DESCANSO
✅ Viernes: Push (chest, shoulders, triceps)
🛌 Sábado: DÍA DE DESCANSO
🛌 Domingo: DÍA DE DESCANSO
```

### ❌ Estado Problemático
```
✅ Lunes: Push (chest, shoulders, triceps)
✅ Martes: Pull (back, biceps)
✅ Miércoles: Legs (legs, glutes, calves)
🛌 Jueves: DÍA DE DESCANSO
✅ Viernes: Push (chest, shoulders, triceps)
❌ Sábado: Push (chest, shoulders, triceps) ← DEBERÍA SER PULL
❌ Domingo: Legs (legs, glutes, calves) ← DEBERÍA SER DESCANSO
```

## 🔄 Regeneración Automática

Después de corregir los datos:
1. El sistema regenerará automáticamente las rutinas correctas
2. Los cron jobs funcionarán con los datos corregidos
3. No se generarán más rutinas para días de descanso

## 📞 Soporte

Si los scripts no resuelven el problema:
1. Ejecuta todos los scripts y guarda los resultados
2. Verifica la configuración de splits en la app
3. Contacta al equipo de desarrollo con los logs

## ⚠️ Notas Importantes

- **Siempre hacer backup** antes de ejecutar correcciones
- **Ejecutar desde la carpeta `server`** para que las variables de entorno se carguen correctamente
- **Verificar resultados** después de cada corrección
- **Los cron jobs se ejecutan automáticamente** cada noche a las 2:00 AM
