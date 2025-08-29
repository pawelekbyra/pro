# pro
ting tong professional

## Wdrożenie na Vercel

Ten projekt Next.js jest skonfigurowany do wdrożenia na platformie [Vercel](https://vercel.com/).

### Zmienne środowiskowe

Przed wdrożeniem, musisz ustawić następującą zmienną środowiskową w ustawieniach swojego projektu na Vercel:

-   `JWT_SECRET`: Tajny klucz do podpisywania tokenów autoryzacyjnych. Możesz wygenerować bezpieczny klucz za pomocą poniższej komendy:
    ```bash
    openssl rand -hex 32
    ```

Zmienną tę możesz ustawić w panelu Vercel w zakładce "Settings" -> "Environment Variables".

### Baza danych

Projekt obecnie używa lokalnego pliku `data.json` jako bazy danych. Proszę, zwróć uwagę na następujące ograniczenie podczas wdrażania na Vercel:

-   **Efemeryczny system plików:** Bezserwerowe środowisko Vercela ma efemeryczny (tymczasowy) system plików. Oznacza to, że wszelkie zmiany zapisane w pliku `data.json` (np. nowi użytkownicy, polubienia czy komentarze) zostaną utracone przy każdym nowym wdrożeniu lub po restarcie serwera.

Z tego powodu, aplikacja na Vercelu będzie działać w trybie **"tylko do odczytu"**.

#### Możliwe ulepszenia w przyszłości

Aby uzyskać w pełni funkcjonalną aplikację z trwałym zapisem danych, warto rozważyć migrację do usługi bazodanowej. Oto kilka polecanych opcji, które dobrze integrują się z Vercelem:

-   **Vercel KV:** Prosta i szybka baza danych typu klucz-wartość, oferowana przez Vercel. To dobry zamiennik dla obecnego pliku `data.json`.
-   **Vercel Postgres:** Pełnoprawna baza danych PostgreSQL, odpowiednia dla bardziej złożonych aplikacji.
-   **Zewnętrzna baza danych:** Możesz również połączyć się z zewnętrzną usługą, taką jak PlanetScale, Neon, lub Twoją własną bazą MySQL.
