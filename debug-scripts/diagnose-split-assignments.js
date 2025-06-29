/**
 * 🔍 SCRIPT DE DIAGNÓSTICO MANUAL
 * Ejecutar desde la carpeta server: node ../debug-scripts/diagnose-split-assignments.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseSplitAssignments() {
  try {
    console.log('🔍 INICIANDO DIAGNÓSTICO DE ASIGNACIONES DE SPLITS...\n');

    // 1. Obtener todos los usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(10);

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }

    console.log(`👥 Usuarios encontrados: ${users.length}\n`);

    // 2. Para cada usuario, obtener sus asignaciones
    for (const user of users) {
      console.log(`\n🔍 DIAGNÓSTICO PARA USUARIO: ${user.name || user.email} (ID: ${user.id})`);
      console.log('='.repeat(80));

      // Obtener asignaciones de splits
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_split_assignments')
        .select(`
          *,
          scientific_splits (
            id,
            split_name,
            split_type,
            muscle_groups,
            scientific_rationale
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (assignmentsError) {
        console.error(`❌ Error obteniendo asignaciones para usuario ${user.id}:`, assignmentsError);
        continue;
      }

      // Mapear días de la semana
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      console.log('\n📅 ASIGNACIONES POR DÍA:');
      daysOfWeek.forEach((day, index) => {
        const assignment = assignments.find(a => a.day_name === day);
        if (assignment) {
          console.log(`✅ ${dayNames[index]}: ${assignment.scientific_splits?.split_name} (${assignment.scientific_splits?.muscle_groups?.join(', ')})`);
        } else {
          console.log(`🛌 ${dayNames[index]}: DÍA DE DESCANSO`);
        }
      });

      // Obtener rutinas en cache
      const today = new Date().toISOString().split('T')[0];
      const { data: cachedWorkouts, error: cacheError } = await supabase
        .from('pre_generated_workouts')
        .select('workout_date, split_name, target_muscle_groups, is_consumed')
        .eq('user_id', user.id)
        .gte('workout_date', today)
        .order('workout_date')
        .limit(7);

      if (cacheError) {
        console.error(`❌ Error obteniendo cache para usuario ${user.id}:`, cacheError);
      } else {
        console.log('\n💾 RUTINAS EN CACHE:');
        if (cachedWorkouts.length === 0) {
          console.log('⚠️ No hay rutinas en cache');
        } else {
          cachedWorkouts.forEach(workout => {
            const date = new Date(workout.workout_date);
            const dayName = dayNames[date.getDay()];
            console.log(`📅 ${workout.workout_date} (${dayName}): ${workout.split_name} - ${workout.target_muscle_groups?.join(', ')} ${workout.is_consumed ? '(CONSUMIDA)' : ''}`);
          });
        }
      }

      // Verificar día actual
      const todayDayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todayAssignment = assignments.find(a => a.day_name === todayDayOfWeek);
      const todayCache = cachedWorkouts?.find(w => w.workout_date === today);

      console.log('\n🎯 ANÁLISIS DEL DÍA ACTUAL:');
      console.log(`📅 Hoy es: ${dayNames[daysOfWeek.indexOf(todayDayOfWeek)]}`);

      if (todayAssignment) {
        console.log(`✅ Asignación: ${todayAssignment.scientific_splits?.split_name} (${todayAssignment.scientific_splits?.muscle_groups?.join(', ')})`);
      } else {
        console.log(`🛌 Hoy es día de descanso`);
      }

      if (todayCache) {
        console.log(`💾 Cache: ${todayCache.split_name} (${todayCache.target_muscle_groups?.join(', ')})`);
      } else {
        console.log(`⚠️ No hay rutina en cache para hoy`);
      }

      // Detectar inconsistencias
      console.log('\n🚨 DETECCIÓN DE PROBLEMAS:');
      let hasProblems = false;

      if (!todayAssignment && todayCache) {
        console.log('❌ PROBLEMA: Hay rutina en cache pero no hay asignación para hoy (día de descanso)');
        hasProblems = true;
      }

      if (todayAssignment && todayCache) {
        const assignedMuscles = todayAssignment.scientific_splits?.muscle_groups || [];
        const cachedMuscles = todayCache.target_muscle_groups || [];

        if (JSON.stringify(assignedMuscles.sort()) !== JSON.stringify(cachedMuscles.sort())) {
          console.log('❌ PROBLEMA: Los músculos en cache no coinciden con la asignación');
          console.log(`   Asignación: ${assignedMuscles.join(', ')}`);
          console.log(`   Cache: ${cachedMuscles.join(', ')}`);
          hasProblems = true;
        }
      }

      if (!hasProblems) {
        console.log('✅ No se detectaron problemas para este usuario');
      }

      console.log('\n' + '='.repeat(80));
    }

    console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
    console.log('\n💡 RECOMENDACIONES:');
    console.log('1. Si hay rutinas en cache para días de descanso → Limpiar cache');
    console.log('2. Si los músculos no coinciden → Regenerar cache');
    console.log('3. Si no hay asignaciones → Configurar splits en la app');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnoseSplitAssignments();