// Inject a professional themed footer across all pages
(() => {
  const container = document.getElementById('site-footer');
  if (!container) return;

  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="footer-inner">
      <span class="footer-text">© ${new Date().getFullYear()} RIS Coins System | Made by Muhammad Ali Javed</span>
    </div>
  `;

  container.appendChild(footer);
})();
