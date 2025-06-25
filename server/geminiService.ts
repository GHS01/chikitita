/**
 * Gemini AI Service
 * Integración con Gemini 2.0-flash usando REST API
 */

// 🌍 SISTEMA DE TRADUCCIÓN
import { translateWorkoutPlan, translateExerciseNamesInText } from './utils/exerciseTranslations';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCFR2kApUeCGSWOf_tkcLe1XH4qgKjDVJ0';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiService {
  private static instance: GeminiService;

  private constructor() {}

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Genera contenido usando Gemini 2.0-flash
   */
  async generateContent(prompt: string, config?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    try {
      const requestBody: GeminiRequest = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: config?.temperature || 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: config?.maxTokens || 2048
        }
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 🏋️ SISTEMA DE ENTRENAMIENTO CIENTÍFICO BASADO EN VINCE GIRONDA
   * Genera rutinas con splits inteligentes y recuperación adecuada
   */
  async generateDailyWorkoutPlan(context: {
    userProfile: any;
    userPreferences: any;
    feedbackData?: any;
    learningData?: any;
    currentDate: string;
    dayOfWeek: string;
    consolidatedProfile?: any; // 🧠 NUEVO: Perfil consolidado de feedback inteligente
  }): Promise<any> {
    const { userProfile, userPreferences, feedbackData, learningData, currentDate, dayOfWeek, consolidatedProfile } = context;

    // 🚨 DEBUG: Verificar limitaciones específicamente
    console.log('🚨 [Gemini] User Preferences:', JSON.stringify(userPreferences, null, 2));
    console.log('🚨 [Gemini] Limitations specifically:', userPreferences?.limitations);
    console.log('🚨 [Gemini] Has knee issues:', userPreferences?.limitations?.includes('knee_issues'));

    // 🧠 DETERMINAR SPLIT INTELIGENTE BASADO EN FRECUENCIA
    const weeklyFrequency = userPreferences?.weeklyFrequency || 3;
    const splitType = this.determineSplitType(weeklyFrequency, userProfile.fitnessLevel);

    // 🚀 PRIORIZAR FEEDBACK DEL USUARIO SOBRE SISTEMA DE SPLITS
    let todayMuscleGroups: string[];

    if (feedbackData?.todayMusclePreference && feedbackData.todayMusclePreference.length > 0) {
      // ✅ USAR PREFERENCIAS DEL USUARIO (PRIMERA PRIORIDAD)
      console.log('🎯 [Gemini] Using USER FEEDBACK muscle preferences:', feedbackData.todayMusclePreference);
      todayMuscleGroups = [...feedbackData.todayMusclePreference];
    } else {
      // 🔄 FALLBACK: Usar sistema de splits solo si no hay feedback
      console.log('🔄 [Gemini] No user feedback, using split system');
      const muscleGroupHistory = learningData?.muscleGroupHistory;
      todayMuscleGroups = this.getTodayMuscleGroupsWithHistory(
        dayOfWeek,
        splitType,
        weeklyFrequency,
        muscleGroupHistory
      );
    }

    // 🚨 CRÍTICO: Filtrar grupos musculares según limitaciones físicas
    const originalMuscleGroups = [...todayMuscleGroups];
    todayMuscleGroups = this.filterMuscleGroupsByLimitations(todayMuscleGroups, userPreferences?.limitations || []);

    // 🚨 DEBUG: Logs detallados para verificar el flujo
    console.log('🚨 [Gemini] User feedback muscle preference:', feedbackData?.todayMusclePreference);
    console.log('🚨 [Gemini] Original muscle groups (before filtering):', originalMuscleGroups);
    console.log('🚨 [Gemini] Final muscle groups (after filtering):', todayMuscleGroups);
    console.log('🚨 [Gemini] User limitations:', userPreferences?.limitations);
    console.log('🚨 [Gemini] Energy level:', feedbackData?.energyLevel);

    // 🎯 PROMPT CIENTÍFICO BASADO EN VINCE GIRONDA Y CIENCIA MODERNA
    const prompt = `
Eres un entrenador personal EXPERTO hispanohablante que combina los métodos de Vince Gironda con ciencia moderna del entrenamiento.
IMPORTANTE: Responde ÚNICAMENTE en español. Todos los nombres de ejercicios, instrucciones y descripciones deben estar en español.

🏋️ SISTEMA DE ENTRENAMIENTO PERSONALIZADO:
- Split Type: ${splitType}
- Frecuencia Semanal: ${weeklyFrequency} días
- Músculos SOLICITADOS por el usuario: ${feedbackData?.todayMusclePreference?.join(', ') || 'No especificados'}
- Músculos para HOY (${dayOfWeek}): ${todayMuscleGroups.join(', ')}
- PRINCIPIO CLAVE: Cada grupo muscular necesita 48-72h de recuperación

👤 PERFIL DEL USUARIO:
- Nivel: ${userProfile.fitnessLevel} | Objetivo: ${userProfile.fitnessGoal}
- Edad: ${userProfile.age || 'No especificada'} | Peso: ${userProfile.weight || 'No especificado'}kg
- Altura: ${userProfile.height || 'No especificada'}cm

⚙️ CONFIGURACIÓN:
- Equipamiento: ${userPreferences?.equipment?.join(', ') || 'bodyweight'}
- Limitaciones: ${userPreferences?.limitations?.join(', ') || 'Ninguna'}
- Tiempo disponible: ${feedbackData?.availableTime || '30-40 min'}
- Nivel de energía: ${feedbackData?.energyLevel || 'moderate'}

🚨 LIMITACIONES FÍSICAS CRÍTICAS - OBLIGATORIO RESPETAR:
${userPreferences?.limitations?.length > 0 ?
  userPreferences.limitations.map(limitation => {
    switch(limitation) {
      case 'knee_issues': return '- RODILLAS DAÑADAS: NO incluir sentadillas, prensa de piernas, extensiones de piernas, estocadas, o cualquier ejercicio que flexione las rodillas';
      case 'back_problems': return '- PROBLEMAS DE ESPALDA: NO incluir peso muerto, sentadillas con barra, remo con barra, o ejercicios que carguen la columna';
      case 'shoulder_issues': return '- PROBLEMAS DE HOMBROS: NO incluir press militar, elevaciones laterales pesadas, o movimientos por encima de la cabeza';
      case 'heart_condition': return '- CONDICIÓN CARDÍACA: Mantener intensidad moderada, descansos largos, evitar ejercicios explosivos';
      case 'asthma': return '- ASMA: Evitar ejercicios de alta intensidad, permitir descansos extra';
      case 'pregnancy': return '- EMBARAZO: Solo ejercicios seguros para embarazadas, evitar posición supina, ejercicios de core intensos';
      default: return `- ${limitation.toUpperCase()}: Adaptar ejercicios según esta limitación`;
    }
  }).join('\n')
  : '- Sin limitaciones físicas reportadas'
}

🧠 INTELIGENCIA ADAPTATIVA (Sistema Anterior):
- Ejercicios favoritos: ${learningData?.favoriteExercises?.join(', ') || 'Aprendiendo...'}
- Ejercicios a evitar: ${learningData?.avoidedExercises?.join(', ') || 'Ninguno'}
- Patrón ${dayOfWeek}: ${learningData?.weeklyPattern?.[dayOfWeek] || 'Primer entrenamiento'}

🧠 PERFIL CONSOLIDADO INTELIGENTE (Sistema Nuevo):
${consolidatedProfile ? `
- Nivel de energía consolidado: ${consolidatedProfile.energyLevel}
- Tiempo disponible promedio: ${consolidatedProfile.availableTime} minutos
- Intensidad preferida: ${consolidatedProfile.preferredIntensity}
- Ejercicios preferidos: ${consolidatedProfile.preferredExercises?.join(', ') || 'Ninguno'}
- Ejercicios a evitar: ${consolidatedProfile.avoidedExercises?.join(', ') || 'Ninguno'}
- Grupos musculares preferidos para ${dayOfWeek}: ${consolidatedProfile.muscleGroupPreferences?.[dayOfWeek]?.join(', ') || 'No especificados'}
- Limitaciones conocidas: ${consolidatedProfile.limitations?.join(', ') || 'Ninguna'}
- Horario preferido: ${consolidatedProfile.preferredTimeOfDay}
- Días consistentes: ${consolidatedProfile.consistentDays?.join(', ') || 'Ninguno'}
- Confianza del perfil: ${Math.round((consolidatedProfile.confidenceScore || 0) * 100)}%
- Fuentes de datos: ${consolidatedProfile.dataSourcesUsed?.join(', ') || 'Ninguna'}
` : '- Perfil consolidado no disponible (usuario nuevo o sin suficiente feedback)'}

💪 ANÁLISIS DE RECUPERACIÓN MUSCULAR:
- Músculos entrenados ayer: ${learningData?.muscleGroupHistory?.yesterdayMuscles?.join(', ') || 'Ninguno'}
- Músculos entrenados hace 2 días: ${learningData?.muscleGroupHistory?.twoDaysAgoMuscles?.join(', ') || 'Ninguno'}
- Músculos que NECESITAN RECUPERACIÓN (NO entrenar): ${learningData?.muscleGroupHistory?.recoveryStatus?.needsRecovery?.join(', ') || 'Ninguno'}
- Músculos LISTOS para entrenar: ${learningData?.muscleGroupHistory?.recoveryStatus?.readyToTrain?.join(', ') || 'Todos disponibles'}

🎯 PRINCIPIOS DE VINCE GIRONDA A APLICAR:
1. ENFOQUE EN ESTÉTICA: Ejercicios que mejoren simetría y definición
2. PRECISIÓN SOBRE PESO: Forma perfecta y contracción muscular completa
3. INTENSIDAD CONTROLADA: Series y repeticiones que maximicen el pump
4. EJERCICIOS ESPECÍFICOS: Movimientos que aíslen y esculpan cada músculo
5. TIEMPO EFICIENTE: Rutinas de 30-45 minutos máximo

🎯 PREFERENCIAS DEL USUARIO (MÁXIMA PRIORIDAD):
${consolidatedProfile?.muscleGroupPreferences?.[dayOfWeek]?.length > 0 ?
  `- PERFIL CONSOLIDADO para ${dayOfWeek}: ${consolidatedProfile.muscleGroupPreferences[dayOfWeek].join(', ')}
- Estas son las preferencias APRENDIDAS del usuario basadas en su historial
- PRIORIZA estos grupos musculares que el usuario consistentemente prefiere` :
  feedbackData?.todayMusclePreference?.length > 0 ?
  `- El usuario ESPECÍFICAMENTE quiere entrenar: ${feedbackData.todayMusclePreference.join(', ')}
- RESPETA EXACTAMENTE estas preferencias del usuario
- ENFÓCATE ÚNICAMENTE en los grupos musculares que el usuario seleccionó
- NO agregues otros grupos musculares que el usuario no pidió` :
  `- No hay preferencias específicas del usuario para hoy`
}

🎯 ADAPTACIONES INTELIGENTES BASADAS EN PERFIL CONSOLIDADO:
${consolidatedProfile ? `
- Si energía consolidada es "${consolidatedProfile.energyLevel}" y hoy es "${feedbackData?.energyLevel || 'no especificado'}":
  ${consolidatedProfile.energyLevel === 'high' ? 'Rutina intensa con ejercicios compuestos' :
    consolidatedProfile.energyLevel === 'medium' ? 'Rutina moderada balanceada' :
    'Rutina suave enfocada en técnica'}
- Duración objetivo: ${consolidatedProfile.availableTime} minutos (basado en historial)
- Intensidad preferida: ${consolidatedProfile.preferredIntensity}
- EVITAR ABSOLUTAMENTE: ${consolidatedProfile.avoidedExercises?.join(', ') || 'Ninguno'}
- INCLUIR PREFERENTEMENTE: ${consolidatedProfile.preferredExercises?.join(', ') || 'Ninguno'}
` : '- Perfil consolidado no disponible, usar feedback directo'}

🚨 REGLAS ESTRICTAS DE ENTRENAMIENTO:
- PRIORIDAD #1: Respetar preferencias del usuario: ${todayMuscleGroups.join(', ')}
- PROHIBIDO entrenar músculos que necesitan recuperación: ${learningData?.muscleGroupHistory?.recoveryStatus?.needsRecovery?.join(', ') || 'Ninguno'}
- PRINCIPIO 48-72H: Cada grupo muscular necesita mínimo 48 horas de recuperación
- USA ejercicios que promuevan la estética y simetría
- Si no hay músculos disponibles, enfócate en CORE, CARDIO o FLEXIBILIDAD

RESPONDE SOLO con JSON válido EN ESPAÑOL:
{
  "name": "Rutina personalizada para ${dayOfWeek}",
  "description": "Descripción motivacional específica en español",
  "difficulty": "${userProfile.fitnessLevel}",
  "duration": número_en_minutos_según_tiempo_disponible,
  "targetMuscleGroups": ["piernas", "glúteos", "pantorrillas"],
  "exercises": [
    {
      "name": "Nombre del ejercicio EN ESPAÑOL (ej: Prensa de Piernas, Sentadillas Búlgaras, Curl de Bíceps)",
      "sets": número,
      "reps": número,
      "weight": número_opcional,
      "duration": número_opcional_en_segundos,
      "rest": número_en_segundos,
      "instructions": "Instrucciones específicas en español",
      "muscleGroup": "grupo_muscular_en_español (ej: piernas, pecho, espalda, hombros, brazos)"
    }
  ],
  "aiConfidence": número_0_a_1,
  "personalizedFor": "${dayOfWeek}_${feedbackData?.energyLevel || 'moderate'}_energy"
}

EJEMPLOS DE NOMBRES EN ESPAÑOL:
- Leg Press → Prensa de Piernas
- Glute Bridge → Puente de Glúteos
- Hamstring Curl → Curl de Isquiotibiales
- Standing Calf Raises → Elevaciones de Pantorrillas de Pie
- Seated Leg Extension → Extensión de Piernas Sentado

GENERA rutina que lo haga FELIZ y MOTIVADO. Incluye 4-8 ejercicios según tiempo disponible.
TODOS los nombres de ejercicios y grupos musculares DEBEN estar en español.
`;

    try {
      const response = await this.generateContent(prompt, {
        temperature: 0.8,
        maxTokens: 2000
      });

      // Limpiar la respuesta para extraer solo el JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      let workoutPlan = JSON.parse(jsonMatch[0]);

      // 🌍 APLICAR TRADUCCIÓN AUTOMÁTICA como backup
      workoutPlan = translateWorkoutPlan(workoutPlan);

      return {
        ...workoutPlan,
        isActive: true,
        generatedAt: new Date().toISOString(),
        generatedBasedOn: {
          userPreferences: !!userPreferences,
          feedbackData: !!feedbackData,
          learningData: !!learningData,
          dayOfWeek,
          currentDate
        }
      };
    } catch (error) {
      console.error('Error generating daily workout plan:', error);
      // Fallback a plan básico si falla la IA
      return this.getFallbackDailyWorkoutPlan(userProfile, feedbackData, dayOfWeek);
    }
  }

  /**
   * Genera un plan de entrenamiento personalizado usando IA (método original para compatibilidad)
   */
  async generateWorkoutPlan(userProfile: {
    fitnessLevel: string;
    fitnessGoal: string;
    age?: number;
    weight?: number;
    height?: number;
  }): Promise<any> {
    // Usar el nuevo método con datos básicos
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    return this.generateDailyWorkoutPlan({
      userProfile,
      userPreferences: null,
      feedbackData: null,
      learningData: null,
      currentDate: today.toISOString().split('T')[0],
      dayOfWeek
    });
  }

  /**
   * Analiza una imagen de comida usando IA REAL
   */
  async analyzeFoodImage(imageBuffer: Buffer): Promise<any> {
    try {
      // Convertir imagen a base64
      const base64Image = imageBuffer.toString('base64');

      // Detectar tipo MIME de la imagen
      const mimeType = this.detectMimeType(imageBuffer);

      const prompt = `
Eres un nutricionista experto. Analiza esta imagen de comida y proporciona un análisis nutricional preciso.

Identifica todos los ingredientes visibles y calcula los valores nutricionales basándote en las porciones que observas.

Responde SOLO con un JSON válido con esta estructura exacta:
{
  "name": "Nombre específico de la comida que ves",
  "description": "Descripción detallada de los ingredientes identificados",
  "calories": número_realista_basado_en_la_porción,
  "protein": gramos_de_proteína,
  "carbs": gramos_de_carbohidratos,
  "fat": gramos_de_grasa,
  "fiber": gramos_de_fibra
}

Sé específico con el nombre y descripción. Calcula valores nutricionales realistas basados en lo que realmente ves en la imagen.
No incluyas texto adicional, solo el JSON.
`;

      const requestBody: GeminiRequest = {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4, // Más bajo para análisis más preciso
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 500
        }
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        console.error('No valid JSON found in Gemini response:', responseText);
        throw new Error('No valid JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validar que los campos requeridos estén presentes
      if (!analysis.name || !analysis.description ||
          typeof analysis.calories !== 'number' ||
          typeof analysis.protein !== 'number') {
        throw new Error('Invalid analysis format from Gemini');
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing food image with Gemini:', error);
      // Fallback a análisis básico solo si falla la IA
      return {
        name: "Comida No Identificada",
        description: "No se pudo analizar la imagen automáticamente",
        calories: 300,
        protein: 20,
        carbs: 40,
        fat: 15,
        fiber: 5
      };
    }
  }

  /**
   * Detecta el tipo MIME de una imagen basándose en sus primeros bytes
   */
  private detectMimeType(buffer: Buffer): string {
    const firstBytes = buffer.subarray(0, 4);

    // PNG: 89 50 4E 47
    if (firstBytes[0] === 0x89 && firstBytes[1] === 0x50 &&
        firstBytes[2] === 0x4E && firstBytes[3] === 0x47) {
      return 'image/png';
    }

    // JPEG: FF D8 FF
    if (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8 && firstBytes[2] === 0xFF) {
      return 'image/jpeg';
    }

    // WebP: 52 49 46 46 ... 57 45 42 50
    if (firstBytes[0] === 0x52 && firstBytes[1] === 0x49 &&
        firstBytes[2] === 0x46 && firstBytes[3] === 0x46) {
      return 'image/webp';
    }

    // Default a JPEG si no se puede detectar
    return 'image/jpeg';
  }

  /**
   * Genera recomendaciones nutricionales personalizadas
   */
  async generateNutritionInsights(userStats: {
    todayCalories: number;
    targetCalories: number;
    protein: number;
    carbs: number;
    fat: number;
  }): Promise<string[]> {
    const prompt = `
Eres un nutricionista experto hispanohablante. Analiza estos datos nutricionales del día y genera 2-3 consejos breves y útiles EN ESPAÑOL:

Datos del día:
- Calorías consumidas: ${userStats.todayCalories}
- Objetivo calórico: ${userStats.targetCalories}
- Proteína: ${userStats.protein}g
- Carbohidratos: ${userStats.carbs}g
- Grasas: ${userStats.fat}g

IMPORTANTE: Responde ÚNICAMENTE en español con consejos prácticos y motivadores.
Formato: lista simple, cada consejo en una línea separada.
Máximo 3 consejos, cada uno de máximo 80 caracteres.
Usa palabras como "Excelente", "Perfecto", "Mantén", "Agrega", "Recuerda".
`;

    try {
      const response = await this.generateContent(prompt, {
        temperature: 0.7,
        maxTokens: 300
      });

      return response.split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3)
        .map(line => line.replace(/^[-•*]\s*/, '').trim());
    } catch (error) {
      console.error('Error generating nutrition insights:', error);
      return [
        "Mantén un balance entre proteínas, carbos y grasas",
        "Hidrátate bien durante todo el día",
        "Incluye más vegetales en tus comidas"
      ];
    }
  }

  /**
   * Genera un plan alimenticio diario personalizado usando IA - ENHANCED CON ANÁLISIS INTELIGENTE
   */
  async generateDailyMealPlan(context: {
    userProfile: any;
    nutritionPreferences: any;
    weightGoal: any;
    mealTimes: any[];
    currentDate: string;
    currentHour: number;
    healthAnalysis?: any; // 🆕 ANÁLISIS DE SALUD
    progressTrends?: any; // 🆕 TENDENCIAS
    currentWeekProgress?: any; // 🆕 PROGRESO ACTUAL
  }): Promise<any> {
    const { userProfile, nutritionPreferences, weightGoal, mealTimes, currentDate, healthAnalysis, progressTrends, currentWeekProgress } = context;

    // 🧠 GENERAR ADAPTACIONES INTELIGENTES BASADAS EN ANÁLISIS
    const adaptations = this.generateSmartAdaptations(healthAnalysis, progressTrends, currentWeekProgress);

    const prompt = `
Eres un nutricionista experto hispanohablante que adapta planes según el estado actual del usuario. Genera un plan alimenticio diario personalizado en formato JSON EN ESPAÑOL para:

PERFIL DEL USUARIO:
- Edad: ${userProfile.age || 'No especificada'}
- Género: ${userProfile.gender || 'No especificado'}
- Peso actual: ${userProfile.currentWeight || 'No especificado'} kg
- Altura: ${userProfile.height || 'No especificada'} cm
- Nivel de fitness: ${userProfile.fitnessLevel || 'No especificado'}

🏥 ESTADO DE SALUD ACTUAL:
- Estado de ánimo: ${healthAnalysis?.moodLevel || 3}/5 (${this.getMoodDescription(healthAnalysis?.moodLevel)})
- Nivel de energía: ${healthAnalysis?.energyLevel || 'normal'}
- Síntomas actuales: ${healthAnalysis?.symptoms?.join(', ') || 'Ninguno'}
- Notas de salud: "${currentWeekProgress?.notes || 'Sin notas'}"
- Necesita dieta suave: ${healthAnalysis?.needsGentleDiet ? 'SÍ' : 'NO'}

📈 PROGRESO RECIENTE:
- Tendencia de peso: ${progressTrends?.weightTrend || 'estable'}
- Progreso: ${progressTrends?.progressRate || 'normal'}
- Necesita ajustes: ${progressTrends?.needsAdjustment ? 'SÍ' : 'NO'}

🎯 ADAPTACIONES REQUERIDAS:
${adaptations}

Preferencias nutricionales:
- Tipo de dieta: ${nutritionPreferences.dietType || 'No especificada'}
- Tipos de dieta personalizados: ${nutritionPreferences.customDietTypes?.join(', ') || 'Ninguno'}
- Alergias: ${nutritionPreferences.allergies?.join(', ') || 'Ninguna'}
- Restricciones médicas: ${nutritionPreferences.medicalRestrictions?.join(', ') || 'Ninguna'}
- Comidas favoritas: ${nutritionPreferences.favoriteFoods?.join(', ') || 'No especificadas'}
- Hábitos alimenticios personalizados: ${nutritionPreferences.customFoodHabits?.join(', ') || 'Ninguno'}
- Calidad de hábitos alimenticios: ${nutritionPreferences.foodHabitsRating}/5
- Meta calórica diaria: ${nutritionPreferences.dailyCalorieGoal} calorías
- Distribución de macros: ${JSON.stringify(nutritionPreferences.macroDistribution)}

Objetivo de peso:
- Tipo de objetivo: ${weightGoal.goalType}
- Peso objetivo: ${weightGoal.targetWeight || 'No especificado'} kg

Horarios de comidas restantes del día:
${mealTimes.map(meal => `- ${meal.time} (${meal.type})`).join('\n')}

Fecha: ${currentDate}

Responde SOLO con un JSON válido con esta estructura exacta:
{
  "totalCalories": número_total_de_calorías,
  "meals": [
    {
      "name": "Nombre específico de la comida",
      "time": "HH:MM",
      "type": "Desayuno/Almuerzo/Merienda/Cena",
      "calories": número_de_calorías,
      "ingredients": [
        {
          "name": "Pechuga de pollo a la parrilla",
          "amount": 150,
          "unit": "gr",
          "calories": 248
        },
        {
          "name": "Arroz integral cocido",
          "amount": 100,
          "unit": "gr",
          "calories": 111
        },
        {
          "name": "Aceite de oliva",
          "amount": 10,
          "unit": "ml",
          "calories": 90
        }
      ]
    }
  ],
  "macroBreakdown": {
    "protein": número_total_gramos,
    "carbs": número_total_gramos,
    "fat": número_total_gramos
  }
}

IMPORTANTE:
- TODOS los nombres de comidas, ingredientes y tipos deben estar EN ESPAÑOL
- USA ÚNICAMENTE estos tipos de comida: "Desayuno", "Almuerzo", "Merienda", "Cena"
- Especifica cantidades EXACTAS con unidades (gr, ml, unidad) para cada ingrediente
- SIEMPRE incluye el campo "unit" con valores como "gr", "ml", "unidad", "taza", etc.
- Calcula calorías precisas para cada ingrediente
- Respeta las alergias y restricciones médicas
- Ajusta las porciones según el objetivo de peso
- Incluye variedad de alimentos nutritivos
- Ejemplos de unidades: "250gr", "200ml", "1 unidad", "2 cucharadas"
- Para ${weightGoal.goalType === 'lose_weight' ? 'pérdida de peso: enfócate en proteínas magras y vegetales' :
  weightGoal.goalType === 'gain_weight' ? 'ganancia de peso: incluye más carbohidratos y grasas saludables' :
  'mantenimiento: balance equilibrado de macronutrientes'}

No incluyas texto adicional, solo el JSON.
`;

    try {
      const response = await this.generateContent(prompt, {
        temperature: 0.6,
        maxTokens: 2000
      });

      // Limpiar la respuesta para extraer solo el JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const mealPlan = JSON.parse(jsonMatch[0]);

      // Validar estructura del plan
      if (!mealPlan.totalCalories || !mealPlan.meals || !Array.isArray(mealPlan.meals)) {
        throw new Error('Invalid meal plan structure');
      }

      return mealPlan;
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw error;
    }
  }

  /**
   * Genera respuesta del entrenador personal AI
   */
  async generateTrainerResponse(prompt: string): Promise<string> {
    try {
      const response = await this.generateContent(prompt, {
        temperature: 0.8,
        maxTokens: 1000
      });

      return response;
    } catch (error) {
      console.error('Error generating trainer response:', error);
      throw error;
    }
  }

  /**
   * 🧠 DETERMINA EL TIPO DE SPLIT BASADO EN FRECUENCIA Y NIVEL
   * ✅ ALINEADO con scientificWorkoutService.ts - LÓGICA CIENTÍFICA OPTIMIZADA
   */
  private determineSplitType(weeklyFrequency: number, fitnessLevel: string): string {
    // 🎯 SPLITS CIENTÍFICOS BASADOS EN FRECUENCIA
    if (weeklyFrequency === 1) {
      return 'Full Body'; // 1 día: Full Body (máximo estímulo)
    } else if (weeklyFrequency === 2) {
      return 'Upper/Lower'; // 2 días: Upper/Lower (división óptima)
    } else if (weeklyFrequency === 3) {
      return 'Push/Pull/Legs'; // 3 días: Push/Pull/Legs (estándar)
    } else if (weeklyFrequency === 4) {
      return 'Body Part Split'; // 4 días: Body Part Split (especialización)
    } else if (weeklyFrequency === 5 || weeklyFrequency === 6) {
      return 'Push/Pull/Legs'; // 5-6 días: PPL x2 (frecuencia 2x)
    } else if (weeklyFrequency >= 7) {
      return 'Body Part Split'; // 7+ días: Body Part + recuperación activa
    } else {
      return 'Push/Pull/Legs'; // Fallback
    }
  }

  /**
   * 🎯 DETERMINA QUÉ MÚSCULOS ENTRENAR HOY
   * Basado en el split y día de la semana
   */
  private getTodayMuscleGroups(dayOfWeek: string, splitType: string, weeklyFrequency: number): string[] {
    const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dayOfWeek.toLowerCase());

    switch (splitType) {
      case 'Full Body':
        return ['chest', 'back', 'legs', 'shoulders', 'arms']; // Cuerpo completo pero balanceado

      case 'Upper/Lower':
        // Alternar Upper/Lower basado en días de entrenamiento
        const isUpperDay = this.isUpperDay(dayIndex, weeklyFrequency);
        return isUpperDay ? ['chest', 'back', 'shoulders', 'arms'] : ['legs', 'glutes', 'calves'];

      case 'Push/Pull/Legs':
        return this.getPushPullLegsSchedule(dayIndex, weeklyFrequency);

      case 'Body Part Split':
        return this.getBodyPartSplit(dayIndex);

      default:
        return ['chest', 'back', 'legs']; // Fallback seguro
    }
  }

  /**
   * 🚀 NUEVA FUNCIÓN: Determina músculos considerando historial de recuperación Y LIMITACIONES FÍSICAS
   * Evita entrenar músculos que necesitan más tiempo de recuperación O que están contraindicados
   */
  private getTodayMuscleGroupsWithHistory(
    dayOfWeek: string,
    splitType: string,
    weeklyFrequency: number,
    muscleGroupHistory?: any
  ): string[] {
    // Si no hay historial, usar lógica tradicional
    if (!muscleGroupHistory) {
      return this.getTodayMuscleGroups(dayOfWeek, splitType, weeklyFrequency);
    }

    console.log('💪 [Gemini] Using muscle group history for smart selection');
    console.log('💪 [Gemini] Available muscles:', muscleGroupHistory.availableMuscleGroups);
    console.log('💪 [Gemini] Needs recovery:', muscleGroupHistory.recoveryStatus?.needsRecovery);

    // Obtener músculos disponibles (que han tenido suficiente recuperación)
    const availableMuscles = muscleGroupHistory.availableMuscleGroups || [];

    // Si no hay músculos disponibles, usar fallback seguro
    if (availableMuscles.length === 0) {
      console.log('💪 [Gemini] No available muscles, using fallback');
      return ['core', 'cardio']; // Entrenamiento de core/cardio como fallback
    }

    // Determinar músculos ideales según el split
    const idealMuscles = this.getTodayMuscleGroups(dayOfWeek, splitType, weeklyFrequency);

    // Filtrar músculos ideales que estén disponibles
    const smartSelection = idealMuscles.filter(muscle => availableMuscles.includes(muscle));

    // Si hay músculos ideales disponibles, usarlos
    if (smartSelection.length >= 2) {
      console.log('💪 [Gemini] Smart selection:', smartSelection);
      return smartSelection;
    }

    // Si no hay suficientes músculos ideales, seleccionar los mejores disponibles
    // Priorizar músculos que forman un buen entrenamiento
    const muscleGroups = this.selectBestAvailableMuscles(availableMuscles, splitType);
    console.log('💪 [Gemini] Best available selection:', muscleGroups);

    return muscleGroups;
  }

  /**
   * 🚨 FILTRAR GRUPOS MUSCULARES SEGÚN LIMITACIONES FÍSICAS
   * Evita entrenar músculos que pueden ser peligrosos para el usuario
   */
  private filterMuscleGroupsByLimitations(muscleGroups: string[], limitations: string[]): string[] {
    if (!limitations || limitations.length === 0) {
      return muscleGroups;
    }

    console.log('🚨 [Gemini] Filtering muscle groups:', muscleGroups, 'with limitations:', limitations);

    // Definir qué grupos musculares evitar según cada limitación
    const limitationFilters = {
      'knee_issues': ['legs', 'glutes', 'calves'], // Evitar todo lo relacionado con piernas
      'back_problems': ['back', 'legs'], // Evitar espalda y ejercicios de piernas que comprometan la espalda
      'heart_condition': [], // Permitir todos pero con intensidad controlada (se maneja en el prompt)
      'shoulder_injury': ['shoulders', 'chest', 'arms'], // Evitar hombros y ejercicios que los involucren
      'wrist_problems': ['arms', 'chest'], // Evitar ejercicios que requieran agarre fuerte
      'ankle_injury': ['legs', 'calves'], // Evitar ejercicios de piernas
      'hip_problems': ['legs', 'glutes'] // Evitar ejercicios de cadera y piernas
    };

    // Obtener todos los grupos musculares a evitar
    const muscleGroupsToAvoid = new Set<string>();
    for (const limitation of limitations) {
      const groupsToAvoid = limitationFilters[limitation as keyof typeof limitationFilters] || [];
      groupsToAvoid.forEach(group => muscleGroupsToAvoid.add(group));
    }

    console.log('🚨 [Gemini] Muscle groups to avoid:', Array.from(muscleGroupsToAvoid));

    // Filtrar grupos musculares
    const filteredGroups = muscleGroups.filter(group => !muscleGroupsToAvoid.has(group));

    console.log('🚨 [Gemini] Filtered result:', filteredGroups);

    // Si no quedan grupos musculares seguros, usar alternativas seguras
    if (filteredGroups.length === 0) {
      console.log('🚨 [Gemini] No safe muscle groups found, using safe alternatives');
      return this.getSafeMuscleGroupsForLimitations(limitations);
    }

    return filteredGroups;
  }

  /**
   * 🛡️ OBTENER GRUPOS MUSCULARES SEGUROS PARA LIMITACIONES ESPECÍFICAS
   */
  private getSafeMuscleGroupsForLimitations(limitations: string[]): string[] {
    // Grupos musculares generalmente seguros para diferentes limitaciones
    const safeAlternatives = {
      'knee_issues': ['chest', 'back', 'shoulders', 'arms'], // Tren superior
      'back_problems': ['chest', 'shoulders', 'arms'], // Evitar espalda
      'heart_condition': ['arms', 'shoulders'], // Ejercicios de menor intensidad cardiovascular
      'shoulder_injury': ['legs', 'abs'], // Tren inferior y core
      'wrist_problems': ['legs', 'abs'], // Ejercicios que no requieran agarre
      'ankle_injury': ['chest', 'back', 'shoulders', 'arms'], // Tren superior
      'hip_problems': ['chest', 'back', 'shoulders', 'arms'] // Tren superior
    };

    // Encontrar grupos musculares que sean seguros para TODAS las limitaciones
    let safeGroups = ['abs']; // Core es generalmente seguro

    for (const limitation of limitations) {
      const safeMuscles = safeAlternatives[limitation as keyof typeof safeAlternatives] || [];
      if (safeMuscles.length > 0) {
        safeGroups.push(...safeMuscles);
      }
    }

    // Remover duplicados y retornar máximo 3 grupos
    const uniqueSafeGroups = [...new Set(safeGroups)];
    console.log('🛡️ [Gemini] Safe muscle groups for limitations:', uniqueSafeGroups);

    return uniqueSafeGroups.slice(0, 3);
  }

  /**
   * 🚨 VERIFICAR CONFLICTOS ENTRE LIMITACIONES Y GRUPOS MUSCULARES
   * Determina si un split es seguro para las limitaciones del usuario
   */
  checkLimitationsConflict(limitations: string[], muscleGroups: string[]): {
    hasConflict: boolean;
    conflictingLimitations: string[];
    affectedMuscleGroups: string[];
    safeAlternatives: string[];
  } {
    if (!limitations || limitations.length === 0) {
      return {
        hasConflict: false,
        conflictingLimitations: [],
        affectedMuscleGroups: [],
        safeAlternatives: []
      };
    }

    console.log('🚨 [Gemini] Checking limitations conflict:', { limitations, muscleGroups });

    // Definir qué grupos musculares evitar según cada limitación
    const limitationFilters = {
      'knee_issues': ['legs', 'glutes', 'calves', 'quadriceps', 'hamstrings'],
      'back_problems': ['back', 'legs', 'deadlifts'],
      'shoulder_issues': ['shoulders', 'chest', 'arms'],
      'heart_condition': [], // Permitir todos pero con intensidad controlada
      'asthma': [], // Permitir todos pero con intensidad controlada
      'pregnancy': ['abs', 'back'], // Evitar ejercicios de core intensos y posición supina
      'wrist_problems': ['arms', 'chest'],
      'ankle_injury': ['legs', 'calves'],
      'hip_problems': ['legs', 'glutes']
    };

    const conflictingLimitations: string[] = [];
    const affectedMuscleGroups: string[] = [];

    // Verificar cada limitación
    for (const limitation of limitations) {
      const muscleGroupsToAvoid = limitationFilters[limitation as keyof typeof limitationFilters] || [];

      // Verificar si algún grupo muscular del split está en la lista de evitar
      const conflictingGroups = muscleGroups.filter(group =>
        muscleGroupsToAvoid.some(avoid =>
          group.toLowerCase().includes(avoid.toLowerCase()) ||
          avoid.toLowerCase().includes(group.toLowerCase())
        )
      );

      if (conflictingGroups.length > 0) {
        conflictingLimitations.push(limitation);
        affectedMuscleGroups.push(...conflictingGroups);
      }
    }

    // Generar alternativas seguras
    const safeAlternatives = this.getSafeMuscleGroupsForLimitations(limitations);

    const hasConflict = conflictingLimitations.length > 0;

    console.log('🚨 [Gemini] Conflict check result:', {
      hasConflict,
      conflictingLimitations,
      affectedMuscleGroups,
      safeAlternatives
    });

    return {
      hasConflict,
      conflictingLimitations: [...new Set(conflictingLimitations)],
      affectedMuscleGroups: [...new Set(affectedMuscleGroups)],
      safeAlternatives
    };
  }

  /**
   * 🎯 Selecciona los mejores músculos disponibles para un entrenamiento balanceado
   */
  private selectBestAvailableMuscles(availableMuscles: string[], splitType: string): string[] {
    // Definir combinaciones ideales de músculos
    const idealCombinations = {
      'Upper/Lower': {
        upper: ['chest', 'back', 'shoulders', 'arms'],
        lower: ['legs', 'glutes', 'calves']
      },
      'Push/Pull/Legs': {
        push: ['chest', 'shoulders', 'arms'],
        pull: ['back', 'arms'],
        legs: ['legs', 'glutes', 'calves']
      }
    };

    // Intentar formar un grupo coherente
    for (const [type, combinations] of Object.entries(idealCombinations)) {
      if (splitType === type) {
        for (const combo of Object.values(combinations)) {
          const availableInCombo = combo.filter(muscle => availableMuscles.includes(muscle));
          if (availableInCombo.length >= 2) {
            return availableInCombo.slice(0, 3); // Máximo 3 grupos musculares
          }
        }
      }
    }

    // Fallback: seleccionar los primeros músculos disponibles
    return availableMuscles.slice(0, Math.min(3, availableMuscles.length));
  }

  /**
   * 🔄 DETERMINA SI ES DÍA DE UPPER EN SPLIT UPPER/LOWER
   */
  private isUpperDay(dayIndex: number, weeklyFrequency: number): boolean {
    // Distribución inteligente para evitar días consecutivos del mismo tipo
    if (weeklyFrequency === 3) {
      return [1, 5].includes(dayIndex); // Lunes y Viernes = Upper
    } else if (weeklyFrequency === 4) {
      return [1, 4].includes(dayIndex); // Lunes y Jueves = Upper
    }
    return dayIndex % 2 === 1; // Alternativo por defecto
  }

  /**
   * 💪 SCHEDULE PARA PUSH/PULL/LEGS
   */
  private getPushPullLegsSchedule(dayIndex: number, weeklyFrequency: number): string[] {
    const schedule = {
      1: ['chest', 'shoulders', 'triceps'], // Lunes - Push
      2: ['back', 'biceps'], // Martes - Pull
      3: ['legs', 'glutes', 'calves'], // Miércoles - Legs
      4: ['chest', 'shoulders', 'triceps'], // Jueves - Push
      5: ['back', 'biceps'], // Viernes - Pull
      6: ['legs', 'glutes', 'calves'] // Sábado - Legs
    };

    return schedule[dayIndex as keyof typeof schedule] || ['chest', 'back'];
  }

  /**
   * 🎯 SPLIT POR PARTES DEL CUERPO (ESTILO VINCE GIRONDA)
   */
  private getBodyPartSplit(dayIndex: number): string[] {
    const girondaSplit = {
      1: ['chest'], // Lunes - Pecho
      2: ['back'], // Martes - Espalda
      3: ['shoulders'], // Miércoles - Hombros
      4: ['arms'], // Jueves - Brazos
      5: ['legs'], // Viernes - Piernas
      6: ['abs', 'calves'] // Sábado - Accesorios
    };

    return girondaSplit[dayIndex as keyof typeof girondaSplit] || ['chest'];
  }

  /**
   * 🚨 ELIMINADO: Plan de respaldo con fallbacks hardcodeados
   * Este método ha sido eliminado para forzar el uso de configuración real del usuario
   */
  private throwConfigurationError(): never {
    throw new Error('CONFIGURACIÓN_INCOMPLETA: Usuario debe configurar días disponibles reales antes de generar rutinas');
  }

  private parseDuration(timeString: string): number {
    if (timeString.includes('15-20')) return 20;
    if (timeString.includes('30-40')) return 35;
    if (timeString.includes('45-60')) return 50;
    if (timeString.includes('60+')) return 70;
    return 35; // default
  }

  private getExercisesByMuscleGroup(targetMuscles: string[], fitnessLevel: string, duration: number) {
    const exerciseCount = Math.floor(duration / 7); // ~7 min por ejercicio

    // 🏋️ BANCO DE EJERCICIOS BASADO EN VINCE GIRONDA Y CIENCIA MODERNA
    const exerciseBank = {
      // 💪 PECHO - Enfoque en estética y definición
      chest: [
        { name: "Neck Press (Guillotine Press)", sets: 4, reps: 8, rest: 60, instructions: "Barra al cuello, enfoque en pecho superior", muscleGroup: "chest" },
        { name: "Incline Dumbbell Press", sets: 4, reps: 10, rest: 75, instructions: "45°, contracción completa", muscleGroup: "chest" },
        { name: "Dips", sets: 3, reps: 12, rest: 60, instructions: "Inclinación hacia adelante", muscleGroup: "chest" },
        { name: "Flyes", sets: 3, reps: 12, rest: 45, instructions: "Arco amplio, squeeze en la cima", muscleGroup: "chest" }
      ],

      // 🔙 ESPALDA - V-taper y anchura
      back: [
        { name: "Wide-Grip Pull-ups", sets: 4, reps: 8, rest: 90, instructions: "Agarre ancho, enfoque en dorsales", muscleGroup: "back" },
        { name: "T-Bar Row", sets: 4, reps: 10, rest: 75, instructions: "Aprieta escápulas, control total", muscleGroup: "back" },
        { name: "Lat Pulldowns", sets: 3, reps: 12, rest: 60, instructions: "Agarre ancho, al pecho", muscleGroup: "back" },
        { name: "Cable Rows", sets: 3, reps: 12, rest: 60, instructions: "Codos pegados al cuerpo", muscleGroup: "back" }
      ],

      // 🦵 PIERNAS - Sin comprometer la cintura
      legs: [
        { name: "Sissy Squats", sets: 4, reps: 12, rest: 75, instructions: "Aislamiento de cuádriceps", muscleGroup: "legs" },
        { name: "Hack Squats", sets: 4, reps: 10, rest: 90, instructions: "Posición alta de pies", muscleGroup: "legs" },
        { name: "Leg Curls", sets: 3, reps: 12, rest: 60, instructions: "Contracción completa", muscleGroup: "legs" },
        { name: "Calf Raises", sets: 4, reps: 15, rest: 45, instructions: "Rango completo de movimiento", muscleGroup: "legs" }
      ],

      // 💪 HOMBROS - Anchura y definición
      shoulders: [
        { name: "Lateral Raises", sets: 4, reps: 12, rest: 45, instructions: "Control en la bajada", muscleGroup: "shoulders" },
        { name: "Behind Neck Press", sets: 3, reps: 10, rest: 75, instructions: "Cuidado con flexibilidad", muscleGroup: "shoulders" },
        { name: "Front Raises", sets: 3, reps: 12, rest: 45, instructions: "Hasta altura de hombros", muscleGroup: "shoulders" },
        { name: "Rear Delt Flyes", sets: 3, reps: 15, rest: 45, instructions: "Squeeze en la contracción", muscleGroup: "shoulders" }
      ],

      // 💪 BRAZOS - Pico y definición
      arms: [
        { name: "Drag Curls", sets: 4, reps: 10, rest: 60, instructions: "Arrastra la barra por el torso", muscleGroup: "arms" },
        { name: "Preacher Curls", sets: 3, reps: 12, rest: 60, instructions: "Contracción en el pico", muscleGroup: "arms" },
        { name: "Close-Grip Bench Press", sets: 4, reps: 8, rest: 75, instructions: "Codos pegados al cuerpo", muscleGroup: "arms" },
        { name: "Overhead Tricep Extension", sets: 3, reps: 12, rest: 60, instructions: "Codos fijos", muscleGroup: "arms" }
      ],

      // 🔥 ACCESORIOS
      abs: [
        { name: "Hanging Leg Raises", sets: 4, reps: 12, rest: 60, instructions: "Control total", muscleGroup: "abs" },
        { name: "Vacuum Exercise", sets: 3, duration: 20, rest: 45, instructions: "Mantén la contracción", muscleGroup: "abs" },
        { name: "Crunches", sets: 3, reps: 20, rest: 45, instructions: "Contracción completa", muscleGroup: "abs" }
      ],

      // 🦵 GLÚTEOS Y PANTORRILLAS
      glutes: [
        { name: "Hip Thrusts", sets: 4, reps: 12, rest: 75, instructions: "Squeeze en la cima", muscleGroup: "glutes" },
        { name: "Bulgarian Split Squats", sets: 3, reps: 10, rest: 60, instructions: "Cada pierna", muscleGroup: "glutes" }
      ],

      calves: [
        { name: "Standing Calf Raises", sets: 4, reps: 20, rest: 45, instructions: "Pausa en la cima", muscleGroup: "calves" },
        { name: "Seated Calf Raises", sets: 3, reps: 15, rest: 45, instructions: "Rango completo", muscleGroup: "calves" }
      ],

      // 💪 TRÍCEPS Y BÍCEPS ESPECÍFICOS
      triceps: [
        { name: "Close-Grip Bench Press", sets: 4, reps: 8, rest: 75, instructions: "Enfoque en tríceps", muscleGroup: "triceps" },
        { name: "Tricep Dips", sets: 3, reps: 12, rest: 60, instructions: "Cuerpo vertical", muscleGroup: "triceps" }
      ],

      biceps: [
        { name: "Drag Curls", sets: 4, reps: 10, rest: 60, instructions: "Técnica de Gironda", muscleGroup: "biceps" },
        { name: "Hammer Curls", sets: 3, reps: 12, rest: 60, instructions: "Agarre neutro", muscleGroup: "biceps" }
      ]
    };

    let selectedExercises = [];

    // Seleccionar ejercicios según músculos objetivo
    for (const muscle of targetMuscles) {
      const muscleExercises = exerciseBank[muscle as keyof typeof exerciseBank] || exerciseBank.chest; // Fallback a chest
      selectedExercises.push(...muscleExercises.slice(0, Math.ceil(exerciseCount / targetMuscles.length)));
    }

    return selectedExercises.slice(0, exerciseCount);
  }

  /**
   * 🧠 GENERA ADAPTACIONES INTELIGENTES PARA NUTRICIÓN
   */
  private generateSmartAdaptations(healthAnalysis: any, progressTrends: any, currentWeekProgress: any): string {
    const adaptations = [];

    // Adaptaciones por estado de salud
    if (healthAnalysis?.hasSymptoms) {
      adaptations.push('🏥 ADAPTACIÓN POR SÍNTOMAS:');
      adaptations.push(...(healthAnalysis.recommendations || []));
    }

    // Adaptaciones por estado de ánimo
    if (healthAnalysis?.moodLevel <= 2) {
      adaptations.push('😔 ADAPTACIÓN POR ESTADO DE ÁNIMO BAJO:');
      adaptations.push('- Comidas reconfortantes pero nutritivas');
      adaptations.push('- Porciones más pequeñas y fáciles de digerir');
      adaptations.push('- Evitar restricciones muy estrictas temporalmente');
    } else if (healthAnalysis?.moodLevel >= 4) {
      adaptations.push('😊 ESTADO DE ÁNIMO EXCELENTE:');
      adaptations.push('- Puede manejar comidas más complejas');
      adaptations.push('- Mantener disciplina nutricional estricta');
      adaptations.push('- Introducir nuevos alimentos saludables');
    }

    // Adaptaciones por progreso
    if (progressTrends?.needsAdjustment) {
      adaptations.push('📈 ADAPTACIÓN POR PROGRESO:');
      adaptations.push(...(progressTrends.recommendations || []));
    }

    // Adaptaciones por nivel de energía
    if (healthAnalysis?.energyLevel === 'low') {
      adaptations.push('⚡ ADAPTACIÓN POR BAJA ENERGÍA:');
      adaptations.push('- Carbohidratos complejos para energía sostenida');
      adaptations.push('- Alimentos ricos en hierro y vitaminas B');
      adaptations.push('- Comidas más frecuentes y ligeras');
    }

    return adaptations.length > 0 ? adaptations.join('\n') : 'Sin adaptaciones especiales necesarias';
  }

  /**
   * 😊 DESCRIPCIÓN DEL ESTADO DE ÁNIMO
   */
  private getMoodDescription(moodLevel: number): string {
    if (!moodLevel) return 'normal';
    if (moodLevel <= 1) return 'terrible';
    if (moodLevel <= 2) return 'mal';
    if (moodLevel <= 3) return 'normal';
    if (moodLevel <= 4) return 'bien';
    return 'excelente';
  }

  /**
   * Plan de entrenamiento de respaldo si falla la IA (método original)
   */
  private getFallbackWorkoutPlan(fitnessLevel: string, goal: string) {
    const exercises = {
      beginner: [
        { name: "Push-ups", sets: 3, reps: 10, rest: 60, instructions: "Mantén el cuerpo recto" },
        { name: "Squats", sets: 3, reps: 15, rest: 60, instructions: "Baja hasta 90 grados" },
        { name: "Plank", sets: 3, duration: 30, rest: 60, instructions: "Mantén el core activo" }
      ],
      intermediate: [
        { name: "Bench Press", sets: 4, reps: 8, weight: 60, rest: 90, instructions: "Control en la bajada" },
        { name: "Deadlifts", sets: 4, reps: 6, weight: 80, rest: 120, instructions: "Espalda recta siempre" },
        { name: "Pull-ups", sets: 3, reps: 8, rest: 90, instructions: "Rango completo de movimiento" }
      ],
      advanced: [
        { name: "Heavy Squats", sets: 5, reps: 5, weight: 100, rest: 180, instructions: "Profundidad completa" },
        { name: "Military Press", sets: 4, reps: 6, weight: 50, rest: 120, instructions: "Core estable" },
        { name: "Barbell Rows", sets: 4, reps: 8, weight: 70, rest: 90, instructions: "Aprieta escápulas" }
      ]
    };

    return {
      name: `${goal} Training - Week 1`,
      description: `Plan de entrenamiento ${fitnessLevel} para ${goal}`,
      difficulty: fitnessLevel,
      duration: 45,
      exercises: exercises[fitnessLevel as keyof typeof exercises] || exercises.beginner,
      weekNumber: 1,
      isActive: true
    };
  }
}

export const geminiService = GeminiService.getInstance();
