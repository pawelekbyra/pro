from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the local WordPress site.
        # The user needs to ensure WordPress is running.
        page.goto("http://localhost:8888/", timeout=60000)

        # Open the login panel
        login_panel_button = page.locator('[data-action="toggle-login-panel"]')
        login_panel_button.click()

        # Wait for the login form to be visible
        login_form = page.locator("form#tt-login-form")
        expect(login_form).to_be_visible()

        # Fill in credentials (assuming 'user' and 'password' are valid)
        page.locator("#tt-username").fill("user")
        page.locator("#tt-password").fill("password")

        # Take a screenshot before logging in
        page.screenshot(path="jules-scratch/verification/01_before_login.png")

        # Click the login button
        page.locator("#tt-login-submit").click()

        # Wait for the login success message or UI change
        # The topbar text changes to "Ting Tong" on successful login
        topbar_text = page.locator(".topbar-text")
        expect(topbar_text).to_have_text("Ting Tong")

        # Take a screenshot after logging in
        page.screenshot(path="jules-scratch/verification/02_after_login.png")

        print("Verification script completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)