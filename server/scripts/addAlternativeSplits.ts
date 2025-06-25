/**
 * 🏥 Script para añadir splits alternativos inteligentes
 * Estos splits son seguros para usuarios con limitaciones físicas específicas
 */

import { supabase } from '../supabase';

// Splits alternativos inteligentes para diferentes limitaciones
const alternativeSplits = [
  // 🦵 Para problemas de rodilla/piernas - Solo tren superior
  {
    split_name: "Upper Body Focus",
    split_type: "upper_body_focus",
    muscle_groups: ["chest", "back", "shoulders", "arms", "biceps", "triceps"],
    recovery_time_hours: 48,
    scientific_rationale: "Split diseñado específicamente para usuarios con limitaciones en tren inferior. Permite entrenamiento completo del tren superior con máxima seguridad.",
    difficulty_level: "intermediate",
    safe_for_limitations: ["knee_issues", "ankle_injury", "hip_problems"]
  },
  {
    split_name: "Torso Power",
    split_type: "torso_focus",
    muscle_groups: ["chest", "back", "shoulders", "core"],
    recovery_time_hours: 48,
    scientific_rationale: "Enfoque en torso y core, evitando completamente el tren inferior. Ideal para mantener fuerza funcional durante recuperación de lesiones de piernas.",
    difficulty_level: "beginner",
    safe_for_limitations: ["knee_issues", "ankle_injury", "hip_problems"]
  },
  {
    split_name: "Arms & Back Specialist",
    split_type: "arms_back_focus",
    muscle_groups: ["back", "biceps", "triceps", "forearms"],
    recovery_time_hours: 48,
    scientific_rationale: "Especialización en brazos y espalda, permitiendo desarrollo muscular sin comprometer articulaciones problemáticas del tren inferior.",
    difficulty_level: "intermediate",
    safe_for_limitations: ["knee_issues", "ankle_injury", "hip_problems"]
  },

  // 🤕 Para problemas de hombro - Solo tren inferior y core
  {
    split_name: "Lower Body Focus",
    split_type: "lower_body_focus",
    muscle_groups: ["legs", "glutes", "calves", "quadriceps", "hamstrings"],
    recovery_time_hours: 72,
    scientific_rationale: "Split centrado en tren inferior para usuarios con limitaciones en hombros o brazos. Permite mantener fuerza en piernas sin comprometer articulaciones superiores.",
    difficulty_level: "intermediate",
    safe_for_limitations: ["shoulder_issues", "wrist_problems"]
  },
  {
    split_name: "Core & Legs",
    split_type: "core_legs_focus",
    muscle_groups: ["legs", "glutes", "core", "calves"],
    recovery_time_hours: 48,
    scientific_rationale: "Combinación de core y piernas, evitando movimientos que comprometan hombros o muñecas. Ideal para mantener estabilidad y fuerza funcional.",
    difficulty_level: "beginner",
    safe_for_limitations: ["shoulder_issues", "wrist_problems"]
  },

  // 🤰 Para embarazo - Seguro y funcional
  {
    split_name: "Prenatal Safe",
    split_type: "prenatal_safe",
    muscle_groups: ["arms", "shoulders", "legs", "glutes"],
    recovery_time_hours: 24,
    scientific_rationale: "Split diseñado para embarazo, evitando ejercicios abdominales y de espalda que puedan ser riesgosos. Enfoque en mantener fuerza funcional.",
    difficulty_level: "beginner",
    safe_for_limitations: ["pregnancy"]
  },

  // 💓 Para condiciones cardíacas - Baja intensidad
  {
    split_name: "Cardiac Safe",
    split_type: "cardiac_safe",
    muscle_groups: ["arms", "legs", "chest", "back"],
    recovery_time_hours: 48,
    scientific_rationale: "Split de baja intensidad para usuarios con condiciones cardíacas. Permite entrenamiento completo con control de intensidad y frecuencia cardíaca.",
    difficulty_level: "beginner",
    safe_for_limitations: ["heart_condition", "asthma"]
  },

  // 🔄 Split universal seguro - Para múltiples limitaciones
  {
    split_name: "Universal Safe",
    split_type: "universal_safe",
    muscle_groups: ["arms", "shoulders"],
    recovery_time_hours: 24,
    scientific_rationale: "Split ultra-seguro que puede ser usado por usuarios con múltiples limitaciones. Enfoque en movimientos básicos y seguros.",
    difficulty_level: "beginner",
    safe_for_limitations: ["knee_issues", "back_problems", "shoulder_issues", "pregnancy", "heart_condition", "asthma", "wrist_problems", "ankle_injury", "hip_problems"]
  }
];

async function addAlternativeSplits() {
  console.log('🏥 Añadiendo splits alternativos inteligentes...');

  try {
    // Verificar conexión
    const { data: testData, error: testError } = await supabase
      .from('scientific_splits')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Error de conexión a Supabase:', testError);
      return;
    }

    console.log('✅ Conexión a Supabase exitosa');

    // Insertar splits alternativos
    for (const split of alternativeSplits) {
      console.log(`📝 Insertando: ${split.split_name}...`);
      
      const { data, error } = await supabase
        .from('scientific_splits')
        .insert(split)
        .select();

      if (error) {
        console.error(`❌ Error insertando ${split.split_name}:`, error);
      } else {
        console.log(`✅ ${split.split_name} insertado exitosamente`);
      }
    }

    console.log('🎉 Todos los splits alternativos han sido añadidos');

    // Verificar total de splits
    const { data: allSplits, error: countError } = await supabase
      .from('scientific_splits')
      .select('split_name, split_type');

    if (!countError && allSplits) {
      console.log(`📊 Total de splits en base de datos: ${allSplits.length}`);
      console.log('📋 Splits disponibles:');
      allSplits.forEach(split => {
        console.log(`   - ${split.split_name} (${split.split_type})`);
      });
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  addAlternativeSplits()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script falló:', error);
      process.exit(1);
    });
}

export { addAlternativeSplits };
