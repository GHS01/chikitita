import { useState, useEffect } from 'react';
// 🕐 SISTEMA HORARIO CENTRALIZADO
import { now } from '@/utils/timeSystem';
import { formatChatTime, formatWorkoutTime, formatFullDate } from '@/utils/timeFormatters';

/**
 * Custom hook for real-time clock display
 * Updates every minute and formats time in 12-hour format with AM/PM
 * MIGRADO AL SISTEMA HORARIO CENTRALIZADO
 */
export function useRealTime() {
  const [currentTime, setCurrentTime] = useState(now()); // 🕐 SISTEMA CENTRALIZADO

  useEffect(() => {
    // Update immediately
    setCurrentTime(now()); // 🕐 SISTEMA CENTRALIZADO

    // Set up interval to update every minute (60000ms)
    const interval = setInterval(() => {
      setCurrentTime(now()); // 🕐 SISTEMA CENTRALIZADO
    }, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // 📅 Formatear fecha y hora para meal plans
  const formatDateTimeForMealPlan = () => {
    const timeStr = formatChatTime(currentTime);
    // Formato personalizado: "31 May" en lugar de "5/31"
    const dateStr = currentTime.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
    return `${timeStr} | ${dateStr}`;
  };

  return {
    currentTime,
    time12h: formatChatTime(currentTime), // 🕐 SISTEMA CENTRALIZADO
    time24h: formatWorkoutTime(currentTime), // 🕐 SISTEMA CENTRALIZADO
    dateTime: formatDateTimeForMealPlan(), // 🕐 NUEVA: Fecha + Hora
    fullDate: formatFullDate(currentTime, 'medium'), // 🕐 NUEVA: Fecha completa
    hour: currentTime.getHours(),
    minute: currentTime.getMinutes()
  };
}
