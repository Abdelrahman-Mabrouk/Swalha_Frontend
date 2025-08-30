# Arabic Language Support for Swalha System

This document explains how Arabic language support has been implemented in the Swalha System frontend.

## Features

- **Bilingual Support**: English and Arabic languages
- **RTL Layout**: Proper right-to-left layout support for Arabic
- **Language Persistence**: Language preference is saved in localStorage
- **Automatic Detection**: Browser language detection with fallback to English
- **Font Support**: Noto Sans Arabic font for better Arabic text rendering

## How to Use

### Language Switching

1. **Language Switcher**: Click the globe icon (🌐) in the top header to toggle between English and Arabic
2. **Automatic Detection**: The system automatically detects your browser language on first visit
3. **Persistent**: Your language choice is remembered across sessions

### RTL Layout Features

When Arabic is selected:
- Text flows from right to left
- Sidebar appears on the right side
- Icons and spacing are automatically adjusted
- Form inputs and layouts are properly oriented

## Technical Implementation

### Files Added/Modified

- `src/i18n/index.js` - Main i18n configuration
- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/ar.json` - Arabic translations
- `src/contexts/LanguageContext.jsx` - Language state management
- `src/components/LanguageSwitcher.jsx` - Language toggle component
- `src/components/Layout.jsx` - Updated with translations and RTL support
- `src/pages/Login.jsx` - Updated with translations and RTL support
- `src/pages/Dashboard.jsx` - Updated with translations and RTL support
- `src/App.jsx` - Wrapped with LanguageProvider
- `src/main.jsx` - Added i18n import
- `src/index.css` - Added RTL styles and Arabic font support

### Dependencies Added

```json
{
  "react-i18next": "^13.0.0",
  "i18next": "^23.0.0",
  "i18next-browser-languagedetector": "^7.0.0"
}
```

### Key Components

#### LanguageContext
- Manages current language state
- Handles RTL/LTR switching
- Provides language switching functions
- Updates document direction and language attributes

#### LanguageSwitcher
- Displays current language with flag
- Provides toggle functionality
- Responsive design for mobile and desktop

#### Translation Files
- Structured JSON format
- Organized by feature/section
- Easy to maintain and extend

## Adding New Translations

### 1. Add to English file (`en.json`)
```json
{
  "newSection": {
    "newKey": "English text"
  }
}
```

### 2. Add to Arabic file (`ar.json`)
```json
{
  "newSection": {
    "newKey": "النص العربي"
  }
}
```

### 3. Use in Component
```jsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return <h1>{t('newSection.newKey')}</h1>;
};
```

## RTL Considerations

### CSS Classes
- Use `isRTL` from `useLanguage()` hook to conditionally apply RTL styles
- RTL-specific spacing: `space-x-reverse` for reversed margins
- RTL positioning: Adjust `left`/`right` properties based on language

### Layout Adjustments
- Sidebar positioning: `lg:right-0` for Arabic, `lg:left-0` for English
- Content padding: `lg:pr-64` for Arabic, `lg:pl-64` for English
- Icon positioning: Adjust margins based on language direction

### Form Elements
- Input padding: Adjust `pl-` and `pr-` classes based on RTL
- Icon positioning: Use conditional positioning for form icons

## Browser Support

- Modern browsers with ES6+ support
- RTL layout support
- Local storage for language persistence
- Font loading for Arabic text rendering

## Future Enhancements

- Additional language support
- Date and number formatting per locale
- Currency formatting per locale
- More comprehensive RTL component library
- Accessibility improvements for RTL users

## Troubleshooting

### Language Not Switching
- Check browser console for errors
- Verify i18n configuration is loaded
- Check localStorage for language preference

### RTL Layout Issues
- Ensure CSS RTL rules are properly applied
- Check component logic for RTL conditional rendering
- Verify Tailwind CSS RTL utilities are working

### Missing Translations
- Check translation files for missing keys
- Verify translation key usage in components
- Check for typos in translation keys

## Contributing

When adding new features:
1. Always include both English and Arabic translations
2. Test RTL layout thoroughly
3. Ensure proper spacing and positioning in both languages
4. Update this documentation if needed
