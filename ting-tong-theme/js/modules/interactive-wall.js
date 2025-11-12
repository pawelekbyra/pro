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
        cegly.forEach(cegla => {
            if (cegla.isStatic && !cegla.zniszczona) {
                const dx = (cegla.x + cegla.szerokosc / 2) - klikX;
                const dy = (cegla.y + cegla.wysokosc / 2) - klikY;
                const dystans = Math.sqrt(dx * dx + dy * dy);

                if (dystans < 150) {
                    cegla.isStatic = false;
                    const katEksplozji = Math.atan2(dy, dx);
                    const sila = (150 - dystans) / 15;
                    cegla.vx = -Math.cos(katEksplozji) * sila;
                    cegla.vy = -Math.sin(katEksplozji) * sila - 5;
                    cegla.predkoscKatowa = (Math.random() - 0.5) * 0.4;
                }
            }
        });
    }

    function animate() {
        // NAPRAWA KRUCJALNA (PRZEZROCZYSTOŚĆ): Usuwamy wypełnienie tła, wideo pod spodem jest widoczne
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        cegly.forEach(cegla => {
            cegla.update();
            cegla.draw();
        });

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
        // KRUCJALNA NAPRAWA 1: ZAWSZE blokuj propagację, by zapobiec pauzie w Swiperze.
        event.stopPropagation();

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Uruchom niszczenie muru
        niszczMur(x, y);

        // KRUCJALNA NAPRAWA 2: Logika pauzowania/odtwarzania (tylko w "dziurze")
        let trafionoWNienaruszonaCegle = cegly.some(cegla => {
            if (cegla.isStatic && !cegla.zniszczona) {
                 return (
                     x >= cegla.x && x <= cegla.x + cegla.szerokosc &&
                     y >= cegla.y && y <= cegla.y + cegla.wysokosc
                 );
            }
            return false;
        });

        // Jeśli NIE trafiono w ŻADNĄ nienaruszoną cegłę (czyli kliknięto w tło/dziurę)
        if (!trafionoWNienaruszonaCegle) {
             const video = canvas.closest('.tiktok-symulacja')?.querySelector('video');
             const pauseOverlay = canvas.closest('.tiktok-symulacja')?.querySelector('.pause-overlay');

             if(video) {
                 if (video.paused) {
                     video.play().catch(e => console.warn('Autoplay error after clicking hole:', e));
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
