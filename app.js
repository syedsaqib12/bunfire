(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menuItems = {
    classic: {name: 'The Classic Smash', price: 12, description: 'The burger that started the craving. A double smash, a proper cheese melt, and just the right amount of tang.', ingredients: ['Toasted brioche bun', 'Two smashed beef patties', 'Melted cheddar', 'Lettuce, tomato & pickles', 'Signature house sauce'], allergens: 'Contains wheat, milk and egg.', image: 'assets/burger-hero.png'},
    heat: {name: 'Hot Honey Heat', price: 14, description: 'A little sweet. A little fiery. A whole lot of reasons to take another bite.', ingredients: ['Toasted brioche bun', 'Smashed beef patty', 'Pepper jack cheese', 'Sliced jalapeños', 'Hot honey & house sauce'], allergens: 'Contains wheat, milk and egg.', image: 'assets/burger-hero.png'},
    bbq: {name: 'The Smoky Stack', price: 16, description: 'Big, bold and beautifully messy. The smoky one that goes all in.', ingredients: ['Toasted brioche bun', 'Two smashed beef patties', 'Smoked cheddar', 'Crispy onions', 'Smoky BBQ sauce'], allergens: 'Contains wheat, milk and egg.', image: 'assets/burger-hero.png'},
    garden: {name: 'Garden Party', price: 13, description: 'All the burger joy, with plants at the center. Crunchy greens, a hearty patty, and a creamy herb finish.', ingredients: ['Toasted burger bun', 'Plant-based patty', 'Lettuce & tomato', 'Pickles', 'Herb mayonnaise'], allergens: 'Contains wheat, soy and egg. Vegetarian; not vegan.', image: 'assets/grill-editorial.jpg', photo: true},
    fries: {name: 'Golden Hour Fries', price: 5, description: 'Golden, salty, crispy. Your burger’s favorite plus one.', ingredients: ['Skin-on potato fries', 'Sea salt', 'Signature spice seasoning'], allergens: 'Sample preparation details; confirm ingredients and shared-fryer allergens with the restaurant.', image: 'assets/fries-editorial.jpg', photo: true},
    loaded: {name: 'Fully Loaded Fries', price: 8, description: 'When the side wants to be the main event. Golden fries dressed up with all the good stuff.', ingredients: ['Golden potato fries', 'Warm cheese sauce', 'Jalapeños', 'Creamy ranch dressing'], allergens: 'Contains milk and egg.', image: 'assets/fries-editorial.jpg', photo: true}
  };
  const toggle = document.querySelector('.mobile-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  const closeNav = () => { mobileNav.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation'); };
  toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); mobileNav.hidden = !open; });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeNav(); });
  window.addEventListener('resize', () => { if(window.innerWidth > 780) closeNav(); }, {passive: true});

  const cards = [...document.querySelectorAll('.menu-card')];
  const filters = [...document.querySelectorAll('.filter')];
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(filter => { const active = filter === button; filter.classList.toggle('active', active); filter.setAttribute('aria-pressed', String(active)); });
    let count = 0;
    cards.forEach(card => { const show = button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter; card.hidden = !show; if(show) { count++; card.classList.add('visible'); } });
    document.querySelector('#menu-count').textContent = `${count} delicious choices`;
  }));

  const dialog = document.querySelector('#item-dialog');
  let lastCard = null;
  const closeDialog = () => { dialog.close(); document.body.style.overflow = ''; if(lastCard) lastCard.focus({preventScroll: true}); };
  cards.forEach(card => card.addEventListener('click', () => {
    const item = menuItems[card.dataset.item];
    if(!item) return;
    lastCard = card;
    document.querySelector('#dialog-title').textContent = item.name;
    document.querySelector('.dialog-description').textContent = item.description;
    document.querySelector('.dialog-price').textContent = `$${item.price}`;
    document.querySelector('.allergen-note').textContent = item.allergens;
    const image = document.querySelector('#dialog-image');
    image.src = item.image; image.alt = `Illustrative photograph for ${item.name}`; image.classList.toggle('is-side', !!item.photo);
    const list = document.querySelector('.ingredient-list'); list.replaceChildren();
    item.ingredients.forEach(text => { const li = document.createElement('li'); li.textContent = text; list.appendChild(li); });
    dialog.showModal(); document.body.style.overflow = 'hidden';
  }));
  document.querySelector('.dialog-close').addEventListener('click', closeDialog);
  dialog.addEventListener('cancel', e => { e.preventDefault(); closeDialog(); });
  dialog.addEventListener('click', e => { if(e.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if(e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) closeDialog(); });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; });

  if('IntersectionObserver' in window && !reducedMotion.matches) {
    document.body.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), {threshold: 0.08, rootMargin: '0px 0px 30px 0px'});
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }

  const section = document.querySelector('#layers');
  const sticky = document.querySelector('.layers-sticky');
  const hero = document.querySelector('#hero-object');
  const burgerLayers = [...document.querySelectorAll('.burger-layer')];
  const labels = [...document.querySelectorAll('.ingredient-label')];
  const progressBar = document.querySelector('.layer-progress i');
  const progressNumber = document.querySelector('.progress-number');
  let pointerX = 0, pointerY = 0, ticking = false;
  const clamp = (v,min,max) => Math.max(min, Math.min(max,v));
  const ease = v => v * v * (3 - 2 * v);
  const render = () => {
    ticking = false;
    const bounds = section.getBoundingClientRect();
    const travel = Math.max(1, section.offsetHeight - sticky.offsetHeight);
    const progress = clamp(-bounds.top / travel,0,1);
    const explode = ease(clamp((progress - 0.04) / 0.62,0,1));
    const small = window.innerWidth < 780;
    const distance = small ? 82 : 125;
    if(!reducedMotion.matches) {
      const offsets = [-1.1,-.28,.43,1.05];
      const rotations = [-6,4,-3,4];
      burgerLayers.forEach((layer,index) => { layer.style.transform = `translateY(${offsets[index] * distance * explode}px) rotate(${rotations[index] * explode}deg)`; });
      labels.forEach((label,index) => { const appearance = clamp(explode * 1.5 - index * .09, 0, 1); label.style.opacity = String(.25 + appearance * .75); label.style.transform = `translateY(${(1-appearance)*14}px)`; });
      const scrollY = Math.min(window.scrollY,900);
      hero.style.transform = `translate(-50%, ${scrollY * .08 + pointerY}px) rotate(${pointerX * .15}deg)`;
    } else {
      burgerLayers.forEach(layer => { layer.style.transform = ''; });
      labels.forEach(label => { label.style.opacity = '1'; label.style.transform = ''; });
      hero.style.transform = 'translateX(-50%)';
    }
    progressBar.style.width = `${Math.round(progress * 100)}%`;
    progressNumber.textContent = `${String(Math.round(progress * 100)).padStart(2,'0')}%`;
  };
  const schedule = () => { if(!ticking) { ticking = true; requestAnimationFrame(render); } };
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  window.addEventListener('pointermove', e => { if(e.pointerType !== 'mouse' || reducedMotion.matches || window.scrollY > 850) return; pointerX = (e.clientX / window.innerWidth - .5) * 14; pointerY = (e.clientY / window.innerHeight - .5) * 10; schedule(); }, {passive: true});
  reducedMotion.addEventListener('change', () => { if(reducedMotion.matches) document.body.classList.remove('motion-ready'); schedule(); });
  schedule();
})();
