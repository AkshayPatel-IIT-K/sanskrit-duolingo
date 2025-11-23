export function runConfetti(canvas, count=80){
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = window.innerWidth);
  const h = (canvas.height = window.innerHeight);
  const colors = ['#f7d08a','#ffd87d','#f0b23b','#c49a39','#9c772c'];
  const pieces = [];
  for(let i=0;i<count;i++){
    pieces.push({x:Math.random()*w,y:Math.random()*-h*0.5,w:Math.random()*8+6,h:Math.random()*4+4,dx:(Math.random()-0.5)*6,dy:Math.random()*4+2,color:colors[Math.floor(Math.random()*colors.length)],rot:Math.random()*360,drot:(Math.random()-0.5)*6});
  }
  let raf;
  const draw = ()=> {
    ctx.clearRect(0,0,w,h);
    for(const p of pieces){
      p.x+=p.dx; p.y+=p.dy; p.dy+=0.12; p.rot+=p.drot;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate((p.rot*Math.PI)/180);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
    }
    if(pieces.every(p=>p.y>h+60)){ cancelAnimationFrame(raf); ctx.clearRect(0,0,w,h); canvas.width=0; canvas.height=0; } else { raf = requestAnimationFrame(draw); }
  }
  draw();
}
