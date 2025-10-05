from playwright.sync_api import sync_playwright, expect
import re

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the root, PHP server will handle index.php
        page.goto("http://localhost:8000")

        # Wait for the language selection to become available
        preloader = page.locator("#preloader")
        expect(preloader).to_have_class(re.compile(r"content-visible"), timeout=10000)

        # Select Polish
        page.locator('button[data-lang="pl"]').click()

        # Now wait for the app to load
        expect(page.locator("#preloader")).to_be_hidden(timeout=10000)
        expect(page.locator("#webyx-container")).to_be_visible(timeout=10000)

        # The sidebar should be visible
        sidebar = page.locator(".sidebar")
        expect(sidebar).to_be_visible()

        # Assert that the "OCB" button (infoButton) is NOT present
        info_button = page.locator(".infoButton")
        expect(info_button).not_to_be_visible()

        # Take a screenshot to visually confirm the button is gone
        page.screenshot(path="jules-scratch/verification/ocb_button_removed.png")

        browser.close()

if __name__ == "__main__":
    run_verification()