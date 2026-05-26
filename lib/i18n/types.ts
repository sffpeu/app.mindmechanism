export type SupportedLocale = 'en' | 'de' | 'fi' | 'fr' | 'es' | 'it'

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'de', 'fi', 'fr', 'es', 'it']

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export type LocaleNamespace = 'common' | 'portal' | 'grammar-transit' | 'info'

export type TranslationDict = Record<string, unknown>
