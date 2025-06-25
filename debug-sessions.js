import { supabase } from './server/supabase.ts';

async function debugSessions() {
  console.log('🔍 INVESTIGACIÓN PROFUNDA - Usuario 17');
  
  // 1. Verificar sesiones
  console.log('\n1️⃣ VERIFICANDO SESIONES...');
  const { data: sessions, error: sessionsError } = await supabase
    .from('workout_sessions')
    .select('id, status, started_at, completed_at, workout_plan_id')
    .eq('user_id', 17)
    .order('started_at', { ascending: false });
  
  if (sessionsError) {
    console.error('❌ Error sesiones:', sessionsError);
    return;
  }
  
  console.log(`📊 Total sesiones encontradas: ${sessions?.length || 0}`);
  sessions?.forEach(s => {
    console.log(`- ID: ${s.id}, STATUS: '${s.status}', Started: ${s.started_at}, Completed: ${s.completed_at}`);
  });
  
  // 2. Verificar exercise_logs
  console.log('\n2️⃣ VERIFICANDO EXERCISE LOGS...');
  const { data: logs, error: logsError } = await supabase
    .from('exercise_logs')
    .select(`
      id, exercise_name, weight_used, reps_completed,
      workout_sessions!inner(id, user_id, status)
    `)
    .eq('workout_sessions.user_id', 17);
  
  if (logsError) {
    console.error('❌ Error logs:', logsError);
  } else {
    console.log(`📊 Total exercise logs: ${logs?.length || 0}`);
    logs?.forEach(log => {
      console.log(`- Ejercicio: ${log.exercise_name}, Peso: ${log.weight_used}, Reps: ${log.reps_completed}, Session: ${log.workout_sessions.id}`);
    });
  }
  
  // 3. Verificar feedback
  console.log('\n3️⃣ VERIFICANDO FEEDBACK...');
  const { data: feedback, error: feedbackError } = await supabase
    .from('workout_feedback_sessions')
    .select(`
      id, post_satisfaction, post_rpe, post_progress_feeling,
      workout_sessions!inner(id, user_id, status)
    `)
    .eq('workout_sessions.user_id', 17);
  
  if (feedbackError) {
    console.error('❌ Error feedback:', feedbackError);
  } else {
    console.log(`📊 Total feedback: ${feedback?.length || 0}`);
    feedback?.forEach(f => {
      console.log(`- Satisfacción: ${f.post_satisfaction}, RPE: ${f.post_rpe}, Progreso: ${f.post_progress_feeling}, Session: ${f.workout_sessions.id}`);
    });
  }
  
  // 4. Verificar qué considera "completado"
  console.log('\n4️⃣ ANÁLISIS DE COMPLETADO...');
  // ✅ CORRECCIÓN: Usar validación mejorada para sesiones completadas
  const completedSessions = sessions?.filter(s =>
    s.status === 'completed' ||
    s.status === 'finished' ||
    (s.completed_at !== null && s.completed_at !== undefined)
  ) || [];
  console.log(`✅ Sesiones con status 'completed': ${completedSessions.length}`);
  
  const sessionsWithLogs = sessions?.filter(s => 
    logs?.some(log => log.workout_sessions.id === s.id)
  ) || [];
  console.log(`📝 Sesiones con exercise_logs: ${sessionsWithLogs.length}`);
  
  const sessionsWithFeedback = sessions?.filter(s => 
    feedback?.some(f => f.workout_sessions.id === s.id)
  ) || [];
  console.log(`💭 Sesiones con feedback: ${sessionsWithFeedback.length}`);
}

debugSessions().catch(console.error);
