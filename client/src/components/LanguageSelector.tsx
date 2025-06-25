import React, { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage, type SupportedLanguage } from '@/hooks/useLanguage';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  showFlag?: boolean;
  showLabel?: boolean;
}

/**
 * 🌐 Selector de Idioma Profesional
 * Componente elegante para cambiar entre español e inglés
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'default',
  showFlag = true,
  showLabel = true
}) => {
  const { 
    currentLanguage, 
    currentLanguageInfo, 
    supportedLanguages, 
    changeLanguage, 
    t 
  } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (languageCode: SupportedLanguage) => {
    await changeLanguage(languageCode);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Estilos base según variante
  const getBaseStyles = () => {
    switch (variant) {
      case 'compact':
        return 'min-w-[120px]';
      case 'minimal':
        return 'min-w-[100px]';
      default:
        return 'min-w-[140px]';
    }
  };

  // Estilos del botón principal
  const buttonStyles = `
    relative inline-flex items-center justify-between w-full px-3 py-2
    bg-white border border-gray-200 rounded-lg shadow-sm
    hover:bg-gray-50 hover:border-gray-300
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    transition-all duration-200 ease-in-out
    cursor-pointer group
    ${getBaseStyles()}
  `;

  // Estilos del dropdown
  const dropdownStyles = `
    absolute top-full left-0 right-0 mt-1 z-50
    bg-white border border-gray-200 rounded-lg shadow-lg
    overflow-hidden
    transform transition-all duration-200 ease-in-out
    ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
  `;

  return (
    <div className={`relative ${className}`}>
      {/* Label opcional */}
      {showLabel && variant === 'default' && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Globe className="inline w-4 h-4 mr-1" />
          {t('profile.language')}
        </label>
      )}

      {/* Botón principal */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={buttonStyles}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('profile.language')}
      >
        <div className="flex items-center space-x-2">
          {/* Bandera */}
          {showFlag && (
            <span className="text-lg" role="img" aria-label={currentLanguageInfo.name}>
              {currentLanguageInfo.flag}
            </span>
          )}
          
          {/* Nombre del idioma */}
          <span className="text-sm font-medium text-gray-900 truncate">
            {variant === 'minimal' 
              ? currentLanguageInfo.code.toUpperCase()
              : currentLanguageInfo.nativeName
            }
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
      <div className={dropdownStyles}>
        <ul role="listbox" className="py-1">
          {supportedLanguages.map((language) => {
            const isSelected = language.code === currentLanguage;
            
            return (
              <li key={language.code} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => handleLanguageChange(language.code)}
                  className={`
                    w-full px-3 py-2 text-left flex items-center space-x-2
                    hover:bg-blue-50 hover:text-blue-700
                    transition-colors duration-150 ease-in-out
                    ${isSelected 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-700'
                    }
                  `}
                  disabled={isSelected}
                >
                  {/* Bandera */}
                  <span className="text-lg" role="img" aria-label={language.name}>
                    {language.flag}
                  </span>
                  
                  {/* Nombre del idioma */}
                  <span className="text-sm truncate">
                    {language.nativeName}
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

export default LanguageSelector;
