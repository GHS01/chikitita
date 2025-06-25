import { useTranslation } from 'react-i18next';
import { useCallback, useEffect } from 'react';

// Tipos para los idiomas soportados
export type SupportedLanguage = 'es' | 'en';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

// Configuración de idiomas disponibles
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  }
];

/**
 * 🌐 Hook personalizado para manejo de idiomas
 * Proporciona funcionalidades completas de internacionalización
 */
export const useLanguage = () => {
  const { t, i18n } = useTranslation();

  // Idioma actual
  const currentLanguage = i18n.language as SupportedLanguage;

  // Obtener información del idioma actual
  const getCurrentLanguageInfo = useCallback((): LanguageOption => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  }, [currentLanguage]);

  // Cambiar idioma
  const changeLanguage = useCallback(async (languageCode: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(languageCode);
      
      // Guardar en localStorage
      localStorage.setItem('fitbro-language', languageCode);
      
      // TODO: Guardar en Supabase (perfil del usuario)
      // await updateUserLanguagePreference(languageCode);
      
      console.log(`🌐 Idioma cambiado a: ${languageCode}`);
    } catch (error) {
      console.error('❌ Error al cambiar idioma:', error);
    }
  }, [i18n]);

  // Detectar idioma del navegador
  const detectBrowserLanguage = useCallback((): SupportedLanguage => {
    const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
    return SUPPORTED_LANGUAGES.some(lang => lang.code === browserLang) ? browserLang : 'es';
  }, []);

  // Inicializar idioma
  const initializeLanguage = useCallback(() => {
    // 1. Verificar localStorage
    const savedLanguage = localStorage.getItem('fitbro-language') as SupportedLanguage;
    if (savedLanguage && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLanguage)) {
      changeLanguage(savedLanguage);
      return;
    }

    // 2. Usar español por defecto (como pidió Khan)
    changeLanguage('es');
  }, [changeLanguage]);

  // Verificar si un idioma está disponible
  const isLanguageSupported = useCallback((languageCode: string): boolean => {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
  }, []);

  // Obtener texto traducido con fallback
  const getText = useCallback((key: string, options?: any): string => {
    try {
      return t(key, options);
    } catch (error) {
      console.warn(`⚠️ Traducción no encontrada para: ${key}`);
      return key; // Fallback al key original
    }
  }, [t]);

  // Formatear fecha según idioma
  const formatDate = useCallback((date: Date, options?: Intl.DateTimeFormatOptions): string => {
    const locale = currentLanguage === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleDateString(locale, options);
  }, [currentLanguage]);

  // Formatear número según idioma
  const formatNumber = useCallback((number: number, options?: Intl.NumberFormatOptions): string => {
    const locale = currentLanguage === 'es' ? 'es-ES' : 'en-US';
    return number.toLocaleString(locale, options);
  }, [currentLanguage]);

  // Formatear moneda según idioma
  const formatCurrency = useCallback((amount: number, currency: string = 'USD'): string => {
    const locale = currentLanguage === 'es' ? 'es-ES' : 'en-US';
    return amount.toLocaleString(locale, {
      style: 'currency',
      currency: currency
    });
  }, [currentLanguage]);

  // Efecto para inicializar idioma al montar el componente
  useEffect(() => {
    if (!currentLanguage || currentLanguage === 'cimode') {
      initializeLanguage();
    }
  }, [currentLanguage, initializeLanguage]);

  return {
    // Funciones principales
    t: getText,
    changeLanguage,
    
    // Información del idioma
    currentLanguage,
    currentLanguageInfo: getCurrentLanguageInfo(),
    supportedLanguages: SUPPORTED_LANGUAGES,
    
    // Utilidades
    isLanguageSupported,
    detectBrowserLanguage,
    initializeLanguage,
    
    // Formateo
    formatDate,
    formatNumber,
    formatCurrency,
    
    // Estado
    isReady: i18n.isInitialized,
    isLoading: !i18n.isInitialized
  };
};

export default useLanguage;
