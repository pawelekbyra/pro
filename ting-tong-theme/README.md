# Motyw Ting Tong

Niestandardowy motyw WordPress dla aplikacji Ting Tong, przekonwertowany ze statycznego projektu HTML. Ten motyw został zaprojektowany jako aplikacja jednostronicowa (SPA) z interfejsem w stylu TikToka, umożliwiającym przeglądanie treści wideo poprzez przesuwanie w pionie.

## Funkcje

- **Doświadczenie zbliżone do SPA**: Motyw wykorzystuje pionowy suwak oparty na SwiperJS, aby stworzyć płynne, przypominające aplikację doświadczenie przeglądania bez przeładowywania strony.
- **Dynamiczne ładowanie treści**: Slajdy i ich zawartość są generowane dynamicznie za pomocą JavaScript, a dane przekazywane są z backendu WordPressa.
- **Progresywna Aplikacja Webowa (PWA)**: Zawiera wsparcie dla instalacji PWA, co pozwala użytkownikom na dodanie strony do ekranu głównego, aby uzyskać doświadczenie zbliżone do aplikacji.
- **Uwierzytelnianie użytkownika**: Kompletny system uwierzytelniania użytkowników z funkcjami logowania, wylogowywania i rejestracji.
- **Interaktywne komponenty UI**:
    - **Modale**: Bogaty zestaw modali do komentarzy, profili użytkowników, informacji i powiadomień.
    - **Dynamiczne paski boczne**: Interaktywne paski boczne z przyciskami do polubień, komentowania, udostępniania i innych.
- **Lokalizacja**: Motyw obsługuje zarówno język polski, jak i angielski, z selektorem języka i ustrukturyzowanym systemem tłumaczeń w JavaScript.
- **Dane mockowe do samodzielnego rozwoju**: Motyw jest skonfigurowany do używania danych mockowych, gdy `TingTongData` nie jest dostarczane przez WordPress, co pozwala na rozwój frontendu bez działającego backendu.
- **Akcje oparte na AJAX**: Akcje użytkownika, takie jak polubienia, komentowanie i aktualizowanie profili, są obsługiwane asynchronicznie za pomocą AJAX.

## Struktura projektu

Motyw składa się z kilku kluczowych plików:

- `index.php`: Główny plik szablonu. Zawiera strukturę HTML aplikacji, w tym kontener Swiper, szablony slajdów i wszystkie modale.
- `functions.php`: Odpowiada za kolejkowanie skryptów i stylów oraz przekazywanie danych z PHP do JavaScript za pomocą `wp_localize_script`. Zawiera również dane mockowe dla slajdów.
- `style.css`: Zawiera wszystkie style motywu, w tym jego metadane.
- `script.js`: Główny plik JavaScript, który napędza aplikację. Jest zorganizowany w moduły do zarządzania stanem, interfejsem użytkownika, wywołaniami API i obsługą zdarzeń.
- `header.php` / `footer.php`: Standardowe pliki szablonów WordPress.

## Pierwsze kroki

Aby użyć tego motywu, wykonaj następujące kroki:

1.  Umieść katalog `ting-tong-theme` w folderze `wp-content/themes` swojego WordPressa.
2.  Aktywuj motyw w panelu administracyjnym WordPressa w sekcji "Wygląd" > "Motywy".
3.  Motyw jest teraz aktywny i wyświetli interfejs w stylu TikToka na stronie głównej Twojej witryny.

## Rozwój frontendu

Frontend jest zbudowany w oparciu o modułową architekturę JavaScript. Główny plik `script.js` jest zorganizowany w kilka kluczowych komponentów:

- **Config**: Zawiera opcje konfiguracyjne i ciągi tłumaczeń dla obu obsługiwanych języków.
- **State**: Prosty obiekt do zarządzania stanem aplikacji, taki jak bieżący język, status zalogowania i aktualny slajd.
- **Utils**: Zbiór funkcji pomocniczych do zadań takich jak tłumaczenie, formatowanie liczb i obsługa gestów użytkownika.
- **API**: Moduł do obsługi wszystkich żądań AJAX do backendu WordPressa. Zawiera zapasowe dane mockowe do samodzielnego rozwoju.
- **UI**: Kompleksowy moduł do zarządzania wszystkimi elementami interfejsu użytkownika, w tym renderowaniem slajdów, modali i aktualizowaniem DOM w oparciu o stan aplikacji.
- **PWA**: Moduł do obsługi funkcjonalności Progresywnej Aplikacji Webowej, w tym monitu o instalację.
- **Handlers**: Moduł centralizujący całą obsługę zdarzeń w aplikacji.
- **App**: Główny moduł aplikacji, który inicjalizuje motyw i łączy wszystkie pozostałe moduły.

### Samodzielny rozwój

Motyw został zaprojektowany tak, aby można go było rozwijać bez działającego backendu WordPressa. Jeśli globalne obiekty `TingTongData` i `ajax_object` nie są zdefiniowane, `script.js` automatycznie przełączy się na używanie danych mockowych. Pozwala to na łatwy rozwój i testowanie frontendu.

## Interakcja z backendem

Motyw używa `wp_localize_script` w `functions.php` do przekazywania danych z PHP do JavaScript. Obiekt `TingTongData` zawiera wszystkie niezbędne informacje dla slajdów, a także status zalogowania użytkownika. Obiekt `ajax_object` dostarcza URL AJAX i nonce do bezpiecznej komunikacji.

Wszystkie akcje asynchroniczne są obsługiwane za pomocą wywołań AJAX do backendu WordPressa. Moduł API w `script.js` definiuje wszystkie dostępne akcje i odpowiadające im funkcje.