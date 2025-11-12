// ting-tong-theme/js/modules/interactive-wall.js

export function initInteractiveWall(canvas, slideId) {
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    if (!parent) return;

    // Definicje stałych (kolor fugi jest też kolorem konturu)
    const ceglaSzerokosc = 60;
    const ceglaWysokosc = 30;
    const fugaGrubosc = 1;
    const kolorCegly = '#ffffff';
    const kolorKonturu = '#333333'; // Kolor konturu/fugi
    const grawitacja = 0.5;

    let cegly = [];

    class Cegla {
        constructor(x, y, szerokosc, wysokosc, isStatic = true) {
            this.x = x;
            this.y = y;
            this.szerokosc = szerokosc;
            this.wysokosc = wysokosc;
            this.isStatic = isStatic;
            this.vx = 0;
            this.vy = 0;
            this.kat = 0;
            this.predkoscKatowa = 0;
            this.zniszczona = false;
        }

        draw() {
            if (this.zniszczona) return;
            ctx.save();
            ctx.translate(this.x + this.szerokosc / 2, this.y + this.wysokosc / 2);
            ctx.rotate(this.kat);

            // Rysowanie cegły (wypełnienie)
            ctx.fillStyle = kolorCegly;
            ctx.fillRect(-this.szerokosc / 2, -this.wysokosc / 2, this.szerokosc, this.wysokosc);

            // NAPRAWA KONTURU: Rysowanie konturu (fugi)
            ctx.strokeStyle = kolorKonturu;
            ctx.lineWidth = fugaGrubosc;
            ctx.strokeRect(-this.szerokosc / 2, -this.wysokosc / 2, this.szerokosc, this.wysokosc);

            ctx.restore();
        }

        update() {
            if (this.isStatic || this.zniszczona) return;

            // Logika fizyki
            this.vy += grawitacja;
            this.x += this.vx;
            this.y += this.vy;
            this.kat += this.predkoscKatowa;

            if (this.y > canvas.height + this.wysokosc) {
                this.zniszczona = true;
            }
        }
    }

    function inicjalizujMur() {
        cegly = [];
        const szerokoscCeglyZFuga = ceglaSzerokosc + fugaGrubosc;
        const wysokoscCeglyZFuga = ceglaWysokosc + fugaGrubosc;
        const iloscRzedow = Math.ceil(canvas.height / wysokoscCeglyZFuga);
        // Dodatkowa kolumna dla pełnego pokrycia
        const iloscKolumn = Math.ceil(canvas.width / szerokoscCeglyZFuga) + 1;

        for (let rzad = 0; rzad < iloscRzedow; rzad++) {
            const offset = (rzad % 2 !== 0) ? szerokoscCeglyZFuga / 2 : 0;
            for (let kolumna = 0; kolumna < iloscKolumn; kolumna++) {
                let x = kolumna * szerokoscCeglyZFuga - offset;
                const y = rzad * wysokoscCeglyZFuga;
                cegly.push(new Cegla(x, y, ceglaSzerokosc, ceglaWysokosc));
            }
        }
    }

    function niszczMur(klikX, klikY) {
        // NAPRAWA 1: Zmniejszony promień destrukcji i siła (mniejsze fragmenty)
        const PROMIEN_DESTRUKCJI = 40;
        const BAZOWA_SILA = 8;
        let ceglaZniszczona = false;

        cegly.forEach(cegla => {
            if (cegla.isStatic && !cegla.zniszczona) {
                const dx = (cegla.x + cegla.szerokosc / 2) - klikX;
                const dy = (cegla.y + cegla.wysokosc / 2) - klikY;
                const dystans = Math.sqrt(dx * dx + dy * dy);

                if (dystans < PROMIEN_DESTRUKCJI) {
                    ceglaZniszczona = true; // Zaznacz, że coś zostało zniszczone
                    cegla.isStatic = false;
                    const katEksplozji = Math.atan2(dy, dx);

                    // Siła jest proporcjonalna do dystansu od centrum
                    const sila = (PROMIEN_DESTRUKCJI - dystans) / (PROMIEN_DESTRUKCJI / BAZOWA_SILA);

                    cegla.vx = -Math.cos(katEksplozji) * sila * (0.8 + Math.random() * 0.4);
                    cegla.vy = -Math.sin(katEksplozji) * sila * (0.5 + Math.random() * 0.5) - 5;
                    cegla.predkoscKatowa = (Math.random() - 0.5) * 0.4;
                }
            }
        });
        return ceglaZniszczona; // Zwróć true, jeśli jakakolwiek cegła została uderzona
    }

    function animate() {
        // NAPRAWA KRUCJALNA (PRZEZROCZYSTOŚĆ): Usuwamy wypełnienie tła, wideo pod spodem jest widoczne
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // NOWA LOGIKA: Sprawdzenie kaskadowych zawaleń przed aktualizacją pozycji
        sprawdzWsparcie(); // <--- DODAJ TUTAJ

        cegly.forEach(cegla => {
            cegla.update();
            cegla.draw();
        });

        // Wewnątrz funkcji animate, przed requestAnimationFrame
        // ...
        let pozostaleStatyczne = cegly.some(c => c.isStatic);

        if (!pozostaleStatyczne) {
            const tiktokSymulacja = canvas.closest('.tiktok-symulacja');
            if (tiktokSymulacja) {
                // KLUCZOWY KROK: Ukryj canvas, usuń nakładkę z DOM i odblokuj interakcje UI
                canvas.style.display = 'none';
                // Usuń pointer-events: none z elementów UI pod Canvasem
                tiktokSymulacja.querySelector('.sidebar').style.pointerEvents = 'auto';
                tiktokSymulacja.querySelector('.bottombar').style.pointerEvents = 'auto';

                // Dodatkowo: znajdź i odblokuj wideo (jeśli było zablokowane)
                const video = tiktokSymulacja.querySelector('video');
                if (video && video.paused) {
                    video.play().catch(e => console.warn('Autoplay error po zniszczeniu muru:', e));
                    const pauseOverlay = tiktokSymulacja.querySelector('.pause-overlay');
                    if(pauseOverlay) pauseOverlay.classList.remove('visible');
                }

                // Konieczne jest też usunięcie samej nakładki Canvas
                const interactiveOverlay = canvas.closest('.interactive-wall-overlay');
                if (interactiveOverlay) {
                    interactiveOverlay.remove();
                }
                resizeObserver.unobserve(parent);
                return; // Zakończ animację
            }
        }

        requestAnimationFrame(animate);
    }

    // Resize handler (dostosowuje Canvas przy zmianie rozmiaru)
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            canvas.width = entry.contentRect.width;
            canvas.height = entry.contentRect.height;
            inicjalizujMur();
        }
    });
    if (parent) {
       resizeObserver.observe(parent);
    }

    function sprawdzWsparcie() {
        // 1. Filtruj tylko aktywne, statyczne cegły (potencjalnie niestabilne)
        const statyczneCegly = cegly.filter(c => c.isStatic && !c.zniszczona);
        let ceglyDoZawalenia = [];

        statyczneCegly.forEach(cegla => {
            // Pomijamy najniższy rząd (który zawsze ma podparcie)
            if (cegla.y + cegla.wysokosc + fugaGrubosc >= canvas.height - 1) return;

            // Określ obszar podparcia (jedną cegłę niżej, z uwzględnieniem offsetu)
            const xSrodek = cegla.x + cegla.szerokosc / 2;
            const yPodparcia = cegla.y + cegla.wysokosc + fugaGrubosc;

            // Flaga, czy znaleziono podparcie
            let maPodparcie = false;

            // Szukamy cegieł, które mogą stanowić podparcie w nowym, niższym rzędzie
            for (const podparcie of statyczneCegly) {
                // Sprawdź, czy cegła podparcia jest na niższym poziomie Y (z tolerancją)
                if (podparcie.y > cegla.y + 1) {
                    // Sprawdź, czy jej obszar X pokrywa się z górną cegłą
                    const jestPodSrodkiem = xSrodek >= podparcie.x && xSrodek <= podparcie.x + podparcie.szerokosc;

                    // Sprawdź, czy sąsiadują w pionie (na podstawie kalkulacji rzędów)
                    const jestWPrawidlowymRzedzie = Math.abs(podparcie.y - yPodparcia) < 2;

                    if (jestPodSrodkiem && jestWPrawidlowymRzedzie) {
                        maPodparcie = true;
                        break;
                    }
                }
            }

            // Jeśli nie ma podparcia, dodaj do listy do zwalenia
            if (!maPodparcie) {
                ceglyDoZawalenia.push(cegla);
            }
        });

        // Zwalaj cegły i nadaj im losowy impuls
        ceglyDoZawalenia.forEach(cegla => {
            cegla.isStatic = false;
            cegla.vy = Math.random() * 2; // Mały impuls w dół
            cegla.predkoscKatowa = (Math.random() - 0.5) * 0.2;
        });
    }

    // Listener interakcji
    canvas.addEventListener('click', (event) => {
        // KRUCJALNA NAPRAWA 2: ZAWSZE blokuj propagację do Swipera/Wideo.
        event.stopPropagation();

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 1. Wykonaj destrukcję. Zapisz, czy jakakolwiek cegła została uderzona.
        const czyZniszczono = niszczMur(x, y);

        // 2. Sprawdź, czy kliknięcie trafiło w JAKĄKOLWIEK nienaruszoną cegłę (nawet poza promieniem destrukcji)
        let trafionoWNienaruszonaCegle = cegly.some(cegla => {
            if (cegla.isStatic && !cegla.zniszczona) {
                 return (
                     x >= cegla.x && x <= cegla.x + cegla.szerokosc &&
                     y >= cegla.y && y <= cegla.y + cegla.wysokosc
                 );
            }
            return false;
        });

        // 3. LOGIKA PAUZY (NAPRAWIONA):
        // Wideo pauzuje/odtwarza TYLKO, jeśli NIE TRAFIONO w ŻADNĄ nienaruszoną cegłę.
        // (Czyli kliknięto w PUSTE TŁO lub w DZIURĘ pozostawioną przez zniszczone cegły).

        if (!trafionoWNienaruszonaCegle) {
             const video = canvas.closest('.tiktok-symulacja')?.querySelector('video');
             const pauseOverlay = canvas.closest('.tiktok-symulacja')?.querySelector('.pause-overlay');

             if(video) {
                 if (video.paused) {
                     video.play().catch(e => console.warn('Autoplay error:', e));
                     if (pauseOverlay) pauseOverlay.classList.remove("visible");
                 } else {
                     video.pause();
                     if (pauseOverlay) pauseOverlay.classList.add("visible");
                 }
             }
        }
    });

    inicjalizujMur();
    animate();
}
