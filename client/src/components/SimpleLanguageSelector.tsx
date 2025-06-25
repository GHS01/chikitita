import React, { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { ModernEmoji } from '@/components/ui/modern-emoji';

/**
 * 🌐 Selector de Idioma Simple para Pruebas
 * Versión básica sin dependencias complejas
 */
export const SimpleLanguageSelector: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState('es');
  const [isOpen, setIsOpen] = useState(false);

  // Component renders successfully

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    setIsOpen(false);
    
    // Guardar en localStorage
    localStorage.setItem('fitbro-language', languageCode);
    
    // Language changed successfully
  };

  return (
    <div className="relative w-full">
      {/* 🚨 DEBUG: Componente visible */}
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
        <ModernEmoji emoji="🌐" size={16} /> SELECTOR DE IDIOMA FUNCIONANDO - DEBUG
      </div>

      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Globe className="inline w-4 h-4 mr-1" />
        Idioma
      </label>

      {/* Botón principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-between w-full px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out cursor-pointer"
      >
        <div className="flex items-center space-x-2">
          {/* Bandera */}
          <ModernEmoji emoji={currentLang.flag} size={18} />
          
          {/* Nombre del idioma */}
          <span className="text-sm font-medium text-gray-900 truncate">
            {currentLang.name}
          </span>
        </div>

        {/* Icono de chevron */}
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <ul className="py-1">
            {languages.map((language) => {
              const isSelected = language.code === currentLanguage;
              
              return (
                <li key={language.code}>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange(language.code)}
                    className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 ease-in-out ${
                      isSelected 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-700'
                    }`}
                    disabled={isSelected}
                  >
                    {/* Bandera */}
                    <ModernEmoji emoji={language.flag} size={18} />
                    
                    {/* Nombre del idioma */}
                    <span className="text-sm truncate">
                      {language.name}
                    </span>
                    
                    {/* Indicador de selección */}
                    {isSelected && (
                      <span className="ml-auto">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Overlay para cerrar dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default SimpleLanguageSelector;
