from playwright.sync_api import sync_playwright
import traceback

def run(playwright):
    try:
        print("Launching browser...")
        browser = playwright.chromium.launch()
        page = browser.new_page()
        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000", timeout=60000)
        print("Taking screenshot...")
        page.screenshot(path="verification.png")
        print("Screenshot saved to verification.png")
        browser.close()
        print("Browser closed.")
    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()

with sync_playwright() as playwright:
    run(playwright)
