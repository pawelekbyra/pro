'use client';

import { usePathname, useRouter } from '@/lib/navigation';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleSwitch = (nextLocale: string) => {
    router.replace(pathname, {locale: nextLocale, scroll: false});
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleSwitch('pl')}
        disabled={locale === 'pl'}
        className="px-2 py-1 text-sm rounded-md disabled:bg-pink-600 disabled:text-white bg-gray-200 text-black"
      >
        PL
      </button>
      <button
        onClick={() => handleSwitch('en')}
        disabled={locale === 'en'}
        className="px-2 py-1 text-sm rounded-md disabled:bg-pink-600 disabled:text-white bg-gray-200 text-black"
      >
        EN
      </button>
    </div>
  );
}
