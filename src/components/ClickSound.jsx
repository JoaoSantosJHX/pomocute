// ClickSound.js (ou .jsx)
const clickSound = new Audio('/assets/click.mp3');

export function playClick() {
  clickSound.currentTime = 0; // reinicia o som para poder tocar várias vezes rápido
  clickSound.play().catch(() => {
    // pode ignorar erros de autoplay
  });
}
