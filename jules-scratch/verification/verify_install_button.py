import re
from playwright.sync_api import sync_playwright, expect
import os

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Ścieżka do pliku HTML
        file_path = os.path.abspath("ting-tong-theme/index.html")

        # Nawiguj do lokalnego pliku HTML
        page.goto(f"file://{file_path}")

        # Znajdź przycisk do wyboru języka i kliknij go, aby ukryć preloader
        lang_button = page.locator('button[data-lang="pl"]')
        expect(lang_button).to_be_visible(timeout=10000)
        lang_button.click()

        # Dodaj stałe opóźnienie, aby dać JS czas na dodanie klasy .visible
        page.wait_for_timeout(1000)

        # Poczekaj, aż pasek instalacji będzie widoczny
        install_bar = page.locator("#pwa-install-bar")
        expect(install_bar).to_be_visible(timeout=5000)

        # Znajdź przycisk instalacji
        install_button = page.locator("#pwa-install-button")

        # Sprawdź, czy przycisk jest włączony (nie ma atrybutu 'disabled')
        expect(install_button).to_be_enabled()

        # Zrób zrzut ekranu, aby wizualnie potwierdzić
        screenshot_path = "jules-scratch/verification/verification.png"
        page.screenshot(path=screenshot_path)

        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_verification()