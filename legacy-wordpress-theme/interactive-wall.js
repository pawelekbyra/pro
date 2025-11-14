import { UI } from './ui.js'; // Dodaj import na początku

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
    let ceglyDoZniszczenia = 0; // NOWA ZMIENNA (zlicza pierwotną liczbę cegieł)

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
        ceglyDoZniszczenia = 0; // Reset
        const szerokoscCeglyZFuga = ceglaSzerokosc + fugaGrubosc;
        const wysokoscCeglyZFuga = ceglaWysokosc + fugaGrubosc;
        const iloscRzedow = Math.ceil(canvas.height / wysokoscCeglyZFuga) + 1;
        // Dodatkowa kolumna dla pełnego pokrycia
        const iloscKolumn = Math.ceil(canvas.width / szerokoscCeglyZFuga) + 2;

        for (let rzad = 0; rzad < iloscRzedow; rzad++) {
            const offset = (rzad % 2 !== 0) ? szerokoscCeglyZFuga / 2 : 0;
            for (let kolumna = 0; kolumna < iloscKolumn; kolumna++) {
                let x = kolumna * szerokoscCeglyZFuga - offset;
                const y = rzad * wysokoscCeglyZFuga;
                const nowaCegla = new Cegla(x, y, ceglaSzerokosc, ceglaWysokosc);
                cegly.push(nowaCegla);
                ceglyDoZniszczenia++; // Zlicz statyczne cegły
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
        // NAPRAWA KRUCJALNA (PRZEZROCZYSTOŚĆ): Usunięto wypełnienie tła, wideo pod spodem jest widoczne
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let statyczneCegly = 0;

        // Iteracja od tyłu dla bezpieczeństwa
        for(let i = cegly.length - 1; i >= 0; i--) {
            const cegla = cegly[i];
            if (!cegla.zniszczona) {
                cegla.update();
                cegla.draw();
            }
            if (cegla.isStatic && !cegla.zniszczona) {
                statyczneCegly++;
            }
        }

        // Usuń cegły, które zniszczyły się lub wypadły z ekranu
        cegly = cegly.filter(c => !c.zniszczona && (c.isStatic || c.y < canvas.height + c.wysokosc));

        // KLUCZOWA LOGIKA SPRAWDZANIA ZNISZCZENIA
        if (statyczneCegly === 0 && ceglyDoZniszczenia > 0) {
            // Wszystkie statyczne cegły zostały zamienione na dynamiczne.
            ceglyDoZniszczenia = 0; // Zapobiega ponownemu wywołaniu

            // Poczekaj na animację spadania (np. 1.5 sekundy)
            setTimeout(() => {
                UI.handleWallDestroyed(slideId); // Wywołaj funkcję sukcesu UI
                // Opcjonalnie: usuń canvas po animacji
                if (parent) {
                    canvas.remove();
                    parent.classList.remove('visible');
                }
            }, 1500);

            return; // Zakończ pętlę animacji na dobre
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

    // Listener interakcji
    canvas.addEventListener('click', (event) => {
        // KRUCJALNA NAPRAWA: ZAWSZE blokuj propagację do Swipera/Wideo.
        event.stopPropagation();

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Wykonaj destrukcję.
        niszczMur(x, y);

        // ZMIANA: USUNIĘTO logikę pauzy/odtwarzania wideo
    });

    inicjalizujMur();
    animate();
}
