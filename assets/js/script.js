// Basic UI scripts: mobile menu, back-to-top, parallax simple, year update
document.addEventListener('DOMContentLoaded', function(){
  // Year
  const yearEl = document.getElementById('year'); if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu
  const btnMenu = document.getElementById('btn-menu');
  const mainNav = document.getElementById('mainNav');
  btnMenu && btnMenu.addEventListener('click', () => {
    if(mainNav.style.display === 'flex'){ mainNav.style.display = 'none'; }
    else { mainNav.style.display = 'flex'; mainNav.style.flexDirection = 'column'; mainNav.style.gap = '0.6rem'; }
  });

  // Back to top
  const back = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if(window.scrollY > 300) back.style.display = 'flex'; else back.style.display = 'none';
  });
  back && back.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));

  // Parallax simple
  const isMobile = window.matchMedia("(max-width:768px)").matches;
  if(!isMobile){
    const parallaxEls = document.querySelectorAll('.parallax');
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallaxSpeed) || 0.2;
        el.style.transform = `translateY(${scrolled * speed * -1}px)`;
      });
    });
  }

});
