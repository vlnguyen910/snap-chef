import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Sidebar
      sidebar: {
        my_kitchen: 'My Kitchen',
        admin_panel: 'Admin Panel',
        my_profile: 'My Profile',
        my_recipes: 'My Recipes',
        favorites: 'Favorites',
        settings: 'Settings',
        dashboard: 'Dashboard',
        approval_queue: 'Approval Queue',
        content_manager: 'Content Manager',
        users: 'Users',
        analytics: 'Analytics',
        role: 'Role',
      },
      // Settings Page
      settings: {
        title: 'Settings',
        subtitle: 'Customize your experience',
        
        // Appearance Section
        appearance: 'Appearance',
        appearance_desc: 'Choose display theme',
        light_mode: 'Light',
        light_mode_desc: 'Light mode',
        dark_mode: 'Dark',
        dark_mode_desc: 'Dark mode',
        system_mode: 'System',
        system_mode_desc: 'Auto',
        
        // View Options
        view_options: 'View Options',
        view_options_desc: 'Adjust content display',
        compact_view: 'Compact View',
        compact_view_desc: 'Display content in compact form, saving space',
        
        // Language
        language: 'Language',
        language_desc: 'Choose display language',
        vietnamese: 'Vietnamese',
        english: 'English',
        english_us: 'English (US)',
        
        // Info Note
        note_title: 'Note',
        note_desc: 'These settings are saved in your browser. They are not synced with the server and will only apply to this device.',
        
        // Toast Messages
        theme_applied: 'theme applied',
        light_theme: 'Light mode',
        dark_theme: 'Dark mode',
        system_theme: 'System mode',
        compact_on: 'Compact view enabled',
        compact_off: 'Compact view disabled',
        language_changed: 'Language changed to',
      },
    },
  },
  vi: {
    translation: {
      // Sidebar
      sidebar: {
        my_kitchen: 'My Kitchen',
        admin_panel: 'Admin Panel',
        my_profile: 'My Profile',
        my_recipes: 'My Recipes',
        favorites: 'Favorites',
        settings: 'Cài đặt',
        dashboard: 'Dashboard',
        approval_queue: 'Approval Queue',
        content_manager: 'Content Manager',
        users: 'Users',
        analytics: 'Analytics',
        role: 'Vai trò',
      },
      // Settings Page
      settings: {
        title: 'Cài đặt',
        subtitle: 'Tùy chỉnh trải nghiệm của bạn',
        
        // Appearance Section
        appearance: 'Giao diện',
        appearance_desc: 'Chọn chủ đề hiển thị',
        light_mode: 'Sáng',
        light_mode_desc: 'Chế độ sáng',
        dark_mode: 'Tối',
        dark_mode_desc: 'Chế độ tối',
        system_mode: 'Hệ thống',
        system_mode_desc: 'Tự động',
        
        // View Options
        view_options: 'Tùy chọn hiển thị',
        view_options_desc: 'Điều chỉnh cách hiển thị nội dung',
        compact_view: 'Chế độ thu gọn',
        compact_view_desc: 'Hiển thị nội dung ở dạng thu gọn, tiết kiệm không gian',
        
        // Language
        language: 'Ngôn ngữ',
        language_desc: 'Chọn ngôn ngữ hiển thị',
        vietnamese: 'Tiếng Việt',
        english: 'English',
        english_us: 'English (US)',
        
        // Info Note
        note_title: 'Lưu ý',
        note_desc: 'Các cài đặt này được lưu trên trình duyệt của bạn. Chúng chưa được đồng bộ với máy chủ và sẽ chỉ áp dụng trên thiết bị này.',
        
        // Toast Messages
        theme_applied: 'đã được áp dụng',
        light_theme: 'Chế độ Sáng',
        dark_theme: 'Chế độ Tối',
        system_theme: 'Chế độ Hệ thống',
        compact_on: 'Chế độ thu gọn đã bật',
        compact_off: 'Chế độ thu gọn đã tắt',
        language_changed: 'Ngôn ngữ đã đổi sang',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    lng: localStorage.getItem('language') || 'vi', // Get from localStorage or default to Vietnamese
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },
  });

export default i18n;
