/* Reserve panel for AI, Built On Paper.
   Load it on any page (with /assets/reserve.css) and every "Reserve" button opens the panel right there:
   - any element with data-open="paper-day" | "paper-day-home" | "build-cohort" | "self-paced"
   - any link to /build.html#reserve, #seat, #reserve-home, #reserve-build or #reserve-self
   - arriving on a page with one of those hashes
   SEATS below is the one place seat counts and dates live. The course page reads it too. */
(function(){
  "use strict";
  if(window.AneilReserve) return;

  /* Update "taken" as seats sell. Set "date" (for example "2026-11-14") when a date is booked:
     the cards and this panel switch from "date coming soon" to the date and a countdown of days to go. */
  var SEATS = {
    "paper-day":    { total: 12, taken: 0, date: null },
    "build-cohort": { total: 8,  taken: 0, date: null }
  };
  var PRICES = { "paper-day": 99, "paper-day-home": 0, "build-cohort": 897, "self-paced": 397 };
  var NAMES = { "paper-day": "Paper Day", "paper-day-home": "Paper Day at home", "build-cohort": "Build cohort", "self-paced": "Self-paced" };
  var CAP = { "paper-day": 6, "build-cohort": 4 };   /* most seats one person can hold at once */
  var ORDER = ["paper-day","build-cohort","self-paced"];
  var HASH = { "#reserve":"paper-day", "#seat":"paper-day", "#reserve-home":"paper-day-home", "#reserve-build":"build-cohort", "#reserve-self":"self-paced" };
  var COURSE_PATHS = { "/build.html":1, "/build":1, "/build/":1 };

  function left(k){ var s=SEATS[k]; return s ? Math.max(0, s.total - s.taken) : 0; }
  function money(n){ return "$"+n.toLocaleString("en-US"); }
  var DAY=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function asDate(iso){ var p=String(iso).split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
  function fmt(iso){ var d=asDate(iso); return DAY[d.getDay()]+" "+d.getDate()+" "+MON[d.getMonth()]; }
  function daysTo(iso){ var t=new Date(); t.setHours(0,0,0,0); return Math.round((asDate(iso)-t)/86400000); }
  function untilText(iso){ var n=daysTo(iso); return n>1 ? n+" days to go" : n===1 ? "Tomorrow" : n===0 ? "Today" : ""; }
  function seatsText(k){
    var n=left(k), tot=SEATS[k].total;
    if(n===0) return "Full. The list gets first pick of the next room.";
    if(n<=3) return "Only "+n+" of "+tot+" seats left.";
    return n+" of "+tot+" seats left."+(k==="paper-day" ? " The list gets first pick." : " Founding price.");
  }
  function meter(k, mine){
    var s=SEATS[k], h="", m=Math.min(mine||0, left(k));
    for(var i=0;i<s.total;i++){ h+='<i'+(i<s.taken ? '' : i<s.taken+m ? ' class="mine"' : ' class="open"')+'></i>'; }
    return h;
  }

  var CHECK='<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function pick(path, name, price, small, sub, body){
    return '<div class="rsv-pick" data-path="'+path+'">'+
      '<button type="button" class="rsv-ph" role="checkbox" aria-checked="false">'+
        '<span class="rsv-chk" aria-hidden="true">'+CHECK+'</span>'+
        '<span class="rsv-nm">'+name+'</span>'+
        '<span class="rsv-pr"'+(path==="paper-day" ? ' id="rsv-paper-price"' : '')+'>'+price+'<small>'+small+'</small></span>'+
        '<span class="rsv-sb">'+sub+'</span>'+
      '</button><div class="rsv-pb">'+body+'</div></div>';
  }
  var HTML =
    '<div class="rsv-scrim" id="rsv-scrim"></div>'+
    '<aside class="rsv-drawer" id="rsv-drawer" role="dialog" aria-modal="true" aria-labelledby="rsv-title" aria-hidden="true">'+
      '<div class="rsv-grab" aria-hidden="true"></div>'+
      '<div class="rsv-dh"><p class="rsv-eyebrow">No payment today</p>'+
        '<button class="rsv-x" type="button" data-rsv-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 3l12 12M15 3L3 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>'+
      '<div class="rsv-db">'+
        '<h2 class="rsv-title" id="rsv-title">Reserve your seat</h2>'+
        '<p class="rsv-dlab" id="rsv-pick-lab">Pick one or more</p>'+
        '<div class="rsv-picks" role="group" aria-labelledby="rsv-pick-lab">'+
          pick("paper-day","Paper Day","$99","founding","Steps 1 to 5 &middot; one four-hour session",
            '<div class="rsv-count" data-count="paper-day" aria-live="polite"></div>'+
            '<p class="rsv-pline"><span id="rsv-paper-where">In person, DFW area</span> &middot; <button type="button" class="rsv-linkbtn" id="rsv-mode-switch">Do it at home instead</button></p>')+
          pick("build-cohort","Build cohort","$897","or 2 &times; $459","Steps 6 to 9 &middot; live online",
            '<div class="rsv-count" data-count="build-cohort" aria-live="polite"></div>'+
            '<p class="rsv-pline" id="rsv-build-when">Live online, Saturday mornings</p>'+
            '<p class="rsv-pline" id="rsv-needs">Builds from your Paper Day paper. <button type="button" class="rsv-linkbtn" id="rsv-addpaper">Add Paper Day</button></p>')+
          pick("self-paced","Self-paced","$397","opens soon","All ten steps &middot; at your pace",
            '<p class="rsv-pline">No seat limit. One email when it opens.</p>')+
        '</div>'+
        '<div class="rsv-stepper" id="rsv-seats"><b>How many people?</b>'+
          '<div class="rsv-ctl"><button type="button" data-rsv-step="-1" aria-label="One fewer person">&minus;</button><output id="rsv-count" aria-live="polite">1</output><button type="button" data-rsv-step="1" aria-label="One more person">+</button></div></div>'+
        '<div class="rsv-lines" id="rsv-lines"></div>'+
        '<p class="rsv-small">When the date is set, you pay through a secure Stripe checkout.</p>'+
        '<a class="rsv-alt" href="https://cal.com/aneil-razvi/intro" target="_blank" rel="noopener">Questions first? Grab 15 minutes &rarr;</a>'+
        '<div class="rsv-done"><p class="rsv-eyebrow">You\'re on the list</p><h3>Check your inbox</h3>'+
          '<p>I\'ve sent what happens next. When the date and room are set, you\'ll get first pick and a secure checkout link.</p>'+
          '<button class="rsv-btn" type="button" data-rsv-close>Back to the page</button></div>'+
      '</div>'+
      '<div class="rsv-df"><div class="rsv-row"><label class="rsv-sr" for="rsv-email">Email</label>'+
        '<input class="rsv-input" type="email" id="rsv-email" placeholder="you@email.com" autocomplete="email">'+
        '<button class="rsv-btn" id="rsv-submit" type="button">Hold my seat</button></div>'+
        '<p class="rsv-msg" id="rsv-msg" role="status" aria-live="polite"></p></div>'+
    '</aside>';

  var dr, scrim, lastFocus=null, homeMode=false;
  var state={ picks:{"paper-day":true,"build-cohort":false,"self-paced":false}, mode:"in-person", seats:1, shown:{} };
  function $(id){ return document.getElementById(id); }
  function keyOf(p){ return p==="paper-day" && state.mode==="at-home" ? "paper-day-home" : p; }
  function picked(){ return ORDER.filter(function(p){ return state.picks[p]; }); }
  function counted(){ return picked().map(keyOf).filter(function(k){ return !!SEATS[k]; }); }
  function maxSeats(){ var c=counted(); if(!c.length) return 1; return Math.max(1, Math.min.apply(null, c.map(function(k){ return Math.min(CAP[k], left(k) || 1); }))); }
  function whenText(k, soon){ var s=SEATS[k]; return s && s.date ? fmt(s.date)+(untilText(s.date) ? ", "+untilText(s.date) : "") : soon; }

  /* "12 of 12 seats left → 11 after yours". The second number counts down as people are added. */
  function renderCount(p){
    var box=dr.querySelector('[data-count="'+p+'"]'); if(!box) return;
    var k=keyOf(p);
    if(!SEATS[k]){ box.style.display="none"; return; }
    box.style.display="";
    var s=SEATS[k], n=left(k), mine=state.picks[p] ? Math.min(state.seats, n) : 0, after=n-mine, prev=state.shown[k];
    box.className="rsv-count"+(n>0 && n<=3 ? " low" : "");
    box.innerHTML='<span class="rsv-meter" aria-hidden="true">'+meter(k, mine)+'</span>'+
      (n===0 ? '<span class="rsv-ct">Full. You\'ll get first pick of the next room.</span>'
             : '<span class="rsv-ct"><b>'+n+'</b> of '+s.total+' seats left'+(mine ? ' <span class="rsv-after">&rarr; <b class="rsv-n2">'+after+'</b> after yours</span>' : '')+'</span>');
    if(prev!==undefined && prev!==after){ var t=box.querySelector(".rsv-n2"); if(t) t.classList.add("rsv-tick"); }
    state.shown[k]=after;
  }

  function render(){
    var sel=picked(), home=state.mode==="at-home";
    [].forEach.call(dr.querySelectorAll(".rsv-pick"),function(c){
      var p=c.getAttribute("data-path"), on=!!state.picks[p];
      c.classList.toggle("on",on); c.querySelector(".rsv-ph").setAttribute("aria-checked",on?"true":"false");
    });
    $("rsv-paper-price").innerHTML = home ? "Price<small>at launch</small>" : "$99<small>founding</small>";
    $("rsv-paper-where").textContent = home ? "At home, with a print kit. Opens soon" : "In person, DFW area. "+whenText("paper-day","Date coming soon");
    $("rsv-mode-switch").textContent = home ? "Do it in person instead" : "Do it at home instead";
    $("rsv-build-when").textContent = "Live online, Saturday mornings. "+whenText("build-cohort","Starts after the first Paper Day");
    $("rsv-needs").style.display = (state.picks["build-cohort"] && !state.picks["paper-day"]) ? "" : "none";

    var anySeat=counted().length>0, mx=maxSeats();
    if(!anySeat) state.seats=1;
    state.seats=Math.max(1, Math.min(state.seats, mx));
    $("rsv-seats").style.display = anySeat ? "" : "none";
    $("rsv-count").textContent=state.seats;
    dr.querySelector('[data-rsv-step="-1"]').disabled = state.seats<=1;
    dr.querySelector('[data-rsv-step="1"]').disabled = state.seats>=mx;
    ORDER.forEach(renderCount);

    var ppl=state.seats, rows=[];
    sel.forEach(function(p){
      var k=keyOf(p), price=PRICES[k];
      rows.push(price ? [NAMES[k]+(ppl>1 ? " × "+ppl : ""), money(price*ppl)] : [NAMES[k], "Price at launch"]);
    });
    if(state.picks["paper-day"] && !home && (state.picks["build-cohort"] || state.picks["self-paced"])){
      rows.push(["Paper Day counts toward "+(state.picks["build-cohort"] ? "the Build cohort" : "Self-paced"), "&minus;"+money(PRICES["paper-day"]*ppl), "credit"]);
    }
    $("rsv-lines").innerHTML = rows.map(function(r){ return '<div class="rsv-ln'+(r[2]?" "+r[2]:"")+'"><span>'+r[0]+'</span><span>'+r[1]+'</span></div>'; }).join("") +
      '<div class="rsv-ln total"><span>Due today</span><span>$0</span></div>';
    $("rsv-submit").textContent = anySeat ? (ppl>1 ? "Hold my seats" : "Hold my seat") : "Tell me when it opens";
  }

  function flash(t,cls){ var m=$("rsv-msg"); m.textContent=t; m.className="rsv-msg "+(cls||"ok"); }
  function focusables(){ return [].slice.call(dr.querySelectorAll('button,a[href],input')).filter(function(e){ return e.offsetParent!==null && !e.disabled; }); }

  function openDrawer(pathKey){
    if(!dr) init();
    lastFocus=document.activeElement;
    if(pathKey){
      state.picks={"paper-day":false,"build-cohort":false,"self-paced":false};
      if(pathKey==="paper-day-home"){ state.picks["paper-day"]=true; state.mode="at-home"; }
      else { state.picks[pathKey]=true; if(pathKey==="paper-day") state.mode = homeMode ? "at-home" : "in-person"; }
    }
    state.shown={};
    dr.classList.remove("sent"); $("rsv-msg").textContent=""; render();
    dr.classList.add("on"); scrim.classList.add("on"); dr.setAttribute("aria-hidden","false");
    document.documentElement.classList.add("rsv-locked");
    setTimeout(function(){ var f=dr.querySelector('.rsv-pick.on .rsv-ph'); if(f) f.focus(); },60);
  }
  function closeDrawer(){
    if(!dr) return;
    dr.classList.remove("on"); scrim.classList.remove("on"); dr.setAttribute("aria-hidden","true");
    document.documentElement.classList.remove("rsv-locked");
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* which button or link wants the panel */
  function targetOf(el){
    var o=el.closest("[data-open]");
    if(o){ var k=o.getAttribute("data-open"); if(k==="paper-day"||k==="paper-day-home"||k==="build-cohort"||k==="self-paced") return k; }
    var a=el.closest("a[href]"); if(!a) return null;
    var u; try{ u=new URL(a.getAttribute("href"), location.href); }catch(e){ return null; }
    if(u.origin!==location.origin || !HASH[u.hash]) return null;
    if(COURSE_PATHS[u.pathname] || u.pathname===location.pathname) return HASH[u.hash];
    return null;
  }

  var qs=new URLSearchParams(location.search);
  function sid(){ try{ var k=sessionStorage.getItem("bsid"); if(!k){k=Math.random().toString(36).slice(2)+Date.now().toString(36); sessionStorage.setItem("bsid",k);} return k; }catch(e){ return "ns-"+Math.random().toString(36).slice(2); } }
  var FAIL="That did not save. Try again, or email hi@aneilrazvi.com.";
  function submit(){
    var btn=$("rsv-submit"), v=($("rsv-email").value||"").trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){ flash("That email does not look right.","err"); $("rsv-email").focus(); return; }
    var interest=picked().map(keyOf);
    var payload={ source:"build", landing_path:location.pathname, referrer:document.referrer||null, session_id:sid(),
      utm_source:qs.get("utm_source"), utm_medium:qs.get("utm_medium"), utm_campaign:qs.get("utm_campaign"), utm_content:qs.get("utm_content"),
      email:v, gated:true, recommended_package:interest.join(","), answers:{ page:"course-v2", interest:interest, seats:state.seats } };
    var label=btn.textContent; btn.disabled=true; btn.textContent="Sending...";
    fetch("/api/lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
      .then(function(r){ btn.disabled=false; btn.textContent=label;
        if(r.ok){ $("rsv-email").value=""; dr.classList.add("sent"); var d=dr.querySelector(".rsv-done .rsv-btn"); if(d) d.focus(); } else { flash(FAIL,"err"); } })
      .catch(function(){ btn.disabled=false; btn.textContent=label; flash(FAIL,"err"); });
  }

  function init(){
    if(dr) return;
    var wrap=document.createElement("div"); wrap.innerHTML=HTML;
    while(wrap.firstChild) document.body.appendChild(wrap.firstChild);
    dr=$("rsv-drawer"); scrim=$("rsv-scrim");
    [].forEach.call(dr.querySelectorAll(".rsv-ph"),function(b){ b.addEventListener("click",function(){
      var p=b.parentNode.getAttribute("data-path");
      if(state.picks[p] && picked().length===1){ flash("Pick at least one.","err"); return; }
      state.picks[p]=!state.picks[p]; $("rsv-msg").textContent=""; render();
    }); });
    $("rsv-mode-switch").addEventListener("click",function(){ state.mode = state.mode==="at-home" ? "in-person" : "at-home"; render(); });
    $("rsv-addpaper").addEventListener("click",function(){ state.picks["paper-day"]=true; render(); dr.querySelector('[data-path="paper-day"] .rsv-ph').focus(); });
    [].forEach.call(dr.querySelectorAll("[data-rsv-step]"),function(b){ b.addEventListener("click",function(){ state.seats+=+b.getAttribute("data-rsv-step"); render(); }); });
    [].forEach.call(document.querySelectorAll("[data-rsv-close]"),function(b){ b.addEventListener("click",closeDrawer); });
    scrim.addEventListener("click",closeDrawer);
    $("rsv-submit").addEventListener("click",submit);
    $("rsv-email").addEventListener("keydown",function(e){ if(e.key==="Enter") submit(); });
    document.addEventListener("keydown",function(e){
      if(!dr.classList.contains("on")) return;
      if(e.key==="Escape"){ closeDrawer(); return; }
      if(e.key==="Tab"){ var f=focusables(); if(!f.length) return; var a=f[0], z=f[f.length-1];
        if(e.shiftKey && document.activeElement===a){ e.preventDefault(); z.focus(); } else if(!e.shiftKey && document.activeElement===z){ e.preventDefault(); a.focus(); } }
    });
    document.addEventListener("click",function(e){
      if(e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var k=targetOf(e.target); if(!k) return;
      e.preventDefault(); openDrawer(k);
    });
    function fromHash(){ if(HASH[location.hash]) openDrawer(HASH[location.hash]); }
    addEventListener("hashchange",fromHash);
    fromHash();
  }

  window.AneilReserve = {
    SEATS:SEATS, left:left, seatsText:seatsText, meter:meter, fmt:fmt, untilText:untilText,
    open:openDrawer, close:closeDrawer, setHomeMode:function(on){ homeMode=!!on; }
  };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
