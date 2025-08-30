# pro

ting tong professional

## Wdrożenie na Vercel

Ten projekt Next.js jest skonfigurowany do wdrożenia na platformie [Vercel](https://vercel.com/).

### Zmienne środowiskowe

Przed wdrożeniem, musisz skonfigurować następujące zmienne środowiskowe w ustawieniach swojego projektu na Vercel:

#### Klucz JWT

- `JWT_SECRET`: Tajny klucz do podpisywania tokenów autoryzacyjnych. Możesz wygenerować bezpieczny klucz za pomocą poniższej komendy:
  ```bash
  openssl rand -hex 32
  ```

#### Baza danych Vercel KV

Aplikacja używa **Vercel KV** jako bazy danych do przechowywania wszystkich danych, w tym użytkowników, filmów i interakcji. Aby połączyć się z bazą danych, musisz utworzyć nową bazę Vercel KV w panelu Vercel i dodać następujące zmienne środowiskowe do swojego projektu:

- `KV_REST_API_URL`: Adres URL Twojej bazy danych KV.
- `KV_REST_API_TOKEN`: Token dostępowy do Twojej bazy danych KV.

Po ustawieniu powyższych zmiennych, aplikacja będzie w pełni funkcjonalna i gotowa do wdrożenia.

### Zasilanie bazy danych (Opcjonalnie)

Jeśli chcesz wypełnić swoją bazę danych początkowymi danymi, możesz użyć skryptu `db:seed`. Skrypt odczytuje dane z lokalnego pliku `data.json` i zapisuje je w Twojej bazie Vercel KV.

1.  Upewnij się, że masz skonfigurowane zmienne środowiskowe w pliku `.env.local`.
2.  Uruchom komendę:
    ```bash
    npm run db:seed
    ```
