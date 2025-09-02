import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a JSDOM window object. We need this to use DOMPurify on the server.
const window = new JSDOM('').window;

// Create a DOMPurify instance from the JSDOM window
const purify = DOMPurify(window as any);

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * @param dirty The dirty HTML string to sanitize.
 * @returns The sanitized HTML string.
 */
export function sanitize(dirty: string): string {
  return purify.sanitize(dirty);
}
