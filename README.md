# Prosta Wersja Projektu (Vanilla JS)

Ten projekt jest uproszczoną wersją aplikacji, napisaną w czystym JavaScript (Vanilla JS) i CSS, z myślą o integracji z platformą WordPress.

## Cel

Głównym celem tej wersji jest dostarczenie lekkiego i wydajnego front-endu, który można łatwo osadzić w motywie WordPress. Cała funkcjonalność jest zawarta w plikach `index.html`, `prosta-wersja/style.css` oraz `prosta-wersja/script.js`.

## Struktura

*   `prosta-wersja/`: Zawiera pliki CSS i JS dla aplikacji.
*   `index.html`: Główny plik HTML, który ładuje aplikację. Działa w trybie "mockowym", co pozwala na rozwój i testowanie front-endu bez potrzeby uruchamiania pełnego środowiska WordPress.
*   `functions.php`: Ten plik zawiera kod PHP, który docelowo ma zostać umieszczony w pliku `functions.php` motywu WordPress. Odpowiada on za wczytanie skryptów, stylów oraz przekazanie danych z WordPressa do JavaScriptu. W tym środowisku plik ten nie jest aktywny.

## Tryb Mockowy

Aplikacja działa w trybie demonstracyjnym (mock mode). Oznacza to, że dane, które normalnie byłyby pobierane z bazy danych WordPressa (np. lista slajdów, status logowania), są symulowane bezpośrednio w pliku `prosta-wersja/script.js`. Pozwala to na swobodny rozwój warstwy wizualnej.

## Ostatnie zmiany

*   **Poprawki UI/UX:** Wprowadzono szereg ulepszeń w interfejsie, w tym poprawiono animacje, dopracowano wygląd przycisków oraz zmieniono pozycję i styl przycisku do mockowego logowania.
*   **Czyszczenie projektu:** Usunięto historyczną wersję projektu (bazującą na Next.js), aby uprościć strukturę repozytorium.
