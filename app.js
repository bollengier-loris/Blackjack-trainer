/* BJ TRAINER ENHC — application (vanilla JS) */
(function () {
  'use strict';
  var A = Strategy.ACTIONS, L = Strategy.LABELS_FR;
  var SUITS = ['\u2660','\u2665','\u2666','\u2663'], RED = { '\u2665':1, '\u2666':1 };
  var RANKS = [2,3,4,5,6,7,8,9,10,'J','Q','K','A'];
  var UPCARDS = [2,3,4,5,6,7,8,9,10,'A'];
  var app = document.getElementById('app');

  var store = {
    get: function (k,d){ try{ var v=localStorage.getItem('bj_'+k); return v==null?d:JSON.parse(v);}catch(e){return d;} },
    set: function (k,v){ try{ localStorage.setItem('bj_'+k, JSON.stringify(v)); }catch(e){} }
  };
  var settings = store.get('settings', {
    das:true,
    trainer:{ hard:true, soft:true, pairs:true, count:20 },
    count:{ decks:6, players:3, speedMs:650, cadence:'each', everyN:3, ask:'rc' },
    game:{ decks:6, players:2 }
  });
  function saveSettings(){ store.set('settings', settings); }

  function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=(Math.random()*(i+1))|0; var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function buildShoe(decks){ var s=[]; for(var d=0;d<decks;d++) for(var x=0;x<SUITS.length;x++) for(var r=0;r<RANKS.length;r++) s.push({rank:RANKS[r],suit:SUITS[x]}); return shuffle(s); }
  function rankText(r){ return r===10?'10':String(r); }
  function ranksOf(c){ return c.map(function(x){return x.rank;}); }
  function rnd(a){ return a[(Math.random()*a.length)|0]; }
  function hv(c){ return Strategy.handValue(ranksOf(c)); }

  function cardHTML(card,o){
    o=o||{};
    if(o.back) return '<div class="card back"></div>';
    var red=RED[card.suit]?' red':'', size=o.mini?' mini':o.cnt?' cnt':'', deal=o.deal?' deal':'';
    var r=rankText(card.rank), s=card.suit;
    return '<div class="card'+red+size+deal+'">'+
      '<div class="c-r">'+r+'<div class="c-s">'+s+'</div></div>'+
      '<div class="c-mid">'+s+'</div>'+
      '<div class="br"><div class="c-r">'+r+'<div class="c-s">'+s+'</div></div></div></div>';
  }
  function handHTML(c,o){ return c.map(function(x){return cardHTML(x,o);}).join(''); }
  function valLabel(c){ var v=hv(c); return v.total+(v.soft?' (soft)':''); }

  function mount(h){ app.innerHTML=h; }
  function $(s){ return app.querySelector(s); }
  function $$(s){ return Array.prototype.slice.call(app.querySelectorAll(s)); }
  function topbar(eyebrow,title,right){
    return '<div class="topbar"><button class="iconbtn" data-back>\u2039</button>'+
      '<div class="title"><span class="eyebrow">'+eyebrow+'</span><h2>'+title+'</h2></div>'+(right||'')+'</div>';
  }
  function wireBack(fn){ var b=$('[data-back]'); if(b) b.onclick=fn; }

  var bannerEl=document.createElement('div'); bannerEl.className='banner'; document.body.appendChild(bannerEl);
  function showBanner(good,head,sub,nextLabel,onNext){
    bannerEl.className='banner '+(good?'good':'bad');
    bannerEl.innerHTML='<div class="head">'+(good?'\u2713':'\u2717')+' '+head+'</div>'+
      (sub?'<div class="sub">'+sub+'</div>':'')+'<button class="next">'+(nextLabel||'Suivant')+'</button>';
    bannerEl.querySelector('.next').onclick=function(){ hideBanner(); onNext&&onNext(); };
    requestAnimationFrame(function(){ bannerEl.classList.add('show'); });
  }
  function hideBanner(){ bannerEl.classList.remove('show'); }

  var askEl=document.createElement('div'); askEl.className='ask'; askEl.style.display='none'; document.body.appendChild(askEl);

  function seg(name,opts,cur){
    return '<div class="seg" data-seg="'+name+'">'+opts.map(function(o){
      return '<button data-v="'+o.v+'"'+(o.v==cur?' class="on"':'')+'>'+o.l+'</button>';
    }).join('')+'</div>';
  }
  function wireSeg(name,cb){
    var box=$('[data-seg="'+name+'"]'); if(!box) return;
    box.onclick=function(e){ var b=e.target.closest('button'); if(!b) return;
      box.querySelectorAll('button').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on'); cb(b.getAttribute('data-v')); };
  }
  function toggleBtns(name,items){
    return '<div class="seg" data-toggles="'+name+'">'+items.map(function(it){
      return '<button data-k="'+it.k+'" data-label="'+it.label+'" class="'+(it.on?'on':'')+'">'+it.label+(it.on?' \u2713':'')+'</button>';
    }).join('')+'</div>';
  }
  function wireToggles(name,cb){
    var box=$('[data-toggles="'+name+'"]'); if(!box) return;
    box.onclick=function(e){ var b=e.target.closest('button'); if(!b) return;
      var on=!b.classList.contains('on'); b.classList.toggle('on',on);
      b.textContent=b.getAttribute('data-label')+(on?' \u2713':''); cb(b.getAttribute('data-k'),on); };
  }
  function stepper(name,val){
    return '<div class="stepper" data-step="'+name+'"><button data-d="-1">\u2212</button><div class="v">'+val+'</div><button data-d="1">+</button></div>';
  }
  function wireStepper(name,val,min,max,cb,fmt){
    var box=$('[data-step="'+name+'"]'); if(!box) return;
    box.onclick=function(e){ var b=e.target.closest('button'); if(!b) return;
      val=Math.max(min,Math.min(max,val+Number(b.getAttribute('data-d'))));
      box.querySelector('.v').textContent=fmt?fmt(val):val; cb(val); };
  }

  function home(){
    hideBanner();
    mount(
      '<div class="brand"><span class="eyebrow">European No Hole Card</span>'+
      '<h1>BLACK<span class="hl">JACK</span><br>Trainer</h1>'+
      '<p>Entra\u00eenement \u00e0 la strat\u00e9gie de base et au comptage Hi-Lo, sans argent r\u00e9el.</p></div>'+
      '<div class="menu">'+
      tile('strategy','\u2660','Strat\u00e9gie de base','Une situation, ta d\u00e9cision, validation imm\u00e9diate.')+
      tile('count','#','Comptage Hi-Lo','Suis le sabot et donne le compte au bon moment.')+
      tile('game','\u2663','Partie compl\u00e8te','Joue un sabot, chaque action est v\u00e9rifi\u00e9e.')+
      tile('chart','\u25a6','Le tableau','La strat\u00e9gie ENHC compl\u00e8te, \u00e0 consulter.')+
      '</div>');
    $$('.tile').forEach(function(t){ t.onclick=function(){ route(t.getAttribute('data-go')); }; });
  }
  function tile(go,ic,title,sub){
    return '<button class="tile" data-go="'+go+'"><div class="ic">'+ic+'</div>'+
      '<div class="tx"><b>'+title+'</b><span>'+sub+'</span></div><div class="arrow">\u203a</div></button>';
  }
  function route(g){
    if(g==='strategy') trainerConfig();
    else if(g==='count') countConfig();
    else if(g==='game') gameConfig();
    else if(g==='chart') chartView();
  }

  /* ===== MODE 1 — STRATÉGIE ===== */
  function trainerConfig(){
    var t=settings.trainer;
    mount(topbar('Mode','Strat\u00e9gie de base')+
      '<div class="scroll"><div class="wrap"><div class="panel-card">'+
      '<div class="field"><label>Cat\u00e9gories \u00e0 r\u00e9viser</label>'+
      toggleBtns('cats',[{k:'hard',label:'Hard',on:t.hard},{k:'soft',label:'Soft',on:t.soft},{k:'pairs',label:'Paires',on:t.pairs}])+
      '<div class="hint">L\u2019abandon (early surrender) est toujours une r\u00e9ponse possible.</div></div>'+
      '<div class="field"><label>Nombre de questions</label>'+
      seg('tcount',[{v:'20',l:'20'},{v:'50',l:'50'},{v:'all',l:'Toutes'}],String(t.count))+'</div>'+
      '<div class="field"><label>Double apr\u00e8s split (DAS)</label>'+
      seg('das',[{v:'on',l:'Activ\u00e9'},{v:'off',l:'D\u00e9sactiv\u00e9'}],settings.das?'on':'off')+
      '<div class="hint">Modifie certaines d\u00e9cisions de split (cases Y/N).</div></div>'+
      '</div><button class="bigbtn" id="start">Commencer</button></div></div>');
    wireBack(home);
    wireToggles('cats',function(k,on){t[k]=on;saveSettings();});
    wireSeg('tcount',function(v){t.count=v==='all'?'all':Number(v);saveSettings();});
    wireSeg('das',function(v){settings.das=v==='on';saveSettings();});
    $('#start').onclick=function(){ if(!t.hard&&!t.soft&&!t.pairs){alert('Choisis au moins une cat\u00e9gorie.');return;} trainerStart(); };
  }
  function buildPool(){
    var t=settings.trainer, pool=[];
    if(t.hard) for(var h=5;h<=19;h++) UPCARDS.forEach(function(u){pool.push({kind:'hard',total:h,up:u});});
    if(t.soft) for(var s=2;s<=9;s++) UPCARDS.forEach(function(u){pool.push({kind:'soft',x:s,up:u});});
    if(t.pairs)['2','3','4','5','6','7','8','9','T','A'].forEach(function(r){UPCARDS.forEach(function(u){pool.push({kind:'pair',r:r,up:u});});});
    shuffle(pool);
    if(t.count!=='all') pool=pool.slice(0,Math.min(t.count,pool.length));
    return pool;
  }
  function tenRank(){ return rnd([10,'J','Q','K']); }
  function upCard(u){ return {rank:u===10?tenRank():u, suit:rnd(SUITS)}; }
  function hardCards(total){
    var c=[]; for(var a=2;a<=10;a++) for(var b=a;b<=10;b++) if(a+b===total&&a!==b) c.push([a,b]);
    var p=rnd(c);
    return [{rank:p[0]===10?tenRank():p[0],suit:rnd(SUITS)},{rank:p[1]===10?tenRank():p[1],suit:rnd(SUITS)}];
  }
  function makeHand(it){
    if(it.kind==='hard') return {cards:hardCards(it.total),up:upCard(it.up)};
    if(it.kind==='soft') return {cards:[{rank:'A',suit:rnd(SUITS)},{rank:it.x,suit:rnd(SUITS)}],up:upCard(it.up)};
    var r=it.r,cards;
    if(r==='A') cards=[{rank:'A',suit:'\u2660'},{rank:'A',suit:'\u2665'}];
    else if(r==='T') cards=[{rank:tenRank(),suit:'\u2660'},{rank:tenRank(),suit:'\u2666'}];
    else cards=[{rank:Number(r),suit:'\u2660'},{rank:Number(r),suit:'\u2663'}];
    return {cards:cards,up:upCard(it.up)};
  }
  var TR;
  function trainerStart(pool){
    TR={pool:pool||buildPool(),i:0,ok:0,by:{hard:[0,0],soft:[0,0],pairs:[0,0]},missed:[],answered:false};
    trainerStep();
  }
  function catOf(it){ return it.kind==='pair'?'pairs':it.kind==='soft'?'soft':'hard'; }
  function trainerStep(){
    if(TR.i>=TR.pool.length) return trainerResults();
    var it=TR.pool[TR.i], deal=makeHand(it); TR.deal=deal; TR.answered=false;
    var pair=Strategy.isPair(ranksOf(deal.cards));
    var acts=[['HIT',L.HIT,''],['STAND',L.STAND,''],['DOUBLE',L.DOUBLE,'brass']];
    if(pair) acts.push(['SPLIT',L.SPLIT,'brass']);
    acts.push(['SURRENDER',L.SURRENDER,'danger']);
    mount(topbar('Strat\u00e9gie','Question '+(TR.i+1)+' / '+TR.pool.length,
      '<div class="hud"><span class="lab">Score</span><span class="val">'+TR.ok+'/'+TR.i+'</span></div>')+
      '<div class="table">'+
      '<div class="zone"><span class="ztag">Croupier</span><div class="hand">'+cardHTML(deal.up,{deal:true})+'</div></div>'+
      '<div class="zone"><span class="ztag">Ta main</span><div class="hand">'+handHTML(deal.cards,{deal:true})+'</div></div>'+
      '<div class="actionbar">'+acts.map(function(a){return '<button class="act '+a[2]+'" data-a="'+a[0]+'">'+a[1]+'</button>';}).join('')+'</div></div>');
    wireBack(function(){ if(confirm('Quitter la session ?')) home(); });
    $$('.act').forEach(function(b){ b.onclick=function(){ trainerAnswer(b.getAttribute('data-a')); }; });
  }
  function trainerAnswer(chosen){
    if(TR.answered) return; TR.answered=true;
    var it=TR.pool[TR.i], deal=TR.deal;
    var correct=Strategy.getCorrectAction(ranksOf(deal.cards),deal.up.rank,{das:settings.das,surrenderAllowed:true});
    var good=chosen===correct, cat=catOf(it);
    TR.by[cat][1]++; if(good){TR.ok++;TR.by[cat][0]++;} else TR.missed.push(it);
    $$('.act').forEach(function(b){
      var a=b.getAttribute('data-a');
      if(a===correct){ b.style.borderColor='var(--good)'; b.style.background='rgba(70,192,106,.18)'; }
      if(a===chosen&&!good){ b.style.borderColor='var(--bad)'; b.style.background='rgba(226,86,78,.18)'; }
      b.disabled=true;
    });
    var ranks=ranksOf(deal.cards);
    var note=Strategy.note(ranks,deal.up.rank,{das:settings.das,surrenderAllowed:true});
    var actLine=L[correct]+(note?' '+note:'');
    var sub=(good?'':'Bonne r\u00e9ponse : ')+'<b>'+actLine+'</b> \u00b7 '+Strategy.explain(ranks,deal.up.rank);
    showBanner(good,good?'Correct':'Faux',sub,(TR.i+1>=TR.pool.length)?'Voir le r\u00e9sultat':'Suivant',function(){ TR.i++; trainerStep(); });
  }
  function trainerResults(){
    hideBanner();
    var pct=TR.pool.length?Math.round(100*TR.ok/TR.pool.length):0;
    function bar(lab,arr){ if(!arr[1])return''; var p=Math.round(100*arr[0]/arr[1]);
      return '<div class="barrow"><div class="bl">'+lab+'</div><div class="bt"><i style="width:'+p+'%"></i></div><div class="bn">'+arr[0]+'/'+arr[1]+'</div></div>'; }
    mount(topbar('Strat\u00e9gie','R\u00e9sultat')+
      '<div class="scroll"><div class="wrap">'+
      '<div class="score-hero"><div class="big">'+TR.ok+'<span style="font-size:24px;color:var(--muted)">/'+TR.pool.length+'</span></div><div class="pct">'+pct+'% de bonnes r\u00e9ponses</div></div>'+
      '<div class="panel-card bars">'+bar('Hard',TR.by.hard)+bar('Soft',TR.by.soft)+bar('Paires',TR.by.pairs)+'</div>'+
      (TR.missed.length?'<button class="bigbtn ghost" id="review">Revoir mes '+TR.missed.length+' erreurs</button><div style="height:10px"></div>':'')+
      '<button class="bigbtn" id="again">Nouvelle session</button><div style="height:10px"></div>'+
      '<button class="bigbtn ghost" id="menu">Menu</button></div></div>');
    wireBack(home);
    if($('#review')) $('#review').onclick=function(){ var m=TR.missed.slice(); shuffle(m); trainerStart(m); };
    $('#again').onclick=trainerConfig; $('#menu').onclick=home;
  }

  /* ===== MODE 2 — COMPTAGE HI-LO ===== */
  function countConfig(){
    var c=settings.count;
    mount(topbar('Mode','Comptage Hi-Lo')+
      '<div class="scroll"><div class="wrap"><div class="panel-card">'+
      '<div class="field"><label>Nombre de jeux</label>'+seg('decks',[2,4,6,8].map(function(n){return{v:n,l:n};}),c.decks)+'</div>'+
      '<div class="field"><label>Joueurs \u00e0 table</label>'+stepper('players',c.players)+'</div>'+
      '<div class="field"><label>Vitesse de distribution</label><input class="range" id="speed" type="range" min="250" max="1500" step="50" value="'+c.speedMs+'"><div class="hint"><span id="speedlab"></span></div></div>'+
      '<div class="field"><label>Demander le compte\u2026</label>'+
      seg('cadence',[{v:'each',l:'Chaque main'},{v:'everyN',l:'Toutes les N'},{v:'shoe',l:'Fin du sabot'}],c.cadence)+
      '<div id="everynbox" style="margin-top:10px;'+(c.cadence==='everyN'?'':'display:none')+'">'+stepper('everyn',c.everyN)+'</div></div>'+
      '<div class="field"><label>Compte demand\u00e9</label>'+
      seg('ask',[{v:'rc',l:'Running'},{v:'tc',l:'True'},{v:'both',l:'Les deux'}],c.ask)+
      '<div class="hint">Running = compte brut. True = running \u00f7 jeux restants.</div></div>'+
      '</div><button class="bigbtn" id="start">Lancer le sabot</button></div></div>');
    wireBack(home);
    function sl(){ $('#speedlab').textContent=(c.speedMs/1000).toFixed(2).replace('.',',')+' s par carte'; }
    sl();
    wireSeg('decks',function(v){c.decks=Number(v);saveSettings();});
    wireStepper('players',c.players,1,6,function(v){c.players=v;saveSettings();});
    $('#speed').oninput=function(){ c.speedMs=Number(this.value); sl(); saveSettings(); };
    wireSeg('cadence',function(v){ c.cadence=v; $('#everynbox').style.display=v==='everyN'?'':'none'; saveSettings(); });
    wireStepper('everyn',c.everyN,2,10,function(v){c.everyN=v;saveSettings();});
    wireSeg('ask',function(v){c.ask=v;saveSettings();});
    $('#start').onclick=countStart;
  }
  function simulateCount(shoe,np){
    var idx=0,rc=0,events=[],cut=Math.floor(shoe.length*0.75),round=0;
    function draw(){ var c=shoe[idx++]; rc+=Strategy.hiLo(c.rank); return c; }
    function push(seat,card){ events.push({t:'deal',seat:seat,card:card,round:round}); }
    function pv(h){ return Strategy.handValue(h.map(function(c){return c.rank;})); }
    while(idx<cut && shoe.length-idx>(np+1)*6){
      round++; var hands={D:[]}; for(var p=0;p<np;p++) hands[p]=[];
      for(p=0;p<np;p++){ var c=draw(); hands[p].push(c); push(p,c); }
      c=draw(); hands.D.push(c); push('D',c);
      for(p=0;p<np;p++){ c=draw(); hands[p].push(c); push(p,c); }
      for(p=0;p<np;p++){ var g=0; while(g++<9){ var v=pv(hands[p]); if((v.soft?v.total>=18:v.total>=17)||shoe.length-idx<2) break; c=draw(); hands[p].push(c); push(p,c); } }
      c=draw(); hands.D.push(c); push('D',c);
      var s=0; while(s++<9){ v=pv(hands.D); if(v.total>=17||shoe.length-idx<1) break; c=draw(); hands.D.push(c); push('D',c); }
      events.push({t:'round',round:round,rc:rc,cardsLeft:shoe.length-idx});
    }
    return {events:events,finalRc:rc,rounds:round,lastLeft:shoe.length-idx};
  }
  var CT;
  function countStart(){
    var c=settings.count, shoe=buildShoe(c.decks), sim=simulateCount(shoe,c.players);
    CT={sim:sim,ev:0,paused:false,timer:null,curRound:0,players:c.players,shown:0,total:shoe.length,checks:{rc:[0,0],tc:[0,0]}};
    countView(); countPlay();
  }
  function countView(){
    var seats=''; for(var p=0;p<CT.players;p++) seats+='<div class="seat" id="seat-'+p+'"><span class="stag">J'+(p+1)+'</span><div class="minihand"></div></div>';
    mount(topbar('Comptage','Manche <span id="rno">0</span>','<button class="iconbtn" id="pause">\u2759\u2759</button>')+
      '<div style="height:4px;background:rgba(255,255,255,.06)"><div id="tray" style="height:100%;width:0;background:var(--brass)"></div></div>'+
      '<div class="table">'+
      '<div id="cardszone" style="flex:1;display:flex;flex-direction:column">'+
      '<div class="zone"><span class="ztag">Croupier</span><div class="minihand" id="seat-D"></div></div>'+
      '<div style="flex:1"></div>'+
      '<div class="seats" id="seats">'+seats+'</div></div>'+
      '<div class="actionbar" style="grid-template-columns:1fr 1fr"><button class="act" id="stop">Arr\u00eater</button><button class="act brass" id="resume" style="display:none">Reprendre</button></div></div>');
    wireBack(function(){ if(confirm('Quitter le sabot ?')){ stopT(); home(); } });
    $('#pause').onclick=togglePause; $('#resume').onclick=togglePause;
    $('#stop').onclick=function(){ stopT(); countResults(); };
  }
  function stopT(){ if(CT&&CT.timer){ clearTimeout(CT.timer); CT.timer=null; } }
  function togglePause(){
    CT.paused=!CT.paused;
    var pb=$('#pause'), rb=$('#resume'); if(pb)pb.style.display=CT.paused?'none':''; if(rb)rb.style.display=CT.paused?'':'none';
    if(!CT.paused) countPlay();
  }
  function countPlay(){
    if(CT.paused) return;
    var ev=CT.sim.events;
    if(CT.ev>=ev.length){ return countAsk(true,CT.sim.finalRc,CT.sim.lastLeft); }
    var e=ev[CT.ev++];
    if(e.t==='deal'){
      if(e.round!==CT.curRound){ CT.curRound=e.round; var rn=$('#rno'); if(rn)rn.textContent=e.round;
        for(var p=0;p<CT.players;p++){ var sh=$('#seat-'+p+' .minihand')||document.querySelector('#seat-'+p+' .minihand'); if(sh)sh.innerHTML=''; }
        var dh=document.querySelector('#seat-D'); if(dh)dh.innerHTML=''; }
      var box=document.querySelector('#seat-'+e.seat+(e.seat==='D'?'':' .minihand'));
      if(e.seat==='D') box=document.querySelector('#seat-D');
      if(box) box.insertAdjacentHTML('beforeend',cardHTML(e.card,{cnt:true,deal:true}));
      CT.shown++; var tr=document.querySelector('#tray'); if(tr) tr.style.width=(100*CT.shown/CT.total)+'%';
      CT.timer=setTimeout(countPlay,settings.count.speedMs);
    } else { // round end
      var rn2=$('#rno'); if(rn2)rn2.textContent=e.round;
      var c=settings.count, ask=false;
      if(c.cadence==='each') ask=true;
      else if(c.cadence==='everyN') ask=(e.round%c.everyN===0);
      if(ask) countAsk(false,e.rc,e.cardsLeft);
      else CT.timer=setTimeout(countPlay,Math.max(250,settings.count.speedMs));
    }
  }
  function setCardsHidden(h){ var z=document.querySelector('#cardszone'); if(z) z.style.visibility=h?'hidden':'visible'; }
  function countInput(label,id,val){
    return '<div class="countin"><label>'+label+'</label>'+
      '<button class="cstep" data-for="'+id+'" data-d="-1">\u2212</button>'+
      '<input class="cnum" id="'+id+'" type="number" inputmode="numeric" value="'+val+'">'+
      '<button class="cstep" data-for="'+id+'" data-d="1">+</button></div>';
  }
  function countAsk(isFinal,rc,cardsLeft){
    stopT(); setCardsHidden(true);
    var c=settings.count, wantRc=(c.ask==='rc'||c.ask==='both'), wantTc=(c.ask==='tc'||c.ask==='both');
    var decksRem=Math.max(0.5,Math.round((cardsLeft/52)*2)/2), tcReal=Math.round(rc/decksRem);
    var startRc=(CT.lastRc!=null?CT.lastRc:0), startTc=(CT.lastTc!=null?CT.lastTc:0);
    askEl.style.display='flex';
    askEl.innerHTML='<h3>'+(isFinal?'Fin du sabot':'Quel est le compte ?')+'</h3>'+
      '<p>'+(isFinal?'Donne le compte final.':'Cartes cach\u00e9es \u2014 \u00e0 toi.')+'</p>'+
      (wantRc?countInput('Running','qrc',startRc):'')+
      (wantTc?countInput('True','qtc',startTc):'')+
      '<button class="bigbtn" id="valid" style="margin-top:8px">Valider</button>';
    askEl.querySelectorAll('.cstep').forEach(function(b){
      b.onclick=function(){ var inp=askEl.querySelector('#'+b.getAttribute('data-for')); var v=parseInt(inp.value,10); if(isNaN(v))v=0; inp.value=v+Number(b.getAttribute('data-d')); };
    });
    function rd(id,def){ var inp=askEl.querySelector('#'+id); if(!inp)return def; var v=parseInt(inp.value,10); return isNaN(v)?def:v; }
    askEl.querySelector('#valid').onclick=function(){
      var qrc=rd('qrc',startRc), qtc=rd('qtc',startTc), rcOk=true,tcOk=true,lines=[];
      if(wantRc){ rcOk=(qrc===rc); CT.checks.rc[1]++; if(rcOk)CT.checks.rc[0]++; CT.lastRc=rc; lines.push('Running r\u00e9el : '+(rc>=0?'+':'')+rc); }
      if(wantTc){ tcOk=Math.abs(qtc-tcReal)<=1; CT.checks.tc[1]++; if(tcOk)CT.checks.tc[0]++; CT.lastTc=tcReal; lines.push('True r\u00e9el : '+(tcReal>=0?'+':'')+tcReal+' (RC '+(rc>=0?'+':'')+rc+' \u00f7 ~'+decksRem.toFixed(1).replace('.',',')+' jeux)'); }
      askEl.style.display='none'; askEl.innerHTML='';
      var good=rcOk&&tcOk;
      showBanner(good,good?'Bon compte':'Compte \u00e0 revoir',lines.join(' \u00b7 '),isFinal?'Voir le bilan':'Continuer',
        function(){ setCardsHidden(false); if(isFinal) countResults(); else countPlay(); });
    };
  }
  function countResults(){
    stopT(); askEl.style.display='none'; askEl.innerHTML=''; hideBanner();
    function row(lab,arr){ if(!arr[1])return''; var p=Math.round(100*arr[0]/arr[1]);
      return '<div class="barrow"><div class="bl">'+lab+'</div><div class="bt"><i style="width:'+p+'%"></i></div><div class="bn">'+arr[0]+'/'+arr[1]+'</div></div>'; }
    var tot=CT.checks.rc[0]+CT.checks.tc[0], den=CT.checks.rc[1]+CT.checks.tc[1];
    mount(topbar('Comptage','Bilan')+
      '<div class="scroll"><div class="wrap">'+
      '<div class="score-hero"><div class="big">'+tot+'<span style="font-size:24px;color:var(--muted)">/'+den+'</span></div><div class="pct">comptes corrects</div></div>'+
      '<div class="panel-card bars">'+row('Running',CT.checks.rc)+row('True',CT.checks.tc)+'</div>'+
      '<div class="note">Compte final du sabot : '+(CT.sim.finalRc>=0?'+':'')+CT.sim.finalRc+'.</div>'+
      '<div style="height:14px"></div><button class="bigbtn" id="again">Nouveau sabot</button><div style="height:10px"></div><button class="bigbtn ghost" id="menu">Menu</button></div></div>');
    wireBack(home);
    $('#again').onclick=countConfig; $('#menu').onclick=home;
  }

  /* ===== MODE 3 — PARTIE COMPLÈTE (décisions) ===== */
  function gameConfig(){
    var g=settings.game;
    mount(topbar('Mode','Partie compl\u00e8te')+
      '<div class="scroll"><div class="wrap"><div class="panel-card">'+
      '<div class="field"><label>Nombre de jeux dans le sabot</label>'+seg('gdecks',[2,4,6,8].map(function(n){return{v:n,l:n};}),g.decks)+'</div>'+
      '<div class="field"><label>Autres joueurs \u00e0 table</label>'+stepper('gplayers',g.players)+'<div class="hint">Ils jouent de fa\u00e7on approximative (non not\u00e9s). Leurs cartes comptent dans le sabot.</div></div>'+
      '<div class="field"><label>Double apr\u00e8s split (DAS)</label>'+seg('gdas',[{v:'on',l:'Activ\u00e9'},{v:'off',l:'D\u00e9sactiv\u00e9'}],settings.das?'on':'off')+'</div>'+
      '</div><div class="note">Croupier : tire jusqu\u2019\u00e0 17, reste sur 17 (S17). R\u00e8gles ENHC, sans argent.</div>'+
      '<div style="height:14px"></div><button class="bigbtn" id="start">Distribuer</button></div></div>');
    wireBack(home);
    wireSeg('gdecks',function(v){g.decks=Number(v);saveSettings();});
    wireStepper('gplayers',g.players,0,5,function(v){g.players=v;saveSettings();});
    wireSeg('gdas',function(v){settings.das=v==='on';saveSettings();});
    $('#start').onclick=gameStart;
  }
  var GM;
  function gameStart(){
    var g=settings.game, shoe=buildShoe(g.decks);
    GM={shoe:shoe,idx:0,rc:0,cut:Math.floor(shoe.length*0.75),np:g.players,rounds:0,stats:{dec:[0,0],ins:[0,0]},show:false};
    gameNewRound();
  }
  function drawG(){ var c=GM.shoe[GM.idx++]; GM.rc+=Strategy.hiLo(c.rank); return c; }
  function tcNow(){ var left=GM.shoe.length-GM.idx, dr=Math.max(0.5,Math.round((left/52)*2)/2); return {tc:Math.round(GM.rc/dr),dr:dr}; }
  function gameNewRound(){
    if(GM.idx>=GM.cut){ GM.shoe=buildShoe(settings.game.decks); GM.idx=0; GM.rc=0; GM.cut=Math.floor(GM.shoe.length*0.75); GM.newShoe=true; }
    GM.rounds++;
    GM.dealer={cards:[]}; GM.others=[]; for(var p=0;p<GM.np;p++) GM.others.push({cards:[],res:null});
    GM.hands=[{cards:[],done:false,doubled:false,surr:false,aces:false,split:false,res:null}];
    GM.active=0;
    // distribution : 1 carte à chacun + croupier (visible), puis 2e à chacun (croupier : pas de carte cachée en ENHC)
    for(p=0;p<GM.np;p++) GM.others[p].cards.push(drawG());
    GM.hands[0].cards.push(drawG());
    GM.dealer.cards.push(drawG());
    for(p=0;p<GM.np;p++) GM.others[p].cards.push(drawG());
    GM.hands[0].cards.push(drawG());
    GM.dealerUp=GM.dealer.cards[0];
    if(GM.dealerUp.rank==='A') gameInsurance(); else gameRenderTurn();
  }
  function gameInsurance(){
    askEl.style.display='flex';
    askEl.innerHTML='<h3>Assurance ?</h3><p>Le croupier montre un As.</p>'+
      '<div class="row2"><button class="bigbtn ghost" id="ins-y">Oui</button><button class="bigbtn" id="ins-n">Non</button></div>';
    function ans(took){
      GM.stats.ins[1]++; if(!took) GM.stats.ins[0]++;
      askEl.style.display='none';
      showBanner(!took,!took?'Bien jou\u00e9':'\u00c0 \u00e9viter','Ne jamais prendre l\u2019assurance ni l\u2019argent \u00e9gal.','Continuer',gameRenderTurn);
    }
    askEl.querySelector('#ins-y').onclick=function(){ans(true);};
    askEl.querySelector('#ins-n').onclick=function(){ans(false);};
  }
  function seatMini(label,cards,res,cls){
    return '<div class="seat '+(cls||'')+'"><span class="stag">'+label+'</span><div class="minihand">'+handHTML(cards,{mini:true})+'</div>'+
      (res?'<span class="res '+res.k+'">'+res.t+'</span>':'')+'</div>';
  }
  function countBar(){
    var t=tcNow();
    return '<div id="countbar" style="text-align:center;font-family:var(--mono);font-size:13px;color:var(--brass-soft);padding:6px;'+(GM.show?'':'display:none')+'">'+
      'RC '+(GM.rc>=0?'+':'')+GM.rc+' \u00b7 TC '+(t.tc>=0?'+':'')+t.tc+' \u00b7 ~'+t.dr.toFixed(1).replace('.',',')+' jeux</div>';
  }
  function gameRenderTurn(){
    hideBanner();
    var h=GM.hands[GM.active], pair=Strategy.isPair(ranksOf(h.cards)), two=h.cards.length===2;
    var single=GM.hands.length===1, canSurr=two&&single&&!h.split;
    var acts=[['HIT',L.HIT,'',false],['STAND',L.STAND,'',false],['DOUBLE',L.DOUBLE,'brass',!two]];
    if(pair&&GM.hands.length<4) acts.push(['SPLIT',L.SPLIT,'brass',false]);
    if(canSurr) acts.push(['SURRENDER',L.SURRENDER,'danger',false]);
    var others=''; for(var p=0;p<GM.np;p++) others+=seatMini('J'+(p+1),GM.others[p].cards,null,'');
    var splits=''; if(GM.hands.length>1){ splits='<div class="seats">'+GM.hands.map(function(hd,i){
      return seatMini('Main '+(i+1),hd.cards,hd.res,i===GM.active?'active':''); }).join('')+'</div>'; }
    mount(topbar('Partie','Manche '+GM.rounds,'<button class="iconbtn" id="cnt">#</button>')+
      countBar()+
      (GM.newShoe?'<div class="note center">Nouveau sabot</div>':'')+
      '<div class="table">'+
      '<div class="zone"><span class="ztag">Croupier</span><div class="hand">'+cardHTML(GM.dealerUp)+'<div class="card back"></div></div></div>'+
      (GM.np?'<div class="seats">'+others+'</div>':'')+
      '<div class="zone"><span class="ztag">'+(GM.hands.length>1?'Main '+(GM.active+1)+' \u00b7 ':'Ta main \u00b7 ')+valLabel(h.cards)+'</span><div class="hand">'+handHTML(h.cards,{deal:true})+'</div></div>'+
      splits+
      '<div class="actionbar">'+acts.map(function(a){return '<button class="act '+a[2]+'" data-a="'+a[0]+'"'+(a[3]?' disabled':'')+'>'+a[1]+'</button>';}).join('')+'</div></div>');
    GM.newShoe=false;
    wireBack(function(){ if(confirm('Quitter la partie ?')) gameResults(); });
    $('#cnt').onclick=function(){ GM.show=!GM.show; var cb=document.querySelector('#countbar'); if(cb)cb.style.display=GM.show?'':'none'; };
    $$('.act').forEach(function(b){ b.onclick=function(){ gameAct(b.getAttribute('data-a'),b); }; });
  }
  function gameAct(action,btn){
    var h=GM.hands[GM.active], two=h.cards.length===2, single=GM.hands.length===1;
    var canSurr=two&&single&&!h.split;
    var correct=Strategy.getCorrectAction(ranksOf(h.cards),GM.dealerUp.rank,{das:settings.das,surrenderAllowed:canSurr,canDouble:two,canSurrender:canSurr});
    var good=action===correct; GM.stats.dec[1]++; if(good)GM.stats.dec[0]++;
    if(btn){ btn.style.borderColor=good?'var(--good)':'var(--bad)'; btn.style.background=good?'rgba(70,192,106,.18)':'rgba(226,86,78,.18)'; }
    if(!good){ var gnote=Strategy.note(ranksOf(h.cards),GM.dealerUp.rank,{das:settings.das,surrenderAllowed:canSurr,canDouble:two,canSurrender:canSurr});
      var nd=document.createElement('div'); nd.className='note center'; nd.style.color='var(--bad)';
      nd.textContent='Le livre dit : '+L[correct]+(gnote?' '+gnote:''); var ab=$('.actionbar'); if(ab)ab.parentNode.insertBefore(nd,ab); }
    var proceed=function(){
      if(action==='HIT'){ h.cards.push(drawG()); if(hv(h.cards).total>=21){ h.done=true; advance(); } else gameRenderTurn(); }
      else if(action==='STAND'){ h.done=true; advance(); }
      else if(action==='DOUBLE'){ h.cards.push(drawG()); h.doubled=true; h.done=true; advance(); }
      else if(action==='SURRENDER'){ h.surr=true; h.done=true; advance(); }
      else if(action==='SPLIT'){ doSplit(); }
    };
    if(good && action!=='HIT'){ setTimeout(proceed,360); }
    else if(good && action==='HIT'){ setTimeout(proceed,260); }
    else { setTimeout(proceed,820); }
  }
  function doSplit(){
    var h=GM.hands[GM.active], aces=h.cards[0].rank==='A';
    var a={cards:[h.cards[0],drawG()],done:aces,doubled:false,surr:false,aces:aces,split:true,res:null};
    var b={cards:[h.cards[1],drawG()],done:aces,doubled:false,surr:false,aces:aces,split:true,res:null};
    GM.hands.splice(GM.active,1,a,b);
    if(aces) advance(); else gameRenderTurn();
  }
  function advance(){
    for(var i=GM.active;i<GM.hands.length;i++){ if(!GM.hands[i].done){ GM.active=i; return gameRenderTurn(); } }
    othersPlay(); gameDealer();
  }
  function othersPlay(){
    for(var p=0;p<GM.np;p++){ var o=GM.others[p], g=0;
      while(g++<8){ var v=Strategy.handValue(ranksOf(o.cards)); if(v.total>=17) break; if(v.total>=15&&Math.random()<0.25) break; if(GM.shoe.length-GM.idx<2) break; o.cards.push(drawG()); }
    }
  }
  function gameDealer(){
    GM.dealer.cards.push(drawG()); // carte cachée révélée (ENHC : tirée à la fin)
    var g=0; while(g++<10){ var v=Strategy.handValue(ranksOf(GM.dealer.cards)); if(v.total>=17||GM.shoe.length-GM.idx<1) break; GM.dealer.cards.push(drawG()); }
    gameRoundOver();
  }
  function settle(h){
    var dv=hv(GM.dealer.cards), dval=dv.total, dbust=dval>21;
    var dBJ=GM.dealer.cards.length===2&&dval===21;
    var pv=hv(h.cards), pt=pv.total, yBJ=!h.split&&h.cards.length===2&&pt===21;
    if(h.surr) return {k:'lose',t:'Abandon'};
    if(yBJ&&!dBJ) return {k:'win',t:'BJ'};
    if(dBJ&&!yBJ) return {k:'lose',t:'BJ adv.'};
    if(yBJ&&dBJ) return {k:'push',t:'\u00c9gal'};
    if(pt>21) return {k:'lose',t:'Bust'};
    if(dbust) return {k:'win',t:'Gagn\u00e9'};
    if(pt>dval) return {k:'win',t:'Gagn\u00e9'};
    if(pt<dval) return {k:'lose',t:'Perdu'};
    return {k:'push',t:'\u00c9gal'};
  }
  function gameRoundOver(){
    GM.hands.forEach(function(h){ h.res=settle(h); });
    GM.others.forEach(function(o){ o.res=settle({cards:o.cards,split:false,surr:false}); });
    var yours='<div class="seats">'+GM.hands.map(function(h,i){ return seatMini(GM.hands.length>1?'Main '+(i+1):'Toi',h.cards,h.res,'you'); }).join('')+'</div>';
    var others=''; for(var p=0;p<GM.np;p++) others+=seatMini('J'+(p+1),GM.others[p].cards,GM.others[p].res,'');
    mount(topbar('Partie','Manche '+GM.rounds,'<button class="iconbtn" id="cnt">#</button>')+countBar()+
      '<div class="table">'+
      '<div class="zone"><span class="ztag">Croupier \u00b7 '+valLabel(GM.dealer.cards)+'</span><div class="hand">'+handHTML(GM.dealer.cards)+'</div></div>'+
      (GM.np?'<div class="seats">'+others+'</div>':'')+yours+
      '<div class="actionbar" style="grid-template-columns:1fr 1fr"><button class="act" id="quit">Arr\u00eater</button><button class="act brass" id="next">Manche suivante</button></div></div>');
    wireBack(function(){ if(confirm('Quitter la partie ?')) gameResults(); });
    $('#cnt').onclick=function(){ GM.show=!GM.show; var cb=document.querySelector('#countbar'); if(cb)cb.style.display=GM.show?'':'none'; };
    $('#next').onclick=gameNewRound; $('#quit').onclick=gameResults;
  }
  function gameResults(){
    hideBanner();
    function row(lab,arr){ var p=arr[1]?Math.round(100*arr[0]/arr[1]):0;
      return '<div class="barrow"><div class="bl">'+lab+'</div><div class="bt"><i style="width:'+p+'%"></i></div><div class="bn">'+arr[0]+'/'+arr[1]+'</div></div>'; }
    var d=GM.stats.dec, pct=d[1]?Math.round(100*d[0]/d[1]):0;
    mount(topbar('Partie','Bilan')+
      '<div class="scroll"><div class="wrap">'+
      '<div class="score-hero"><div class="big">'+pct+'<span style="font-size:24px;color:var(--muted)">%</span></div><div class="pct">d\u00e9cisions conformes au livre</div></div>'+
      '<div class="panel-card bars">'+row('D\u00e9cisions',d)+(GM.stats.ins[1]?row('Assurance',GM.stats.ins):'')+'</div>'+
      '<div class="note">'+GM.rounds+' manche(s) jou\u00e9e(s).</div>'+
      '<div style="height:14px"></div><button class="bigbtn" id="again">Rejouer</button><div style="height:10px"></div><button class="bigbtn ghost" id="menu">Menu</button></div></div>');
    wireBack(home);
    $('#again').onclick=gameConfig; $('#menu').onclick=home;
  }

  /* ===== TABLEAU (régénéré depuis le moteur) ===== */
  function chartView(){
    var T=Strategy._tables;
    function head(){ return '<tr><th></th>'+UPCARDS.map(function(u){return '<th>'+(u==='A'?'A':u)+'</th>';}).join('')+'</tr>'; }
    function cls(v){ return {H:'cH',S:'cS',D:'cD',Ds:'cDs',Y:'cY',N:'cN',SUR:'cSUR','Y/N':'cYN'}[v]||''; }
    function rowCells(lab,arr,disp){ return '<tr><td class="lab">'+lab+'</td>'+arr.map(function(v){ var d=disp?disp(v):v; return '<td class="'+cls(d)+'">'+(d==='N'?'\u00b7':d)+'</td>'; }).join('')+'</tr>'; }
    var hard=''; [20,19,18,17,16,15,14,13,12,11,10,9,8].forEach(function(t){ hard+=rowCells(t,T.HARD[t]||['S','S','S','S','S','S','S','S','S','S']); });
    var soft=''; [['A,9',20],['A,8',19],['A,7',18],['A,6',17],['A,5',16],['A,4',15],['A,3',14],['A,2',13]].forEach(function(p){ soft+=rowCells(p[0],T.SOFT[p[1]]); });
    var pairs=''; [['A,A','A'],['T,T','T'],['9,9','9'],['8,8','8'],['7,7','7'],['6,6','6'],['5,5','5'],['4,4','4'],['3,3','3'],['2,2','2']].forEach(function(p){
      pairs+=rowCells(p[0],T.PAIRS[p[1]],function(v){ return v==='D'?'Y/N':v; }); });
    function surrRow(lab,set){ return '<tr><td class="lab">'+lab+'</td>'+UPCARDS.map(function(u){ var on=set.indexOf(u)!==-1; return '<td class="'+(on?'cSUR':'cN')+'">'+(on?'SUR':'')+'</td>'; }).join('')+'</tr>'; }
    var surr=''; [[17,T.SURR_TOTALS[17]],[16,T.SURR_TOTALS[16]],[15,T.SURR_TOTALS[15]],[14,T.SURR_TOTALS[14]],[13,T.SURR_TOTALS[13]],[12,T.SURR_TOTALS[12]],['8,8',[10,'A']],[7,T.SURR_TOTALS[7]],[6,T.SURR_TOTALS[6]],[5,T.SURR_TOTALS[5]]].forEach(function(p){ surr+=surrRow(p[0],p[1]); });
    function tbl(title,body){ return '<h3 style="margin:18px 0 8px;font-size:15px">'+title+'</h3><div style="overflow-x:auto"><table class="chart">'+head()+body+'</table></div>'; }
    mount(topbar('R\u00e9f\u00e9rence','Tableau ENHC')+
      '<div class="scroll"><div class="wrap">'+
      '<div class="note">Colonnes = carte visible du croupier. G\u00e9n\u00e9r\u00e9 depuis le moteur de l\u2019app.</div>'+
      tbl('Totaux hard',hard)+tbl('Totaux soft',soft)+tbl('Paires (DAS activ\u00e9)',pairs)+tbl('Abandon \u2014 early surrender',surr)+
      '<div class="legend">'+
      '<span><i class="cH" style="background:#2a4a8f"></i>Hit</span>'+
      '<span><i class="cS" style="background:#6a3a8f"></i>Stand</span>'+
      '<span><i class="cD" style="background:#2f7d4a"></i>Double / Ds</span>'+
      '<span><i class="cY" style="background:#2f7d4a"></i>Split (Y)</span>'+
      '<span><i class="cYN" style="background:#7d6a2f"></i>Y/N (DAS)</span>'+
      '<span><i class="cSUR" style="background:#b58620"></i>Surrender</span></div>'+
      '<div class="note">Assurance / argent \u00e9gal : ne jamais prendre.</div>'+
      '</div></div>');
    wireBack(home);
  }

  home();
})();
