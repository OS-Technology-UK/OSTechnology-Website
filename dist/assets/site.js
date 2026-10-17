(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const menu = document.querySelector('.menu-toggle'), nav = document.querySelector('.site-nav');
  const services = document.querySelector('.services-nav');
  const closeMenu = () => { nav?.classList.remove('open'); menu?.setAttribute('aria-expanded', 'false'); if(services) services.open = false; };
  menu?.addEventListener('click', () => menu.setAttribute('aria-expanded', String(nav.classList.toggle('open'))));
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if(event.key !== 'Escape') return;
    if(services?.open) { services.open = false; services.querySelector('summary').focus(); }
    else if(nav?.classList.contains('open')) { closeMenu(); menu.focus(); }
  });
  document.addEventListener('click', event => { if(services && !services.contains(event.target)) services.open = false; });
  services?.addEventListener('focusout', event => { if(!services.contains(event.relatedTarget)) services.open = false; });
  const finder = document.querySelector('[data-finder]');
  if(finder) {
    const service = document.getElementById('service');
    finder.querySelectorAll('[data-support-choice]').forEach(link => link.addEventListener('click', event => {
      if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if(service && [...service.options].some(option => option.value === link.dataset.enquiryService)) {
        event.preventDefault();
        service.value = link.dataset.enquiryService;
        if(location.hash !== '#contact') history.pushState(null, '', '#contact');
        service.scrollIntoView({block: 'center'});
        service.focus({preventScroll: true});
      }
    }));
  }
const form=document.getElementById('contact-form');if(form){const loaded=form.querySelector('#_form_loaded_at');if(loaded)loaded.value=Date.now();const io='IntersectionObserver'in window?new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){const s=document.createElement('script');s.src='https://web3forms.com/client/script.js';s.async=true;document.head.appendChild(s);io.disconnect()}},{rootMargin:'200px'}):null;if(io)io.observe(form);form.addEventListener('submit',async e=>{e.preventDefault();const success=form.querySelector('#form-success'),error=form.querySelector('#form-error'),button=form.querySelector('[type=submit]');success.hidden=true;error.hidden=true;if(!form.checkValidity()){form.reportValidity();return}const captcha=form.querySelector('[name="h-captcha-response"]');if(captcha&&!captcha.value){const msg=form.querySelector('#captcha-error');if(msg)msg.textContent='Please complete the captcha.';return}button.disabled=true;button.textContent='Sending…';try{const response=await fetch(form.action,{method:'POST',body:new FormData(form)});const payload=await response.json();if(!response.ok||!payload.success)throw new Error('Submit failed');form.reset();if(loaded)loaded.value=Date.now();success.hidden=false}catch{error.hidden=false}finally{button.disabled=false;button.innerHTML='Send enquiry <span>↗</span>'}})}})();
