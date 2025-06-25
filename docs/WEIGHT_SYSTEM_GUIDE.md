# 🏋️‍♂️ Sistema de Peso Inteligente - Guía Completa

## 📋 Índice
1. [Introducción](#introducción)
2. [Características Principales](#características-principales)
3. [Flujo de Usuario](#flujo-de-usuario)
4. [Componentes del Sistema](#componentes-del-sistema)
5. [Algoritmo de IA](#algoritmo-de-ia)
6. [Guía de Uso](#guía-de-uso)
7. [Troubleshooting](#troubleshooting)

## 🎯 Introducción

El Sistema de Peso Inteligente es una funcionalidad avanzada que utiliza inteligencia artificial para sugerir pesos óptimos durante los entrenamientos, basándose en el historial del usuario, RPE (Rate of Perceived Exertion), feedback de peso y patrones de descanso.

### Objetivos del Sistema
- **Optimizar la progresión**: Sugerir pesos que promuevan el crecimiento muscular
- **Prevenir lesiones**: Evitar sobrecargas peligrosas
- **Personalización**: Adaptar las recomendaciones al usuario específico
- **Aprendizaje continuo**: Mejorar las sugerencias con cada entrenamiento

## ✨ Características Principales

### 🤖 Sugerencias Inteligentes de Peso
- Algoritmo basado en RPE objetivo (6-8 para hipertrofia)
- Análisis de tendencias de progresión
- Consideración del feedback del usuario
- Confianza adaptativa basada en datos históricos

### 📊 Captura de Datos Granular
- **RPE por set**: Escala 1-10 de esfuerzo percibido
- **Feedback de peso**: Muy fácil / Perfecto / Muy pesado
- **Tiempo de descanso**: Medición automática entre sets
- **Rendimiento**: Reps completadas vs. planificadas

### 🧠 Aprendizaje Automático
- Procesamiento automático después de cada entrenamiento
- Actualización de sugerencias basada en patrones
- Detección de tendencias de progresión
- Optimización de tiempos de descanso

## 🔄 Flujo de Usuario

### 1. Inicio del Ejercicio
```
Usuario inicia ejercicio → Sistema verifica peso anterior → 
Muestra sugerencia de IA → Usuario selecciona peso
```

### 2. Durante el Set
```
Usuario completa set → Sistema inicia cronómetro de descanso → 
Muestra tiempo recomendado vs. actual
```

### 3. Feedback del Set
```
Modal de feedback → Usuario indica RPE y sensación de peso → 
Sistema registra datos para aprendizaje
```

### 4. Procesamiento de IA
```
Fin del entrenamiento → Procesamiento automático en segundo plano → 
Actualización de sugerencias para próximas sesiones
```

## 🏗️ Componentes del Sistema

### Frontend
- **`WeightSelectionModal`**: Modal para selección de peso con sugerencias IA
- **`SetFeedbackModal`**: Captura RPE y feedback de peso
- **`WorkoutFloatingWindow`**: Integración del sistema en el flujo de entrenamiento
- **`useWeightSuggestions`**: Hook para gestión de datos de peso

### Backend
- **`weightSuggestionService`**: Lógica de sugerencias de peso
- **`aiLearningService`**: Algoritmos de aprendizaje automático
- **`supabaseStorage`**: Operaciones de base de datos
- **APIs REST**: Endpoints para captura y consulta de datos

### Base de Datos
- **`ai_weight_suggestions`**: Cache de sugerencias de IA
- **`exercise_weight_history`**: Historial de pesos usados
- **`exercise_set_feedback`**: Feedback granular por set
- **`rest_time_patterns`**: Patrones de tiempo de descanso

## 🧮 Algoritmo de IA

### Factores de Decisión
1. **RPE Promedio**: Objetivo 6-8 para hipertrofia
2. **Feedback de Peso**: Muy fácil → aumentar, Muy pesado → reducir
3. **Tendencia de Progresión**: Análisis de últimas 5 vs. 5 anteriores sesiones
4. **Consistencia**: Variabilidad en pesos usados
5. **Cantidad de Datos**: Más datos = mayor confianza

### Lógica de Ajuste
```typescript
if (RPE < 6 || feedback === 'too_light') {
  // Incrementar peso 5-7.5%
} else if (RPE > 9 || feedback === 'too_heavy') {
  // Reducir peso 5-7.5%
} else if (RPE 6-8 && feedback === 'perfect') {
  // Progresión gradual +2.5%
}
```

### Cálculo de Confianza
```typescript
confianza = min(0.95, 0.3 + (puntos_datos * 0.02))
if (alta_variabilidad) confianza *= 0.8
```

## 📖 Guía de Uso

### Para Usuarios Nuevos
1. **Primera vez**: El sistema sugiere pesos base conservadores
2. **Primeras sesiones**: Ajustar según sensación personal
3. **Después de 3-5 sesiones**: Las sugerencias se vuelven más precisas

### Interpretación de Sugerencias
- **Confianza > 80%**: Sugerencia muy confiable
- **Confianza 60-80%**: Sugerencia moderada, ajustar si es necesario
- **Confianza < 60%**: Sugerencia inicial, usar como referencia

### Uso del RPE
- **1-3**: Muy fácil, peso insuficiente
- **4-5**: Fácil, puede aumentar peso
- **6-8**: Óptimo para hipertrofia
- **9**: Muy difícil, cerca del fallo
- **10**: Fallo muscular completo

### Feedback de Peso
- **Muy fácil**: Podría usar más peso sin problemas
- **Perfecto**: Peso ideal para el objetivo
- **Muy pesado**: Peso excesivo, reducir en próxima sesión

## 🔧 Troubleshooting

### Problema: No aparecen sugerencias de peso
**Solución**: 
- Verificar que el usuario tenga historial de entrenamientos
- Ejecutar inicialización de datos desde el panel de testing
- Comprobar conectividad con la base de datos

### Problema: Sugerencias incorrectas
**Solución**:
- Proporcionar feedback honesto en cada set
- Usar el sistema consistentemente por 1-2 semanas
- Verificar que el RPE se esté registrando correctamente

### Problema: El cronómetro de descanso no funciona
**Solución**:
- Verificar que el botón "Descansar" esté funcionando
- Comprobar que los permisos del navegador permitan temporizadores
- Revisar la consola del navegador para errores

### Problema: Los datos no se guardan
**Solución**:
- Verificar conexión a internet
- Comprobar autenticación del usuario
- Revisar logs del servidor para errores de base de datos

## 🧪 Testing y Desarrollo

### Panel de Testing
- Disponible solo para usuario ID 17 (desarrollo)
- Ubicado en el dashboard principal
- Permite probar todas las funcionalidades del sistema

### Comandos de Testing
```bash
# Ejecutar tests del sistema
npm run test:weight-system

# Inicializar datos de prueba
npm run init:weight-data

# Procesar aprendizaje de IA
npm run process:ai-learning
```

### Métricas de Éxito
- **Tasa de éxito de tests**: > 80%
- **Tiempo de respuesta de sugerencias**: < 500ms
- **Precisión de sugerencias**: Mejora continua con uso

## 📊 Métricas y Analytics

### Datos Capturados
- Peso sugerido vs. peso usado
- RPE por set y ejercicio
- Tiempo de descanso real vs. recomendado
- Progresión de peso a lo largo del tiempo
- Feedback de sensación de peso

### Reportes Disponibles
- Progresión de fuerza por ejercicio
- Análisis de RPE promedio
- Eficiencia de tiempos de descanso
- Precisión de sugerencias de IA

## 🔮 Futuras Mejoras

### Próximas Funcionalidades
- Sugerencias de series y repeticiones
- Análisis de fatiga acumulada
- Periodización automática
- Integración con wearables
- Predicción de 1RM

### Optimizaciones Planificadas
- Algoritmo de machine learning más avanzado
- Personalización por tipo de cuerpo
- Consideración de factores externos (sueño, estrés)
- Sugerencias de ejercicios alternativos

---

## 📞 Soporte

Para reportar bugs o solicitar nuevas funcionalidades, contactar al equipo de desarrollo a través del sistema de feedback integrado en la aplicación.

**Versión del documento**: 1.0  
**Última actualización**: Diciembre 2024
