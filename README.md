# Migracja Ting Tong do Next.js

Ten projekt to migracja aplikacji Ting Tong z WordPress PWA do nowoczesnego stosu technologicznego opartego na Next.js, TypeScript i Vercel.

## Cel migracji

Celem migracji jest unowocześnienie aplikacji, poprawa jej wydajności, skalowalności i ułatwienie dalszego rozwoju. Next.js został wybrany ze względu na doskonałe wsparcie dla renderowania po stronie serwera (SSR), generowania stron statycznych (SSG) i łatwość wdrożenia na platformie Vercel.

## Plan migracji

1.  **Archiwizacja istniejących plików:** Wszystkie pliki oryginalnej aplikacji WordPress zostały spakowane do pliku `archive.zip`.
2.  **Inicjalizacja projektu Next.js:** Nowy projekt Next.js z TypeScriptem, Tailwind CSS i ESLint został zainicjowany w głównym katalogu.
3.  **Implementacja podstawowej struktury:** Zostanie zaimplementowana podstawowa struktura aplikacji, w tym strony główne i routing.
4.  **Migracja logiki biznesowej:** Logika biznesowa związana z monetyzacją, PWA i zarządzaniem użytkownikami zostanie przepisana do TypeScriptu.
5.  **Integracja ze Stripe:** Zostanie zaimplementowana integracja z bramką płatności Stripe, z uwzględnieniem logiki webhooków.
6.  **Wdrożenie na Vercel:** Aplikacja zostanie wdrożona na platformie Vercel, z skonfigurowanym CI/CD.

## Obecny stan prac

-   [x] Krok 1: Archiwizacja istniejących plików.
-   [x] Krok 2: Inicjalizacja projektu Next.js.
-   [ ] Krok 3: Implementacja podstawowej struktury.

## Instrukcje dla przyszłych agentów

1.  Zapoznaj się z oryginalnym kodem w katalogu `archive`, aby zrozumieć logikę biznesową.
2.  Kontynuuj implementację zgodnie z planem migracji.
3.  Utrzymuj kod w czystości i zgodności z dobrymi praktykami TypeScriptu i Reacta.
4.  Pisz testy jednostkowe i integracyjne, aby zapewnić stabilność aplikacji.
