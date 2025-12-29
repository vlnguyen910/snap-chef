import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Eye, Globe, Check } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTheme } from '@/context/themeContext';
import { toast } from 'sonner';

type Language = 'en' | 'vi';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [compactView, setCompactView] = useState(false);
  const [language, setLanguage] = useState<Language>('vi');

  useDocumentTitle(t('settings.title'));

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedCompactView = localStorage.getItem('compactView') === 'true';
    const savedLanguage = (localStorage.getItem('language') || i18n.language) as Language;

    setLanguage(savedLanguage);
    setCompactView(savedCompactView);
  }, [i18n.language]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    const themeName = newTheme === 'light' ? t('settings.light_theme') : newTheme === 'dark' ? t('settings.dark_theme') : t('settings.system_theme');
    toast.success(`${themeName} ${t('settings.theme_applied')}`);
  };

  const handleCompactViewToggle = () => {
    const newValue = !compactView;
    setCompactView(newValue);
    localStorage.setItem('compactView', String(newValue));
    toast.success(newValue ? t('settings.compact_on') : t('settings.compact_off'));
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    const langName = newLanguage === 'en' ? 'English' : 'Tiếng Việt';
    toast.success(`${t('settings.language_changed')} ${langName}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <Sun className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('settings.appearance')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.appearance_desc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Light Mode */}
            <button
              onClick={() => handleThemeChange('light')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 bg-white dark:bg-gray-700'
              }`}
            >
              {theme === 'light' && (
                <div className="absolute top-2 right-2">
                  <Check className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              )}
              <div className="flex flex-col items-center gap-2">
                <Sun className="h-8 w-8 text-yellow-500" />
                <span className="font-semibold text-gray-900 dark:text-white">{t('settings.light_mode')}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('settings.light_mode_desc')}</span>
              </div>
            </button>

            {/* Dark Mode */}
            <button
              onClick={() => handleThemeChange('dark')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 bg-white dark:bg-gray-700'
              }`}
            >
              {theme === 'dark' && (
                <div className="absolute top-2 right-2">
                  <Check className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              )}
              <div className="flex flex-col items-center gap-2">
                <Moon className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                <span className="font-semibold text-gray-900 dark:text-white">{t('settings.dark_mode')}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('settings.dark_mode_desc')}</span>
              </div>
            </button>

            {/* System Mode */}
            <button
              onClick={() => handleThemeChange('system')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                theme === 'system'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 bg-white dark:bg-gray-700'
              }`}
            >
              {theme === 'system' && (
                <div className="absolute top-2 right-2">
                  <Check className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              )}
              <div className="flex flex-col items-center gap-2">
                <Monitor className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-900 dark:text-white">{t('settings.system_mode')}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('settings.system_mode_desc')}</span>
              </div>
            </button>
          </div>
        </div>

        {/* View Options Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('settings.view_options')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.view_options_desc')}</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('settings.compact_view')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('settings.compact_view_desc')}
              </p>
            </div>
            <button
              onClick={handleCompactViewToggle}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                compactView ? 'bg-orange-600 dark:bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-gray-200 shadow-lg transition-transform ${
                  compactView ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Language Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('settings.language')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.language_desc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vietnamese */}
            <button
              onClick={() => handleLanguageChange('vi')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                language === 'vi'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 bg-white dark:bg-gray-700'
              }`}
            >
              {language === 'vi' && (
                <div className="absolute top-2 right-2">
                  <Check className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-3xl">🇻🇳</span>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">{t('settings.vietnamese')}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Vietnamese</div>
                </div>
              </div>
            </button>

            {/* English */}
            <button
              onClick={() => handleLanguageChange('en')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                language === 'en'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 bg-white dark:bg-gray-700'
              }`}
            >
              {language === 'en' && (
                <div className="absolute top-2 right-2">
                  <Check className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-3xl">🇺🇸</span>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">{t('settings.english')}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t('settings.english_us')}</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-semibold mb-1">{t('settings.note_title')}</p>
              <p>
                {t('settings.note_desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
