# Readme aplikacji Ting Tong

> **UWAGA:** Aplikacja jest obecnie skonfigurowana do pracy w **trybie MOCK**. Oznacza to, że wszystkie dane pochodzą z lokalnego, symulowanego źródła, a nie z prawdziwej bazy danych. Aby przełączyć się na produkcyjną bazę danych, upewnij się, że zmienna środowiskowa `MOCK_API` nie jest ustawiona na `true`.


## Wdrożenie

Ten projekt jest oparty na Next.js i przygotowany do wdrożenia na platformach wspierających aplikacje Node.js, takich jak Vercel.

### ⚠️ Uwaga na pliki-artefakty

W repozytorium znajdują się pliki `prototyp.txt` oraz `tingtong.txt`. Są to **historyczne prototypy** i **nie są częścią działającej aplikacji**. Prosimy nie traktować ich jako punktu odniesienia dla obecnej architektury ani nie wprowadzać w nich zmian z myślą o wpłynięciu na działanie projektu.

### Zmienne środowiskowe

Przed uruchomieniem lub wdrożeniem, musisz skonfigurować następujące zmienne środowiskowe:

#### Baza danych (Neon PostgreSQL)

Aplikacja wykorzystuje **Neon** jako dostawcę bazy danych PostgreSQL.

-   `DATABASE_URL`: Pełny connection string do Twojej bazy danych na Neon. Znajdziesz go w panelu swojego projektu na Neon.

#### Klucz JWT (Uwierzytelnianie)

-   `JWT_SECRET`: Tajny klucz do podpisywania tokenów autoryzacyjnych (JWT). Możesz wygenerować bezpieczny klucz za pomocą poniższej komendy w terminalu:
    ```bash
    openssl rand -hex 32
    ```

### Uruchomienie lokalne

1.  Sklonuj repozytorium.
2.  Utwórz plik `.env.local` w głównym katalogu projektu.
3.  Dodaj do niego zmienne `DATABASE_URL` i `JWT_SECRET`.
4.  Zainstaluj zależności: `npm install` lub `yarn install`.
5.  Uruchom aplikację: `npm run dev` lub `yarn dev`.

### Skrypty

-   `npm run dev`: Uruchamia serwer deweloperski.
-   `npm run build`: Buduje aplikację do wersji produkcyjnej.
-   `npm run start`: Uruchamia zbudowaną aplikację.
-   `npm run lint`: Uruchamia lintera ESLint.
-   `npm run create-admin`: Uruchamia skrypt do tworzenia/aktualizacji użytkownika 'admin' w bazie danych.
-   `npm run init-db`: Inicjalizuje tabele w bazie danych (uwaga: usuwa istniejące tabele).

## Panel Administratora

Aplikacja zawiera podstawowy panel administratora dostępny pod `/admin`. Dostęp wymaga zalogowania się na konto z rolą `admin`.
