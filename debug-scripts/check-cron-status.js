/**
 * ⏰ SCRIPT DE VERIFICACIÓN DE CRON JOBS
 * Ejecutar desde la carpeta server: node ../debug-scripts/check-cron-status.js
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

async function checkCronStatus() {
  try {
    console.log('⏰ VERIFICANDO ESTADO DE CRON JOBS Y GENERACIÓN AUTOMÁTICA...\n');

    // 1. Verificar rutinas generadas recientemente
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: recentWorkouts, error: recentError } = await supabase
      .from('pre_generated_workouts')
      .select('user_id, workout_date, split_name, created_at')
      .gte('created_at', yesterdayStr)
      .order('created_at', { ascending: false });

    if (recentError) {
      console.error('❌ Error obteniendo rutinas recientes:', recentError);
    } else {
      console.log(`📊 RUTINAS GENERADAS EN LAS ÚLTIMAS 24 HORAS: ${recentWorkouts.length}`);
      
      if (recentWorkouts.length > 0) {
        console.log('\n📋 Rutinas generadas recientemente:');
        recentWorkouts.slice(0, 10).forEach(workout => {
          const createdAt = new Date(workout.created_at).toLocaleString();
          console.log(`   - Usuario ${workout.user_id}: ${workout.split_name} para ${workout.workout_date} (creada: ${createdAt})`);
        });
        
        if (recentWorkouts.length > 10) {
          console.log(`   ... y ${recentWorkouts.length - 10} más`);
        }
      } else {
        console.log('⚠️ No se han generado rutinas automáticamente en las últimas 24 horas');
        console.log('   Esto podría indicar que:');
        console.log('   - Los cron jobs no están funcionando');
        console.log('   - No hay usuarios con asignaciones activas');
        console.log('   - El servidor no ha estado corriendo');
      }
    }

    // 2. Verificar usuarios con asignaciones activas
    const { data: activeAssignments, error: assignmentsError } = await supabase
      .from('user_split_assignments')
      .select('user_id')
      .eq('is_active', true);

    if (assignmentsError) {
      console.error('❌ Error obteniendo asignaciones activas:', assignmentsError);
    } else {
      const uniqueUsers = [...new Set(activeAssignments.map(a => a.user_id))];
      console.log(`\n👥 USUARIOS CON ASIGNACIONES ACTIVAS: ${uniqueUsers.length}`);
      
      if (uniqueUsers.length === 0) {
        console.log('⚠️ No hay usuarios con asignaciones activas');
        console.log('   Los cron jobs no generarán rutinas porque no hay usuarios configurados');
      }
    }

    // 3. Verificar rutinas para hoy
    const today = new Date().toISOString().split('T')[0];
    const { data: todayWorkouts, error: todayError } = await supabase
      .from('pre_generated_workouts')
      .select('user_id, split_name, is_consumed')
      .eq('workout_date', today);

    if (todayError) {
      console.error('❌ Error obteniendo rutinas de hoy:', todayError);
    } else {
      console.log(`\n📅 RUTINAS PARA HOY (${today}): ${todayWorkouts.length}`);
      
      if (todayWorkouts.length > 0) {
        const consumed = todayWorkouts.filter(w => w.is_consumed).length;
        const available = todayWorkouts.length - consumed;
        
        console.log(`   - Disponibles: ${available}`);
        console.log(`   - Consumidas: ${consumed}`);
        
        console.log('\n📋 Rutinas de hoy por usuario:');
        todayWorkouts.forEach(workout => {
          const status = workout.is_consumed ? '(CONSUMIDA)' : '(DISPONIBLE)';
          console.log(`   - Usuario ${workout.user_id}: ${workout.split_name} ${status}`);
        });
      } else {
        console.log('⚠️ No hay rutinas generadas para hoy');
        console.log('   Esto podría indicar que:');
        console.log('   - Hoy es día de descanso para todos los usuarios');
        console.log('   - Los cron jobs no generaron rutinas anoche');
        console.log('   - Hay un problema en la generación automática');
      }
    }

    // 4. Verificar próximos días
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const { data: futureWorkouts, error: futureError } = await supabase
      .from('pre_generated_workouts')
      .select('workout_date, user_id')
      .gt('workout_date', today)
      .lte('workout_date', nextWeekStr);

    if (futureError) {
      console.error('❌ Error obteniendo rutinas futuras:', futureError);
    } else {
      console.log(`\n📈 RUTINAS PARA LOS PRÓXIMOS 7 DÍAS: ${futureWorkouts.length}`);
      
      if (futureWorkouts.length === 0) {
        console.log('⚠️ No hay rutinas generadas para los próximos días');
        console.log('   Recomendación: Ejecutar generación manual de cache');
      }
    }

    console.log('\n🎯 ANÁLISIS COMPLETADO');
    console.log('\n💡 RECOMENDACIONES:');
    
    if (recentWorkouts.length === 0) {
      console.log('🚨 CRÍTICO: No hay generación automática reciente');
      console.log('   - Verificar que el servidor esté corriendo 24/7');
      console.log('   - Verificar configuración de cron jobs');
      console.log('   - Considerar generación manual de cache');
    }
    
    if (todayWorkouts.length === 0 && uniqueUsers.length > 0) {
      console.log('⚠️ ADVERTENCIA: Hay usuarios activos pero no rutinas para hoy');
      console.log('   - Verificar si hoy es día de descanso general');
      console.log('   - Considerar regenerar cache manualmente');
    }

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

// Ejecutar verificación
checkCronStatus();
