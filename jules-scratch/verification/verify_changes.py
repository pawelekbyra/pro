import re
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    """
    This script verifies two main changes:
    1. The video control buttons have reduced spacing.
    2. The PWA install button and bar are visible and functional.
    """
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        # Emulate a mobile device to ensure PWA logic triggers correctly
        **playwright.devices["Pixel 5"]
    )
    page = context.new_page()

    # Capture console logs to check for errors
    console_logs = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

    try:
        # 1. Navigate to the local verification server
        page.goto("http://localhost:8090/verify_index.html", timeout=10000)

        # 2. Start the app by selecting a language
        # Wait for the button to be visible and enabled
        lang_button = page.get_by_role("button", name="Polski")
        expect(lang_button).to_be_visible()
        lang_button.click()

        # 3. Wait for the main app to load and be ready
        # The .ready class is added after the preloader fades out.
        # We use a regex to check for the class, as the element may have multiple classes.
        main_container = page.locator("#webyx-container")
        expect(main_container).to_have_class(re.compile(r"\bready\b"), timeout=5000)

        # Give the video and UI a moment to load
        page.wait_for_timeout(1000)

        # 4. Verify the video controls are visible
        video_controls = page.locator(".video-controls")
        expect(video_controls).to_be_visible()

        # 5. Verify the PWA install bar appears
        install_bar = page.locator("#pwa-install-bar")
        # The bar might take a second to appear based on PWA logic
        expect(install_bar).to_be_visible(timeout=5000)

        # 6. Take a screenshot for visual confirmation
        screenshot_path = "jules-scratch/verification/verification.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        # 7. Click the install button to check for console errors
        install_button = page.locator("#pwa-install-button")
        expect(install_button).to_be_enabled()
        install_button.click()

        # Wait a moment for any potential async errors to be logged
        page.wait_for_timeout(500)

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        # Take a screenshot on error for debugging
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        # Print captured console logs for review
        print("\n--- Console Logs ---")
        for log in console_logs:
            print(log)
        print("--------------------\n")

        # Check for critical errors in console
        has_errors = any("error" in log.lower() for log in console_logs)
        if has_errors:
            print("❌ Critical errors found in console logs.")
        else:
            print("✅ No critical errors detected in console logs.")

        browser.close()

if __name__ == "__main__":
    with sync_playwright() as p:
        run_verification(p)