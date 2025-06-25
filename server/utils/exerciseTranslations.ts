/**
 * 🌍 SISTEMA DE TRADUCCIÓN DE EJERCICIOS Y GRUPOS MUSCULARES
 * Traduce nombres de ejercicios del inglés al español para el público hispano
 */

// 💪 GRUPOS MUSCULARES EN ESPAÑOL
export const muscleGroupTranslations: Record<string, string> = {
  // Inglés → Español
  'legs': 'piernas',
  'glutes': 'glúteos', 
  'calves': 'pantorrillas',
  'chest': 'pecho',
  'back': 'espalda',
  'shoulders': 'hombros',
  'arms': 'brazos',
  'biceps': 'bíceps',
  'triceps': 'tríceps',
  'abs': 'abdominales',
  'core': 'core',
  'quads': 'cuádriceps',
  'hamstrings': 'isquiotibiales',
  'lats': 'dorsales',
  'traps': 'trapecios',
  'delts': 'deltoides',
  'forearms': 'antebrazos'
};

// 🏋️ EJERCICIOS COMUNES TRADUCIDOS
export const exerciseTranslations: Record<string, string> = {
  // PIERNAS
  'Leg Press': 'Prensa de Piernas',
  'Glute Bridge': 'Puente de Glúteos',
  'Hamstring Curl Machine': 'Curl de Isquiotibiales en Máquina',
  'Standing Calf Raises Machine': 'Elevaciones de Pantorrillas de Pie en Máquina',
  'Seated Leg Extension': 'Extensión de Piernas Sentado',
  'Bulgarian Split Squats': 'Sentadillas Búlgaras',
  'Squats': 'Sentadillas',
  'Lunges': 'Zancadas',
  'Deadlifts': 'Peso Muerto',
  'Romanian Deadlifts': 'Peso Muerto Rumano',
  'Calf Raises': 'Elevaciones de Pantorrillas',
  'Wall Sit': 'Sentadilla en Pared',
  'Step Ups': 'Subidas al Escalón',
  
  // PECHO
  'Bench Press': 'Press de Banca',
  'Incline Bench Press': 'Press Inclinado',
  'Decline Bench Press': 'Press Declinado',
  'Dumbbell Flyes': 'Aperturas con Mancuernas',
  'Push Ups': 'Flexiones',
  'Chest Dips': 'Fondos de Pecho',
  'Cable Crossover': 'Cruces en Polea',
  
  // ESPALDA
  'Pull Ups': 'Dominadas',
  'Lat Pulldown': 'Jalón al Pecho',
  'Barbell Rows': 'Remo con Barra',
  'Dumbbell Rows': 'Remo con Mancuernas',
  'T-Bar Rows': 'Remo en T',
  'Cable Rows': 'Remo en Polea',
  'Face Pulls': 'Jalones Faciales',
  
  // HOMBROS
  'Shoulder Press': 'Press de Hombros',
  'Lateral Raises': 'Elevaciones Laterales',
  'Front Raises': 'Elevaciones Frontales',
  'Rear Delt Flyes': 'Aperturas Posteriores',
  'Upright Rows': 'Remo al Mentón',
  'Arnold Press': 'Press Arnold',
  
  // BRAZOS
  'Bicep Curls': 'Curl de Bíceps',
  'Hammer Curls': 'Curl Martillo',
  'Tricep Dips': 'Fondos de Tríceps',
  'Tricep Extensions': 'Extensiones de Tríceps',
  'Close Grip Bench Press': 'Press de Banca Agarre Cerrado',
  'Preacher Curls': 'Curl en Banco Scott',
  
  // ABDOMINALES
  'Crunches': 'Abdominales',
  'Plank': 'Plancha',
  'Russian Twists': 'Giros Rusos',
  'Leg Raises': 'Elevaciones de Piernas',
  'Mountain Climbers': 'Escaladores',
  'Dead Bug': 'Bicho Muerto',
  'Bicycle Crunches': 'Abdominales en Bicicleta'
};

/**
 * Traduce un nombre de ejercicio del inglés al español
 */
export function translateExerciseName(englishName: string): string {
  return exerciseTranslations[englishName] || englishName;
}

/**
 * Traduce un grupo muscular del inglés al español
 */
export function translateMuscleGroup(englishGroup: string): string {
  return muscleGroupTranslations[englishGroup.toLowerCase()] || englishGroup;
}

/**
 * Traduce un array de grupos musculares
 */
export function translateMuscleGroups(englishGroups: string[]): string[] {
  return englishGroups.map(group => translateMuscleGroup(group));
}

/**
 * Traduce ejercicios en un plan de entrenamiento
 */
export function translateWorkoutPlan(workoutPlan: any): any {
  if (!workoutPlan || !workoutPlan.exercises) {
    return workoutPlan;
  }

  return {
    ...workoutPlan,
    targetMuscleGroups: workoutPlan.targetMuscleGroups 
      ? translateMuscleGroups(workoutPlan.targetMuscleGroups)
      : workoutPlan.targetMuscleGroups,
    exercises: workoutPlan.exercises.map((exercise: any) => ({
      ...exercise,
      name: translateExerciseName(exercise.name),
      muscleGroup: exercise.muscleGroup 
        ? translateMuscleGroup(exercise.muscleGroup)
        : exercise.muscleGroup
    }))
  };
}

/**
 * Verifica si un texto contiene nombres de ejercicios en inglés
 */
export function hasEnglishExerciseNames(text: string): boolean {
  const englishExerciseNames = Object.keys(exerciseTranslations);
  return englishExerciseNames.some(name => 
    text.toLowerCase().includes(name.toLowerCase())
  );
}

/**
 * Traduce automáticamente cualquier nombre de ejercicio encontrado en un texto
 */
export function translateExerciseNamesInText(text: string): string {
  let translatedText = text;
  
  Object.entries(exerciseTranslations).forEach(([english, spanish]) => {
    const regex = new RegExp(english, 'gi');
    translatedText = translatedText.replace(regex, spanish);
  });
  
  return translatedText;
}
