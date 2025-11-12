// ting-tong-theme/js/modules/interactive-wall.js

export function initInteractiveWall(canvas, slideId) {
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    const ceglaSzerokosc = 60;
    const ceglaWysokosc = 30;
    const fugaGrubosc = 1;
    const kolorCegly = '#ffffff';
    const kolorFugi = '#333333';
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
            ctx.fillStyle = kolorCegly;
            ctx.fillRect(-this.szerokosc / 2, -this.wysokosc / 2, this.szerokosc, this.wysokosc);
            ctx.restore();
        }

        update() {
            if (this.isStatic || this.zniszczona) return;

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
        const iloscKolumn = Math.ceil(canvas.width / szerokoscCeglyZFuga) + 1;

        for (let rzad = 0; rzad < iloscRzedow; rzad++) {
            for (let kolumna = 0; kolumna < iloscKolumn; kolumna++) {
                let x = kolumna * szerokoscCeglyZFuga;
                if (rzad % 2 !== 0) {
                    x -= szerokoscCeglyZFuga / 2;
                }
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

                if (dystans < 150) { // Promień eksplozji
                    cegla.isStatic = false;
                    const katEksplozji = Math.atan2(dy, dx);
                    const sila = (150 - dystans) / 15;
                    cegla.vx = -Math.cos(katEksplozji) * sila;
                    cegla.vy = -Math.sin(katEksplozji) * sila - 5; // Dodatkowy "kop" w górę
                    cegla.predkoscKatowa = (Math.random() - 0.5) * 0.4;
                }
            }
        });
    }

    function animate() {
        ctx.fillStyle = kolorFugi;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let aktywneCegly = false;
        cegly.forEach(cegla => {
            cegla.update();
            cegla.draw();
            if (!cegla.isStatic && !cegla.zniszczona) {
                aktywneCegly = true;
            }
        });

        requestAnimationFrame(animate);
    }

    // Resize handler
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

    // Click handler
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        niszczMur(x, y);
    });

    inicjalizujMur();
    animate();
}
