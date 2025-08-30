import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!['en', 'pl'].includes(locale)) {
    // This could be a redirect to a default locale if you want
    // For now, we'll just throw an error.
    throw new Error(`Unsupported locale: ${locale}`);
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
