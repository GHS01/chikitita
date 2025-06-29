/**
 * 🔧 SCRIPT DE CORRECCIÓN DE DATOS CORRUPTOS
 * Ejecutar desde la carpeta server: node ../debug-scripts/fix-corrupted-data.js
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

async function fixCorruptedData() {
  try {
    console.log('🔧 INICIANDO CORRECCIÓN DE DATOS CORRUPTOS...\n');

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

    // 2. Para cada usuario, limpiar cache corrupto
    for (const user of users) {
      console.log(`\n🔧 CORRIGIENDO DATOS PARA: ${user.name || user.email} (ID: ${user.id})`);
      console.log('='.repeat(80));

      // Obtener asignaciones actuales
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_split_assignments')
        .select('day_name, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (assignmentsError) {
        console.error(`❌ Error obteniendo asignaciones para usuario ${user.id}:`, assignmentsError);
        continue;
      }

      const assignedDays = assignments.map(a => a.day_name);
      console.log(`📅 Días asignados: ${assignedDays.join(', ')}`);

      // Obtener rutinas en cache
      const today = new Date().toISOString().split('T')[0];
      const { data: cachedWorkouts, error: cacheError } = await supabase
        .from('pre_generated_workouts')
        .select('id, workout_date, split_name')
        .eq('user_id', user.id)
        .gte('workout_date', today);

      if (cacheError) {
        console.error(`❌ Error obteniendo cache para usuario ${user.id}:`, cacheError);
        continue;
      }

      console.log(`💾 Rutinas en cache: ${cachedWorkouts.length}`);

      // Identificar rutinas corruptas (cache para días sin asignación)
      const corruptedWorkouts = [];
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      for (const workout of cachedWorkouts) {
        const date = new Date(workout.workout_date);
        const dayName = daysOfWeek[date.getDay()];
        
        if (!assignedDays.includes(dayName)) {
          corruptedWorkouts.push(workout);
        }
      }

      console.log(`🚨 Rutinas corruptas encontradas: ${corruptedWorkouts.length}`);

      if (corruptedWorkouts.length > 0) {
        console.log('📋 Rutinas a eliminar:');
        corruptedWorkouts.forEach(workout => {
          const date = new Date(workout.workout_date);
          const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
          console.log(`   - ${workout.workout_date} (${dayName}): ${workout.split_name}`);
        });

        // Eliminar rutinas corruptas
        const workoutIds = corruptedWorkouts.map(w => w.id);
        const { error: deleteError } = await supabase
          .from('pre_generated_workouts')
          .delete()
          .in('id', workoutIds);

        if (deleteError) {
          console.error(`❌ Error eliminando rutinas corruptas:`, deleteError);
        } else {
          console.log(`✅ ${corruptedWorkouts.length} rutinas corruptas eliminadas`);
        }
      } else {
        console.log('✅ No se encontraron rutinas corruptas');
      }

      console.log('\n' + '='.repeat(80));
    }

    console.log('\n🎯 CORRECCIÓN COMPLETADA');
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('1. Verificar que las asignaciones de splits sean correctas en la app');
    console.log('2. El sistema regenerará automáticamente las rutinas correctas');
    console.log('3. Probar generar una nueva rutina para verificar');

  } catch (error) {
    console.error('❌ Error en corrección:', error);
  }
}

// Ejecutar corrección
fixCorruptedData();
