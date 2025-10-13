import re
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the local index.php file
        page.goto(f"file:///app/ting-tong-theme/index.php")

        # Wait for the preloader to become visible
        preloader = page.locator("#preloader")
        expect(preloader).to_be_visible(timeout=10000)

        # Click the Polish language button to start the app
        polish_button = page.locator('button[data-lang="pl"]')
        expect(polish_button).to_be_enabled()
        polish_button.click()

        # Wait for the app to be ready and the preloader to disappear
        expect(page.locator("#app-frame")).to_have_class(re.compile(r'\bready\b'), timeout=15000)
        expect(preloader).not_to_be_visible()

        # Check if the PWA install bar is visible
        pwa_prompt = page.locator('.pwa-prompt')
        expect(pwa_prompt).to_be_visible(timeout=5000)
        print("PWA install prompt is visible.")

        # Check if the info button is clickable and opens the modal
        info_button = page.locator('[data-action="open-info-modal"]')
        expect(info_button).to_be_enabled()
        info_button.click()

        # Verify the info modal is now visible
        info_modal = page.locator('#infoModal')
        expect(info_modal).to_be_visible()
        print("Info modal opened successfully.")

        # Take a screenshot to verify the UI state
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot taken successfully.")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        # Take a screenshot on error for debugging
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)