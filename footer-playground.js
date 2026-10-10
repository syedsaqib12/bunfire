(() => {
  'use strict';
  const host = document.querySelector('#flavor-playground');
  if(!host) return;
  const stage = host.querySelector('.flavor-stage');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const buttons = [...host.querySelectorAll('.flavor-ingredient')];
  const pupils = [...host.querySelectorAll('.flavor-pupil')];
  const anchors = [.13,.36,.61,.86];
  const vertical = [.35,.24,.35,.27];
  const bodies = buttons.map((element,index) => ({element,index,x:0,y:0,vx:0,vy:0,spin:0,spinVelocity:0,width:0,height:0,settled:false}));
  let width=0,height=0,visible=false,frame=0,lastTime=0,elapsed=0;
  const pointer = {x:0,y:0,clientX:0,clientY:0,active:false};
  const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

  function measure() {
    const previousWidth=width,previousHeight=height;
    width=stage.clientWidth;height=stage.clientHeight;
    if(!width||!height)return;
    bodies.forEach(body=>{
      body.width=body.element.offsetWidth;body.height=body.element.offsetHeight;
      if(!body.settled){body.x=width*anchors[body.index];body.y=height*vertical[body.index];body.settled=true;}
      else if(previousWidth&&previousHeight){body.x*=width/previousWidth;body.y*=height/previousHeight;}
      constrain(body);paintBody(body,0);
    });
    stage.classList.add('flavor-ready');
  }
  function constrain(body) {
    const left=body.width*.43+5,right=width-body.width*.43-5;
    const top=body.height*.43+5,bottom=height-body.height*.43-30;
    if(body.x<left){body.x=left;body.vx=Math.abs(body.vx)*.55;}
    else if(body.x>right){body.x=right;body.vx=-Math.abs(body.vx)*.55;}
    if(body.y<top){body.y=top;body.vy=Math.abs(body.vy)*.55;}
    else if(body.y>bottom){body.y=bottom;body.vy=-Math.abs(body.vy)*.55;}
  }
  function paintBody(body,time) {
    const angle=reduce.matches?[-14,12,-10,15][body.index]:Math.sin(time*.53+body.index*1.7)*11+[-12,5,-7,10][body.index]+body.spin;
    body.element.style.transform=`translate3d(${(body.x-body.width/2).toFixed(2)}px,${(body.y-body.height/2).toFixed(2)}px,0) rotate(${angle.toFixed(2)}deg)`;
  }
  function gaze() {
    if(reduce.matches)return;
    const rect=stage.getBoundingClientRect();
    const targetX=pointer.active?pointer.clientX:rect.left+width*(.52+Math.sin(elapsed*.25)*.2);
    const targetY=pointer.active?pointer.clientY:rect.top+height*.34;
    const transforms=pupils.map(pupil=>{
      const eye=pupil.parentElement,box=eye.getBoundingClientRect();
      const dx=targetX-(box.left+box.width/2),dy=targetY-(box.top+box.height/2);
      const length=Math.hypot(dx,dy)||1;
      const reach=box.width*.20;
      const amount=Math.min(1,length/130);
      return `translate(calc(-50% + ${(dx/length*reach*amount).toFixed(2)}px),calc(-50% + ${(dy/length*reach*amount).toFixed(2)}px))`;
    });
    pupils.forEach((pupil,index)=>{pupil.style.transform=transforms[index];});
  }
  function tick(time) {
    frame=0;
    if(!visible||document.hidden||reduce.matches)return;
    const dt=Math.min(.035,(time-lastTime)/1000||.016);lastTime=time;elapsed+=dt;
    const small=width<600;
    bodies.forEach(body=>{
      const index=body.index;
      const targetX=width*anchors[index]+Math.sin(elapsed*.31+index*2.1)*Math.min(65,width*.045);
      const targetY=height*vertical[index]+Math.sin(elapsed*.47+index*1.8)*height*.115;
      let ax=(targetX-body.x)*5,ay=(targetY-body.y)*5;
      if(pointer.active) {
        const dx=body.x-pointer.x,dy=body.y-pointer.y,distance=Math.hypot(dx,dy)||1;
        const radius=small?95:145;
        if(distance<radius){const force=(1-distance/radius)*460;ax+=dx/distance*force;ay+=dy/distance*force;}
      }
      body.vx=(body.vx+ax*dt)*Math.exp(-2.1*dt);body.vy=(body.vy+ay*dt)*Math.exp(-2.1*dt);
      body.x+=body.vx*dt;body.y+=body.vy*dt;
      body.spinVelocity=(body.spinVelocity-body.spin*2*dt)*Math.exp(-1.3*dt);body.spin+=body.spinVelocity*dt;
      constrain(body);
    });
    // A little separation keeps the four floating ingredients readable.
    for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
      const a=bodies[i],b=bodies[j],dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy)||1;
      const spacing=(a.width+b.width)*.33;
      if(dist<spacing){const push=(spacing-dist)*.15;const nx=dx/dist,ny=dy/dist;a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;constrain(a);constrain(b);}
    }
    bodies.forEach(body=>paintBody(body,elapsed));gaze();
    frame=requestAnimationFrame(tick);
  }
  function start() {
    if(frame||!visible||document.hidden||reduce.matches)return;
    lastTime=performance.now();frame=requestAnimationFrame(tick);
  }
  function stop() {cancelAnimationFrame(frame);frame=0;}
  function bounce(body,intensity=1) {
    if(reduce.matches)return;
    body.vy-=220*intensity;body.vx+=(body.index%2?-1:1)*85*intensity;
    body.spinVelocity+=(body.index%2?-1:1)*95*intensity;start();
  }
  function updateMotionControls() {
    buttons.forEach(button=>{button.disabled=reduce.matches;});
  }
  updateMotionControls();
  buttons.forEach((button,index)=>button.addEventListener('click',()=>bounce(bodies[index])));
  host.querySelector('.flavor-shuffle').addEventListener('click',()=>bodies.forEach(body=>bounce(body,1.25)));
  stage.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse')return;
    const rect=stage.getBoundingClientRect();pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top;pointer.clientX=event.clientX;pointer.clientY=event.clientY;pointer.active=true;
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{pointer.active=false;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
  reduce.addEventListener('change',()=>{
    updateMotionControls();
    if(reduce.matches){stop();pupils.forEach(pupil=>{pupil.style.transform='translate(-50%,-50%)';});bodies.forEach(body=>{body.vx=body.vy=body.spin=body.spinVelocity=0;body.x=width*anchors[body.index];body.y=height*vertical[body.index];constrain(body);paintBody(body,0);});}
    else start();
  });
  if('ResizeObserver' in window)new ResizeObserver(measure).observe(stage);
  else window.addEventListener('resize',measure,{passive:true});
  if('IntersectionObserver' in window){new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop();},{rootMargin:'50px'}).observe(stage);}
  else {visible=true;start();}
  measure();
})();
