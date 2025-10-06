# 📋 Przewodnik Instalacji: Modal Pierwszego Logowania

## 🎯 Cel

Dodanie modalu wymuszającego konfigurację konta przy pierwszym logowaniu użytkownika. Modal zawiera:
- Wyświetlenie emaila logowania
- Opcjonalna zmiana avatara
- Wymagane: uzupełnienie imienia i nazwiska
- Wymagane: zmiana hasła z tymczasowego na własne

---

## 📦 Pliki do Zmodyfikowania/Utworzenia

### 1️⃣ **style.css** (modyfikacja)
📁 `ting-tong-theme/style.css`

**Akcja:** Dodaj na końcu pliku

```css
/* Skopiuj zawartość artefaktu: first_login_modal_css */
```

---

### 2️⃣ **index.php** (modyfikacja)
📁 `ting-tong-theme/index.php`

**Akcja:** Dodaj przed zamknięciem `</body>`

```html
<!-- Skopiuj zawartość artefaktu: first_login_modal_html -->
```

**Lokalizacja:** Tuż przed `<?php get_footer(); ?>`

---

### 3️⃣ **first-login-modal.js** (nowy plik)
📁 `ting-tong-theme/js/modules/first-login-modal.js`

**Akcja:** Utwórz nowy plik

```javascript
// Skopiuj CAŁĄ zawartość artefaktu: first_login_modal_js
```

---

### 4️⃣ **config.js** (modyfikacja)
📁 `ting-tong-theme/js/modules/config.js`

**Akcja:** Dodaj tłumaczenia

**Lokalizacja:** W obiekcie `Config.TRANSLATIONS`

**Dla języka polskiego (`pl`):**
```javascript
TRANSLATIONS: {
  pl: {
    // ... istniejące tłumaczenia ...

    // Dodaj zawartość z artefaktu: first_login_translations (sekcja pl)
  }
}
```

**Dla języka angielskiego (`en`):**
```javascript
en: {
  // ... istniejące tłumaczenia ...

  // Dodaj zawartość z artefaktu: first_login_translations (sekcja en)
}
```

---

### 5️⃣ **functions.php** (modyfikacja)
📁 `ting-tong-theme/functions.php`

**Akcja:** Dodaj na końcu pliku (przed zamknięciem `?>` jeśli istnieje)

**UWAGA:** Ten krok wymaga **ZASTĄPIENIA** istniejącego handlera logowania!

**Znajdź w pliku:**
```php
add_action( 'wp_ajax_nopriv_tt_ajax_login', function () {
```

**Zastąp całą funkcję** nowym kodem z artefaktu `first_login_backend_php`

Następnie **dodaj na końcu** pozostałe funkcje z tego artefaktu.

---

### 6️⃣ **app.js** (modyfikacja)
📁 `ting-tong-theme/js/app.js`

**Akcja 1:** Dodaj import na początku pliku (po innych importach)

```javascript
import { FirstLoginModal } from './modules/first-login-modal.js';
```

**Akcja 2:** Inicjalizuj moduł

**Znajdź w funkcji `App.init()`:**
```javascript
AccountPanel.init();
```

**Dodaj zaraz po tej linii:**
```javascript
FirstLoginModal.init();
```

---

### 7️⃣ **handlers.js** (modyfikacja)
📁 `ting-tong-theme/js/modules/handlers.js`

**Akcja:** Zastąp obsługę logowania

**Znajdź w funkcji `formSubmitHandler`:**
```javascript
const loginForm = e.target.closest("form#tt-login-form");
if (loginForm) {
  // ... kod logowania
}
```

**Zastąp całą tę sekcję** kodem z artefaktu `first_login_integration` (sekcja 2)

---

## 🧪 Testowanie

### Krok 1: Utwórz testowego użytkownika

**Opcja A: Przez shortcode (dla adminów)**

1. Zaloguj się jako administrator
2. Utwórz nową stronę lub post
3. Dodaj shortcode:
```
[tt_create_user email="test@example.com"]
```
4. Opublikuj i wyświetl stronę
5. Skopiuj wygenerowane hasło (pojawi się tylko raz!)

**Opcja B: Przez kod PHP (konsola lub snippet)**

```php
$result = tt_create_user_with_temp_password('test@example.com');
if ($result['success']) {
    echo "Email: " . $result['email'] . "\n";
    echo "Login: " . $result['username'] . "\n";
    echo "Hasło: " . $result['temp_password'] . "\n";
}
```

### Krok 2: Testuj logowanie

1. **Wyloguj się** jeśli jesteś zalogowany
2. Kliknij "Nie masz psychy się zalogować" (topbar)
3. Wpisz:
   - **Email:** test@example.com
   - **Hasło:** [wygenerowane hasło]
4. Kliknij ENTER

### Krok 3: Sprawdź modal

Modal powinien się automatycznie pokazać z:
- ✅ Wyświetlonym emailem logowania
- ✅ Możliwością zmiany avatara (opcjonalnie)
- ✅ Polami: Imię, Nazwisko (wymagane)
- ✅ Polami: Aktualne hasło, Nowe hasło x2 (wymagane)
- ✅ Wskaźnikiem siły hasła

### Krok 4: Wypełnij formularz

