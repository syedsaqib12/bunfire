(() => {
  'use strict';
  const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ingredients = ['lettuce','tomato','cheese','patty'];
  let overlay, line, beads = [], frame = 0, previousTime = 0, active = false;
  const target = {x:0,y:0};
  const enabled = () => mouse.matches && !reduced.matches && !document.hidden;

  function createTrail() {
    overlay = document.createElement('div');
    overlay.className = 'food-trail';
    overlay.setAttribute('aria-hidden','true');
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('focusable','false');
    line = document.createElementNS(svg.namespaceURI,'path');
    svg.append(line);overlay.append(svg);
    beads = ingredients.map((ingredient,index) => {
      const element = document.createElement('span');
      element.className = 'food-trail-node';
      const size = 32-index*2;
      element.style.setProperty('--trail-size',`${size}px`);
      const image = document.createElement('img');
      image.src = `assets/cursor-${ingredient}.webp`;image.alt = '';
      image.width = image.height = 96;image.decoding = 'async';
      element.append(image);overlay.append(element);
      return {element,size,x:target.x-index*5,y:target.y+index*4,vx:0,vy:0};
    });
    document.body.append(overlay);
  }
  function paint() {
    beads.forEach((bead,index) => {
      const tilt = Math.max(-24,Math.min(24,bead.vx*.025))+[10,-8,12,-6][index];
      bead.element.style.transform = `translate3d(${(bead.x-bead.size/2).toFixed(2)}px,${(bead.y-bead.size/2).toFixed(2)}px,0) rotate(${tilt.toFixed(2)}deg)`;
    });
    const point = bead => `${bead.x.toFixed(2)} ${bead.y.toFixed(2)}`;
    let path = `M ${point(beads[0])}`;
    for(let i=1;i<beads.length-1;i++) {
      const a=beads[i],b=beads[i+1];
      path += ` Q ${point(a)} ${((a.x+b.x)/2).toFixed(2)} ${((a.y+b.y)/2).toFixed(2)}`;
    }
    line.setAttribute('d',path+` T ${point(beads[beads.length-1])}`);
  }
  function tick(time) {
    frame=0;
    if(!active||!enabled()){hide();return;}
    const dt=Math.min(.033,Math.max(.001,(time-previousTime)/1000));previousTime=time;
    let unsettled=false;
    beads.forEach((bead,index) => {
      const destination=index?{x:beads[index-1].x-5,y:beads[index-1].y+4}:target;
      const dx=destination.x-bead.x,dy=destination.y-bead.y;
      const spring=155-index*12,damping=Math.exp(-(19-index)*dt);
      bead.vx=(bead.vx+dx*spring*dt)*damping;
      bead.vy=(bead.vy+dy*spring*dt)*damping;
      bead.x+=bead.vx*dt;bead.y+=bead.vy*dt;
      if(Math.hypot(dx,dy)>.15||Math.hypot(bead.vx,bead.vy)>.5)unsettled=true;
    });
    paint();
    if(unsettled)frame=requestAnimationFrame(tick);
  }
  function start() {
    if(frame||!active||!enabled())return;
    previousTime=performance.now();frame=requestAnimationFrame(tick);
  }
  function hide() {
    active=false;cancelAnimationFrame(frame);frame=0;
    overlay?.classList.remove('is-visible');
  }
  window.addEventListener('pointermove',event => {
    if(event.pointerType!=='mouse'||!enabled()){hide();return;}
    target.x=event.clientX+13;target.y=event.clientY+12;
    if(!overlay)createTrail();
    if(!active)beads.forEach((bead,index)=>{bead.x=target.x-index*5;bead.y=target.y+index*4;bead.vx=bead.vy=0;});
    active=true;paint();overlay.classList.add('is-visible');start();
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',hide);
  document.addEventListener('visibilitychange',hide);
  window.addEventListener('blur',hide);
  reduced.addEventListener('change',hide);
  mouse.addEventListener('change',hide);
})();
