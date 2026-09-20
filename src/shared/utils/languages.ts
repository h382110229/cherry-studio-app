/** Supported UI languages (Hawk AI Assistant: English + Chinese only) */
export const APP_LANGUAGES = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
] as const;

export type AppLanguage = (typeof APP_LANGUAGES)[number]['value'];
export const DEFAULT_APP_LANGUAGE: AppLanguage = 'zh-CN';

/** Resolve presentation without rewriting a saved preference. Null follows the device. */
export function resolveAppLanguage(
  preference: string | null | undefined,
  deviceLanguages: readonly string[] = [],
): AppLanguage {
  if (preference != null) return matchAppLanguage(preference) ?? DEFAULT_APP_LANGUAGE;

  for (const language of deviceLanguages) {
    const matched = matchAppLanguage(language);
    if (matched) return matched;
  }

  return DEFAULT_APP_LANGUAGE;
}

function matchAppLanguage(language: string): AppLanguage | undefined {
  const tag = language.trim().replaceAll('_', '-').toLowerCase();
  if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(tag)) return undefined;

  const parts = tag.split('-');
  if (parts[0] === 'zh') {
    if (parts.includes('hans')) return 'zh-CN';
    if (parts.includes('hant') || parts.some((part) => ['tw', 'hk', 'mo'].includes(part))) {
      return 'zh-CN';
    }
    return 'zh-CN';
  }

  return APP_LANGUAGES.find(({ value }) => value.toLowerCase().split('-')[0] === parts[0])?.value;
}
