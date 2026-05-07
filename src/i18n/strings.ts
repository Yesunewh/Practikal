/**
 * @deprecated Import from `./messages` and use `useI18n().messages` in components.
 * Kept for any legacy `getStrings(locale)` calls with an explicit locale.
 */
export type { Locale, Messages } from './messages';
export { getMessages, interpolate } from './messages';

import type { Locale } from './messages';
import { getMessages } from './messages';

export function getStrings(locale: Locale = 'en') {
  return getMessages(locale);
}
