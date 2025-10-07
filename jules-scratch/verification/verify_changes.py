import re
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1"
    )
    page = context.new_page()

    # Listen for console errors
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

    try:
        # Przejdź do strony
        page.goto("http://localhost:8000/index.html", wait_until="load")

        # Poczekaj na inicjalizację skryptów i mockowanie
        page.wait_for_timeout(500)

        # Wywołaj mockLogin, aby zasymulować zalogowanego użytkownika i załadować dane
        page.evaluate("window.ttAuth.mockLogin('test@user.com', true)")

        # Uruchom aplikację
        page.get_by_role("button", name="Polski").click()

        # Oczekuj na załadowanie pierwszego slajdu
        expect(page.locator(".webyx-section").first).to_be_visible(timeout=15000)
        page.wait_for_timeout(1000)

        # 1. Weryfikacja kontrolek wideo
        video_controls = page.locator(".video-controls").first
        expect(video_controls).to_be_visible()
        page.screenshot(path="jules-scratch/verification/01_video_controls.png")

        # Przesuń do drugiego slajdu (Secret)
        page.mouse.wheel(0, 800)
        page.wait_for_timeout(1000)

        # 2. Weryfikacja nakładki "Secret" - teraz powinna być niewidoczna, bo jesteśmy zalogowani
        secret_overlay = page.locator(".secret-overlay").nth(1)
        expect(secret_overlay).not_to_have_class(re.compile(r'visible'))
        page.screenshot(path="jules-scratch/verification/02_secret_overlay_hidden.png")

        # Przesuń do trzeciego slajdu (PWA Secret)
        page.mouse.wheel(0, 800)
        page.wait_for_timeout(1000)

        # 3. Weryfikacja nakładki "PWA Secret" - powinna być widoczna, bo nie jesteśmy w PWA
        pwa_secret_overlay = page.locator(".pwa-secret-overlay").nth(2)
        expect(pwa_secret_overlay).to_have_class(re.compile(r'visible'))
        page.screenshot(path="jules-scratch/verification/03_pwa_secret_overlay.png")

        # 4. Weryfikacja przycisku instalacji PWA
        install_button = page.locator("#pwa-install-button")
        expect(install_button).to_be_visible()
        page.screenshot(path="jules-scratch/verification/04_pwa_bar.png")

    except Exception as e:
        print(f"Error during verification: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)