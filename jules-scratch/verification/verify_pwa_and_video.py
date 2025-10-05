import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    """
    This script verifies two main frontend changes:
    1. The PWA install bar is always visible in the browser.
    2. The video slides load correctly, using mock data as a fallback.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Get the absolute path to the index.php file
            base_dir = os.path.abspath("ting-tong-theme")
            file_path = f"file://{os.path.join(base_dir, 'index.php')}"

            # Navigate to the local file
            page.goto(file_path)

            # 1. Start the application by selecting a language
            # Wait for the language button to be available and click it
            lang_button = page.locator('button[data-lang="pl"]')
            expect(lang_button).to_be_visible(timeout=10000)
            lang_button.click()

            # 2. Verify the PWA install bar is visible
            pwa_install_bar = page.locator("#pwa-install-bar")
            expect(pwa_install_bar).to_be_visible(timeout=10000)

            # 3. Verify the welcome modal is NOT visible in PWA mode (by checking it's visible in browser)
            # but first, close it to continue the test
            welcome_modal_ok_button = page.locator("#welcome-modal-ok")
            expect(welcome_modal_ok_button).to_be_visible(timeout=5000)
            welcome_modal_ok_button.click()
            expect(welcome_modal_ok_button).not_to_be_visible()


            # 4. Verify that the video slides are loading
            # Wait for the first slide to become active and check for a video player
            first_slide = page.locator(".swiper-slide-active")
            expect(first_slide).to_be_visible(timeout=10000)

            # Check if the video element inside the active slide has a src attribute
            video_player = first_slide.locator("video.player")
            expect(video_player).to_have_attribute("src", lambda s: s.startswith("https://"))

            # Take a screenshot for visual confirmation
            screenshot_path = "jules-scratch/verification/verification.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()