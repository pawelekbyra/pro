import re
from playwright.sync_api import sync_playwright, expect
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 414, 'height': 896},
        device_scale_factor=2,
        is_mobile=True,
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
    )
    page = context.new_page()

    try:
        # Przejdź do lokalnego pliku index.php
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'ting-tong-theme', 'index.php'))
        page.goto(f'file://{base_path}')

        # Poczekaj na preloader i wybierz język, aby uruchomić aplikację
        expect(page.locator('button[data-lang="pl"]')).to_be_visible(timeout=10000)
        page.locator('button[data-lang="pl"]').click()

        # Poczekaj na załadowanie aplikacji
        expect(page.locator('#webyx-container.ready')).to_be_visible(timeout=10000)

        # Użyj narzędzi deweloperskich do wywołania logowania i modala
        page.evaluate("() => { window.ttAuth.mockLogin({ is_profile_complete: false, email: 'test@example.com' }); }")

        # Poczekaj na pojawienie się modala
        modal = page.locator('#firstLoginModal')
        expect(modal).to_be_visible(timeout=5000)

        # --- Krok 1: Powitanie ---
        expect(page.locator('#first-login-title')).to_have_text('Witaj w Ting Tong!')
        page.screenshot(path='jules-scratch/verification/step1_welcome.png')
        page.locator('#firstLoginNextBtn').click()
        page.wait_for_timeout(500) # Czas na animację

        # --- Krok 2: Dane i hasło ---
        expect(page.locator('#first-login-title')).to_have_text('Uzupełnij swoje dane')
        page.locator('#fl_firstname').fill('Jan')
        page.locator('#fl_lastname').fill('Kowalski')
        page.locator('#fl_new_password').fill('TestoweHaslo123')
        page.locator('#fl_confirm_password').fill('TestoweHaslo123')
        page.screenshot(path='jules-scratch/verification/step2_form.png')
        page.locator('#firstLoginNextBtn').click()
        page.wait_for_timeout(500) # Czas na animację

        # --- Krok 3: Ustawienia ---
        expect(page.locator('#first-login-title')).to_have_text('Ustawienia powiadomień')
        page.screenshot(path='jules-scratch/verification/step3_settings.png')

        print("Weryfikacja zakończona sukcesem. Zrzuty ekranu zapisane.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path='jules-scratch/verification/error_screenshot.png')
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)