# Plan Migracji Ting Tong

Ten dokument opisuje kroki migracji aplikacji Ting Tong z architektury WordPress/PHP do nowoczesnego stosu React/Node.js, z wdrożeniem na platformie Vercel.

## Kroki Migracji

1. **Przygotowanie środowiska i struktury projektu.**
   - Przeniesienie wszystkich istniejących plików do katalogu `legacy-wordpress-theme`, aby zachować kod źródłowy jako referencję.
   - Utworzenie nowej struktury katalogów (`client`, `server`) dla aplikacji React/Node.js.
   - Zainicjowanie nowego projektu Node.js za pomocą `npm init` i skonfigurowanie podstawowych zależności.
   - Utworzenie pliku `README.md` z opisem kroków migracji, celów i instrukcji dla kolejnych agentów.

2. **Implementacja API w Node.js (backend).**
   - Utworzenie serwera Express.js do obsługi zapytań API.
   - Zaimplementowanie logiki autentykacji użytkowników (rejestracja, logowanie, weryfikacja statusu).
   - Odtworzenie logiki integracji z płatnościami Stripe, w tym webhooków do obsługi płatności.
   - Stworzenie endpointów API do pobierania danych o slajdach, zarządzania profilem użytkownika i obsługi polubień.
   - Konfiguracja połączenia z bazą danych (np. PostgreSQL lub MongoDB) do przechowywania danych użytkowników i innych informacji.

3. **Implementacja aplikacji w React (frontend).**
   - Skonfigurowanie nowego projektu React za pomocą Create React App lub Vite.
   - Przeniesienie i adaptacja istniejącej logiki z plików JavaScript (z katalogu `legacy-wordpress-theme/js/modules`) do komponentów React.
   - Odtworzenie interfejsu użytkownika, w tym odtwarzacza wideo, logiki SwiperJS i paneli bocznych.
   - Zintegrowanie aplikacji React z nowym API Node.js w celu pobierania danych i obsługi akcji użytkownika.
   - Implementacja logiki Progressive Web App (PWA) w aplikacji React, w tym service workera i manifestu aplikacji.

4. **Testowanie, wdrożenie i finalizacja.**
   - Przeprowadzenie kompleksowych testów w celu zapewnienia, że wszystkie funkcje działają poprawnie (płatności, autentykacja, PWA).
   - Skonfigurowanie projektu do wdrożenia na platformie Vercel.
   - Wdrożenie aplikacji i przeprowadzenie testów na środowisku produkcyjnym.
   - Zaktualizowanie `README.md` o instrukcje dotyczące uruchomienia i wdrożenia projektu.
