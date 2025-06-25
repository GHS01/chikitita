import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traducciones
import es from './locales/es.json';
import en from './locales/en.json';

const resources = {
  es: {
    translation: es
  },
  en: {
    translation: en
  }
};

i18n
  // Detectar idioma del navegador
  .use(LanguageDetector)
  // Pasar la instancia i18n a react-i18next
  .use(initReactI18next)
  // Inicializar i18next
  .init({
    resources,
    
    // Idioma predeterminado: ESPAÑOL (como pidió Khan)
    fallbackLng: 'es',
    lng: 'es', // Forzar español por defecto
    
    // Configuración de detección
    detection: {
      // Orden de detección: localStorage -> navegador -> español
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Clave para localStorage
      lookupLocalStorage: 'fitbro-language',
      // Cache en localStorage
      caches: ['localStorage'],
    },

    // Configuración de desarrollo
    debug: process.env.NODE_ENV === 'development',

    // Configuración de namespace
    defaultNS: 'translation',

    // Configuración de carga
    load: 'languageOnly', // es, en (sin es-ES, en-US)

    // Configuración de fallback
    fallbackNS: false,

    // Configuración de plurales
    pluralSeparator: '_',
    contextSeparator: '_',

    // Configuración de interpolación (CORREGIDO - solo una vez)
    interpolation: {
      escapeValue: false,
      formatSeparator: ',',
      format: function(value, format, lng) {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        return value;
      }
    }
  });

export default i18n;