1. **Avatar:** Opcjonalnie kliknij +
2. **Imię:** Wpisz dowolne (może być zmyślone)
3. **Nazwisko:** Wpisz dowolne (może być zmyślone)
4. **Aktualne hasło:** Wklej hasło z kroku 1
5. **Nowe hasło:** Wpisz własne (min. 8 znaków)
6. **Powtórz hasło:** Wpisz ponownie to samo
7. Kliknij **"Gotowe! Przejdź do aplikacji"**

### Krok 5: Weryfikacja

Po pomyślnej konfiguracji:
- ✅ Modal powinien się zamknąć
- ✅ Pojawi się toast: "Witaj w Ting Tong! 🚀"
- ✅ Strona się odświeży
- ✅ Użytkownik jest zalogowany
- ✅ Przy następnym logowaniu modal się **nie pojawi**

---

## 🔧 Funkcje Pomocnicze

### Reset flagi pierwszego logowania (dla testów)

**W konsoli PHP:**
```php
$user_id = 123; // ID użytkownika
delete_user_meta($user_id, 'tt_first_login_completed');
delete_user_meta($user_id, 'tt_first_login_completed_date');
```

### Sprawdź status użytkownika

```php
$user_id = 123;
$completed = get_user_meta($user_id, 'tt_first_login_completed', true);
$date = get_user_meta($user_id, 'tt_first_login_completed_date', true);

echo "Ukończona konfiguracja: " . ($completed ? 'TAK' : 'NIE') . "\n";
echo "Data ukończenia: " . ($date ?: 'N/A') . "\n";
```

### Masowe tworzenie użytkowników

```php
$emails = ['user1@test.com', 'user2@test.com', 'user3@test.com'];

foreach ($emails as $email) {
    $result = tt_create_user_with_temp_password($email);
    if ($result['success']) {
        echo "✓ " . $email . " | Hasło: " . $result['temp_password'] . "\n";

        // Opcjonalnie: wyślij email
        // tt_send_welcome_email($result['user_id'], $result['temp_password']);
    }
}
```

---

## 🎨 Personalizacja

### Zmiana kolorów

**W `style.css`**, znajdź:
```css
.first-login-header {
  background: linear-gradient(135deg, #ff0055 0%, #ff4081 100%);
}
```

Zmień kolory gradientu na własne.

### Zmiana minimalnej długości hasła

**W `first-login-modal.js`**, znajdź:
```javascript
if (newPassword.length < 8) {
```

Zmień `8` na inną wartość.

**PAMIĘTAJ** też zmienić w `functions.php`:
```php
if (strlen($n1) < 8) {
```

### Ukrycie sekcji avatar

**W `index.php`**, zakomentuj:
```html
<!-- SEKCJA 1: Avatar (opcjonalnie) -->
<!--
<div class="first-login-section">
  ...
</div>
-->
```

---

## ⚠️ Troubleshooting

### Problem: Modal się nie pokazuje

**Rozwiązanie:**
1. Sprawdź konsolę przeglądarki (F12) - szukaj błędów JS
2. Upewnij się, że:
   - Plik `first-login-modal.js` został utworzony
   - Import został dodany do `app.js`
   - `FirstLoginModal.init()` jest wywołane

### Problem: "undefined is not a function"

**Rozwiązanie:**
- Sprawdź czy wszystkie moduły są poprawnie zaimportowane
- Upewnij się, że używasz składni ES6 modules (`import`/`export`)

### Problem: Hasło nie jest walidowane

**Rozwiązanie:**
- Sprawdź czy tłumaczenia zostały dodane do `config.js`
- Upewnij się, że `Utils.getTranslation()` działa poprawnie

### Problem: Avatar nie zapisuje się

**Rozwiązanie:**
- Sprawdź uprawnienia do zapisu w folderze `wp-content/uploads`
- Upewnij się, że handler `tt_avatar_upload` istnieje w `functions.php`
- Sprawdź Network tab (F12) - zobacz odpowiedź z serwera

---

## 📊 Statystyki Użytkowania

### Ile użytkowników ukończyło setup?

```sql
SELECT COUNT(*) as completed_users
FROM wp_usermeta
WHERE meta_key = 'tt_first_login_completed'
AND meta_value = '1';
```

### Lista użytkowników wymagających setup

```sql
SELECT u.ID, u.user_email, u.user_registered
FROM wp_users u
LEFT JOIN wp_usermeta um ON u.ID = um.user_id AND um.meta_key = 'tt_first_login_completed'
WHERE um.meta_value IS NULL OR um.meta_value = '';
```

---

## 🚀 Gotowe!

Po wykonaniu wszystkich kroków, modal pierwszego logowania jest w pełni funkcjonalny!

**Kolejne kroki:**
- [ ] Przetestuj z różnymi użytkownikami
- [ ] Dostosuj kolory do brandingu
- [ ] Opcjonalnie: dodaj wysyłanie emaili powitalnych
- [ ] Opcjonalnie: dodaj logowanie przez Google/Facebook

---

## 📞 Wsparcie

W razie problemów:
1. Sprawdź logi PHP: `wp-content/debug.log`
2. Sprawdź konsolę JS: F12 → Console
3. Sprawdź Network: F12 → Network → filtruj po "ajax"

Powodzenia! 🎉 na koniec daj mi mockowy przycisk w glownym feedzie ktory bedzie wlaczal i wylaczal ten modal zebym go widzial bez pierwszegoi logowania