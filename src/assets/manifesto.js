// Keep the supplied still available without JavaScript or automatic motion.
const artwork = document.querySelector('#manifesto-art-image');
const toggle = document.querySelector('.manifesto-art-toggle');

if (artwork && toggle) {
  const still = artwork.getAttribute('src');
  const animation = artwork.dataset.animationSrc;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !reducedMotion.matches;

  function render() {
    artwork.src = playing ? animation : still;
    toggle.textContent = playing ? 'Pause animation' : 'Play animation';
  }

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    playing = !playing;
    render();
  });
  reducedMotion.addEventListener('change', () => {
    playing = !reducedMotion.matches;
    render();
  });
  render();
}
