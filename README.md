# Plan Migracji Ting Tong

Ten dokument opisuje proces migracji aplikacji Ting Tong z architektury WordPress/PHP do nowoczesnego stosu React/Node.js, z wdrożeniem na platformie Vercel.

**Punkt odniesienia:** Oryginalny kod motywu WordPress został zarchiwizowany w pliku `legacy-wordpress-theme.zip` w celu uniknięcia konfliktów scalania, jednocześnie zachowując dostęp do kodu źródłowego.

## Kroki Migracji

1.  **Archiwizacja starego kodu i przygotowanie struktury projektu.** (Ukończono)
    *   Skompresowano `ting-tong-theme` do `legacy-wordpress-theme.zip`.
    *   Usunięto oryginalne pliki WordPress.
    *   Utworzono nową strukturę `client/` i `server/`.
    *   Zainicjowano projekt i stworzono ten `README.md`.
    *   Poprawnie skonfigurowano `.gitignore`.

2.  **Wdrożenie szkieletu aplikacji (Backend i Frontend).**
    *   Szybkie odtworzenie implementacji szkieletu aplikacji Node.js i React.
    *   Zaimplementowanie mockowania bazy danych, aby umożliwić testowanie bez połączenia z MongoDB.

3.  **Pełne testowanie funkcjonalne aplikacji.**
    *   Uruchomienie obu serwerów z mockowaną bazą danych.
    *   Przetestowanie kluczowych funkcjonalności (rejestracja, logowanie, odtwarzacz wideo).
    *   Wykonanie weryfikacji wizualnej frontendu (Playwright).

4.  **Konfiguracja pod wdrożenie na Vercel.**
    *   Dodanie pliku `vercel.json` w celu konfiguracji procesu budowania i wdrażania.

5.  **Ukończenie kroków przed commitem.**
    *   Przeprowadzenie pełnej weryfikacji.

6.  **Przesłanie ostatecznej, przetestowanej wersji.**
    *   Przesłanie gotowych zmian.
