from playwright.sync_api import sync_playwright, expect, Page

def run_verification(page: Page):
    """
    Weryfikuje poprawki paska PWA i modala powitalnego.
    """
    try:
        # Przejdź do strony
        page.goto("http://localhost:8000", timeout=30000)

        # Krok 1: Wybierz język, aby uruchomić aplikację
        polish_button = page.locator('button[data-lang="pl"]')
        expect(polish_button).to_be_visible(timeout=10000)
        polish_button.click()

        # Krok 2: Poczekaj na modal powitalny i zrób zrzut ekranu
        welcome_modal = page.locator("#welcome-modal")
        expect(welcome_modal).to_be_visible(timeout=10000)

        # Sprawdź, czy pasek PWA jest pod modalem
        pwa_install_bar = page.locator("#pwa-install-bar")
        expect(pwa_install_bar).to_be_visible()

        page.screenshot(path="jules-scratch/verification/01_welcome_modal_overlay.png")
        print("Screenshot 1: Welcome modal overlay saved.")

        # Krok 3: Zamknij modal powitalny
        close_button = page.locator('button[data-action="close-welcome-modal"]')
        expect(close_button).to_be_visible()
        close_button.click()
        expect(welcome_modal).not_to_be_visible()

        # Krok 4: Sprawdź, czy pasek PWA jest teraz w pełni widoczny
        expect(pwa_install_bar).to_have_class(r"pwa-prompt visible")
        page.screenshot(path="jules-scratch/verification/02_pwa_bar_visible.png")
        print("Screenshot 2: PWA bar visible in browser mode saved.")

        print("Verification successful!")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()