const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const WA='5511946540600';
const wa=t=>`https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const imgs=i=>i.imgs||[1,2,3,4].map(n=>`images/${i.id}-${n}.svg`);

/* Abas */
function showTab(t){
  if(!$('#'+t))t='inicio';
  $$('.tab').forEach(s=>s.classList.toggle('on',s.id===t));
  $$('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));
  history.replaceState(null,'','#'+t); scrollTo(0,0);
  document.title=`powerUp | ${$('#tabs .on')?.textContent||'Início'}`;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-tab]'); if(b){e.preventDefault();showTab(b.dataset.tab)}});

/* Catálogo com filtros */
function catalog(root){
  const key=root.dataset.key, items=ITEMS.filter(i=>i.tipo===key), price=key!=='servicos', cats=[...new Set(items.map(i=>i.cat))];
  const max=price?Math.ceil(Math.max(1000,...items.map(i=>i.price))/1000)*1000:0;
  root.innerHTML=`<div class="filters">
    <label>Buscar<input type="search" data-f="q" placeholder="Nome ou descrição"></label>
    <label>Categoria<select data-f="cat"><option value="">Todas</option>${cats.map(c=>`<option>${c}</option>`).join('')}</select></label>
    ${price?`<label>Preço até <span data-o="max">${brl(max)}</span><input type="range" data-f="max" min="0" max="${max}" step="${max>20000?5000:100}" value="${max}"></label>
    <label>Ordenar<select data-f="ord"><option value="">Relevância</option><option value="a">Menor preço</option><option value="d">Maior preço</option></select></label>`:''}
  </div><p class="count"></p><div class="grid"></div>`;
  const grid=$('.grid',root), f=k=>$(`[data-f=${k}]`,root)?.value;
  const draw=()=>{
    const q=f('q').toLowerCase(), c=f('cat'), m=price?+f('max'):0;
    let r=items.filter(i=>(!c||i.cat===c)&&(!q||(i.name+i.desc).toLowerCase().includes(q))&&(!price||i.price<=m));
    if(f('ord'))r.sort((a,b)=>f('ord')==='a'?a.price-b.price:b.price-a.price);
    if(price)$('[data-o=max]',root).textContent=brl(m);
    $('.count',root).textContent=`${r.length} ${r.length===1?'resultado':'resultados'}`;
    grid.innerHTML=r.length?r.map(i=>`<button class="card" data-id="${i.id}"><img src="${imgs(i)[0]}" alt="${i.name}" loading="lazy"><div><small>${i.cat}</small><h3>${i.name}</h3><strong>${price?brl(i.price):i.local}</strong></div></button>`).join(''):'<p class="empty">Nenhum item encontrado. Ajuste os filtros ou limpe a busca.</p>';
  };
  root.addEventListener('input',draw);
  grid.addEventListener('click',e=>{const c=e.target.closest('.card'); if(c)openItem(items.find(i=>i.id===c.dataset.id),price)});
  draw();
}

/* Modal com galeria */
const modal=$('#modal');
function openItem(i,price){
  const im=imgs(i), thumbs=im.map((s,n)=>`<button data-s="${n}" aria-label="Foto ${n+1}"><img src="${s}" alt=""></button>`).join('')+(i.video?`<button data-s="v" aria-label="Vídeo"><span class="vt">▶ Vídeo</span></button>`:'');
  $('#mbody').innerHTML=`<div class="m"><div class="gal"><div class="stage"></div><div class="thumbs">${thumbs}</div></div>
  <div class="minfo"><small>${i.cat}</small><h3>${i.name}</h3>${price?`<div class="price">${brl(i.price)}</div>`:`<p>${i.local}</p>`}<p>${i.desc}</p><ul>${i.specs.map(s=>`<li>${s}</li>`).join('')}</ul>
  <a class="btn" target="_blank" rel="noopener" href="${wa(price?`Olá! Tenho interesse em: ${i.name}`:`Olá! Quero um orçamento parecido com: ${i.name}`)}">${price?'Tenho interesse':'Pedir orçamento parecido'}</a></div></div>`;
  const stage=$('.stage'), show=k=>{
    stage.innerHTML=k==='v'?`<video src="${i.video}" controls autoplay playsinline></video>`:`<img src="${im[k]}" alt="${i.name}">`;
    $$('.thumbs button').forEach(b=>b.classList.toggle('on',b.dataset.s==k));
  };
  $('.thumbs').onclick=e=>{const b=e.target.closest('button'); if(b)show(b.dataset.s==='v'?'v':+b.dataset.s)};
  show(0); modal.showModal();
}
modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.x'))modal.close()});
modal.addEventListener('close',()=>$('#mbody').innerHTML='');

/* Formulário -> WhatsApp */
$('#form').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.target);
  open(wa(`Olá! Sou ${d.get('nome')}. Assunto: ${d.get('assunto')}. ${d.get('msg')}`),'_blank')});

/* Dados: data/items.json (editável sem mexer em código) */
let ITEMS=[];
const lista=v=>Array.isArray(v)?v:String(v||'').split(';').map(s=>s.trim()).filter(Boolean);
fetch('data/items.json',{cache:'no-cache'}).then(r=>r.json()).then(d=>{
  ITEMS=(d.itens||d).filter(i=>i.ativo!==false&&String(i.ativo).toLowerCase()!=='false').map((i,n)=>({...i,id:i.id||('item-'+n),price:parseFloat(i.price)||0,specs:lista(i.specs),imgs:i.imgs?lista(i.imgs):null}));
}).catch(()=>{$$('.catalog').forEach(c=>c.innerHTML='<p class="empty">Não foi possível carregar os itens. Tente novamente em instantes.</p>')})
.finally(()=>{if(ITEMS.length)$$('.catalog').forEach(catalog);showTab(location.hash.slice(1)||'inicio')});
