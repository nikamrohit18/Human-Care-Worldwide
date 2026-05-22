import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { LANGUAGES } from '@/lib/i18n';
import Colors from '@/constants/Colors';

export function LanguageToggle() {
  const { language, isEnglishMode, toggleEnglishMode } = useLanguage();
  if (language === 'en') return null;
  const nativeMeta = LANGUAGES.find(l => l.code === language);
  const label = isEnglishMode ? (nativeMeta?.nativeLabel ?? language.toUpperCase()) : 'EN';
  return (
    <TouchableOpacity style={styles.btn} onPress={toggleEnglishMode} activeOpacity={0.7}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
