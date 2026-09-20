import type { AppLanguage } from '@/shared/utils/languages';

import enUS from './locales/en-us.json';
import zhCN from './locales/zh-cn.json';

export const resources = {
  'en-US': { translation: enUS },
  'zh-CN': { translation: zhCN },
} satisfies Record<AppLanguage, { translation: Record<string, string> }>;
