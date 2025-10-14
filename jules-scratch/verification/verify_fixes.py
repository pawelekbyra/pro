import re
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Przejdź do strony głównej
        page.goto("http://localhost:8000/ting-tong-theme/index.php")

        # Poczekaj na zniknięcie preloadera i pojawienie się kontenera aplikacji
        expect(page.locator("#preloader")).to_have_class(re.compile(r'preloader-hiding'), timeout=10000)
        expect(page.locator("#webyx-container")).to_be_visible()

        # Poczekaj na załadowanie pierwszego slajdu
        expect(page.locator(".swiper-slide-active .sidebar")).to_be_visible()

        # 1. Sprawdzenie dolnego paska i ramki VIP
        page.wait_for_timeout(1000) # Czas na animacje
        page.screenshot(path="jules-scratch/verification/01_main_view.png")

        # 2. Sprawdzenie otwierania profilu publicznego po kliknięciu na awatar
        # Wybieramy slajd z VIPem
        swiper = page.evaluate_handle('() => window.swiper')
        swiper.evaluate('s => s.slideTo(3)') # Paweł Polutek jest na 4 slajdzie (indeks 3)
        page.wait_for_timeout(500)

        vip_avatar_button = page.locator(".swiper-slide-active .profileButton[data-action='open-public-profile']")
        expect(vip_avatar_button).to_be_visible()
        vip_avatar_button.click()

        profile_modal = page.locator("#tiktok-profile-modal")
        expect(profile_modal).to_be_visible()
        expect(profile_modal.locator("#tiktok-profile-nickname")).to_have_text("Paweł Polutek")
        page.screenshot(path="jules-scratch/verification/02_profile_modal.png")

        # Zamknij modal profilu
        profile_modal.locator("[data-action='close-modal']").click()
        expect(profile_modal).not_to_be_visible()

        # 3. Sprawdzenie otwierania komentarzy
        comments_button = page.locator(".swiper-slide-active .commentsButton[data-action='open-comments-modal']")
        expect(comments_button).to_be_visible()
        comments_button.click()

        comments_modal = page.locator("#commentsModal")
        expect(comments_modal).to_be_visible()
        page.screenshot(path="jules-scratch/verification/03_comments_modal.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)