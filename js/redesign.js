/* Tiny progressive enhancement: native details menu works without JS. */
(() => {
  const menu = document.querySelector('.mobile-nav');
  if (!menu) return;
  menu.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => { menu.open = false; });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') menu.open = false;
  });
  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
})();
