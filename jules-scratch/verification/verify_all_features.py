import re
from playwright.sync_api import sync_playwright, expect

def run_verification(page):
    """
    Runs the verification tests for the Ting Tong theme changes.
    """
    print("Navigating to the test page...")
    page.goto("http://localhost:8000/jules-scratch/verification/index.html")

    # 1. Start the app
    print("Selecting language to start...")
    page.get_by_role("button", name="Polski").click()

    # Wait for the 1s timeout in app.js to complete
    page.wait_for_timeout(1500)

    # Wait for the preloader to disappear
    preloader = page.locator("#preloader")
    expect(preloader).to_have_class(re.compile(r"preloader-hiding"))
    expect(preloader).to_be_hidden(timeout=2000)
    print("App loaded.")

    # Define locators for the active slide
    active_slide = page.locator(".swiper-slide-active")
    active_video = active_slide.locator("video")

    # 2. Verify UI flicker fix and volume button position
    print("Verifying UI elements visibility and position...")
    sidebar = active_slide.locator(".sidebar")
    bottombar = active_slide.locator(".bottombar")
    volume_button = active_slide.locator(".volume-button")

    # Check that UI is initially hidden before video loads
    expect(sidebar).to_have_css("opacity", "0")
    expect(bottombar).to_have_css("opacity", "0")

    # Wait for video to load and UI to appear
    expect(active_slide.locator(".tiktok-symulacja")).to_have_class(re.compile(r"video-loaded"), timeout=10000)
    expect(sidebar).to_have_css("opacity", "1", timeout=2000)
    expect(bottombar).to_have_css("opacity", "1", timeout=2000)

    # Check volume button's new position (it should be on the left)
    volume_button_box = volume_button.bounding_box()
    assert volume_button_box['x'] < 50, f"Volume button is not on the left. X-pos: {volume_button_box['x']}"
    print("UI flicker fix and volume button position verified.")

    # 3. Verify Tap-to-Pause
    print("Verifying tap-to-pause...")
    pause_overlay = active_slide.locator(".pause-overlay")

    # Wait a moment for video to surely be playing
    page.wait_for_timeout(500)

    # Click to pause
    active_video.click()
    expect(pause_overlay).to_be_visible()
    print("Video paused successfully.")

    # Take a screenshot of the paused state with the new volume button
    page.screenshot(path="jules-scratch/verification/01_paused_state.png")

    # 4. Verify Tap-to-Play
    print("Verifying tap-to-play...")
    active_video.click()
    expect(pause_overlay).not_to_be_visible()
    print("Video resumed successfully.")

    # 5. Verify Replay Overlay
    print("Verifying replay functionality...")
    replay_overlay = active_slide.locator(".replay-overlay")

    # Wait for the 10s video to end
    page.wait_for_timeout(11000)
    expect(replay_overlay).to_be_visible(timeout=5000)
    print("Replay overlay is visible.")
    page.screenshot(path="jules-scratch/verification/02_replay_state.png")

    # 6. Verify Secret Slide
    print("Verifying secret slide...")
    # Swipe to the next slide
    page.mouse.wheel(0, 800)
    page.wait_for_timeout(1000) # Wait for slide change animation

    secret_slide = page.locator(".swiper-slide-active")
    secret_overlay = secret_slide.locator(".secret-overlay")
    secret_video = secret_slide.locator("video")

    expect(secret_overlay).to_be_visible()

    # Check if the video is paused
    is_paused = secret_video.evaluate("video => video.paused")
    assert is_paused, "Video on secret slide should be paused by default."
    print("Secret slide overlay is visible and video is paused.")
    page.screenshot(path="jules-scratch/verification/03_secret_slide.png")

    print("All verifications passed!")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_verification(page)
        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    main()