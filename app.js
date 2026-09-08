const $ = (selector) => document.querySelector(selector);
const pickup = $('#pickup');
const drop = $('#drop');
const schedule = $('#schedule');
const fare = $('#fare');
const fareNote = $('#fareNote');
const passengerCount = $('#passengerCount');
const resultPanel = $('#resultPanel');
const historyDialog = $('#historyDialog');
const historyList = $('#historyList');
const rideCount = $('#rideCount');

// Same-origin in production; localhost backend for local static development.
const API_BASE = (window.CAMPUS_TOTO_API || localStorage.getItem('campusTotoApi') ||
  (location.protocol.startsWith('http') ? location.origin : 'http://localhost:5000')).replace(/\/$/, '');
const CLIENT_ID = localStorage.getItem('campusTotoClientId') || crypto.randomUUID();
localStorage.setItem('campusTotoClientId', CLIENT_ID);

const fallbackRoutes = [
  {from:'Main Gate', to:'Tech Market', time:'4–6 min', fare:20},
  {from:'Main Gate', to:'Nalanda Complex', time:'7–9 min', fare:30},
  {from:'Tech Market', to:'RP Hall', time:'5–7 min', fare:25},
  {from:'Railway Station', to:'Main Gate', time:'8–12 min', fare:40},
  {from:'Nalanda Complex', to:'Jnan Ghosh Stadium', time:'6–8 min', fare:25},
  {from:'Your Hall', to:'Tech Market', time:'5–8 min', fare:20}
];
let routes = fallbackRoutes;
let passengers = 1;
let activeBookingId = null;

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {'Content-Type':'application/json', 'X-Client-Id':CLIENT_ID, ...(options.headers || {})}
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `API error ${response.status}`);
  return data;
}

function fareEstimate(){
  const route = routes.find(r => r.from === pickup.value && r.to === drop.value);
  const same = pickup.value === drop.value;
  const base = same ? 20 : (route?.fare || 20 + Math.min(35, Math.abs(pickup.selectedIndex - drop.selectedIndex) * 5));
  const total = base + Math.max(0, passengers - 2) * 10;
  fare.textContent = `₹${total}`;
  fareNote.textContent = same ? 'Please choose two different points' : (passengers > 2 ? 'Includes extra passenger' : 'Short campus trip');
}

function formatWhen(value){ return value === 'now' ? 'Now' : `In ${value} min`; }
function updateCount(){ passengerCount.textContent = passengers; fareEstimate(); }

$('#plusBtn').addEventListener('click', () => { if(passengers < 6){ passengers++; updateCount(); }});
$('#minusBtn').addEventListener('click', () => { if(passengers > 1){ passengers--; updateCount(); }});
$('#swapBtn').addEventListener('click', () => {
  const old = pickup.value; pickup.value = drop.value; drop.value = old; fareEstimate();
});
pickup.addEventListener('change', fareEstimate);
drop.addEventListener('change', fareEstimate);

function renderHistoryItems(bookings){
  rideCount.textContent = bookings.length;
  if(!bookings.length){ historyList.innerHTML = '<div class="empty-history">No bookings yet. Your confirmed rides will appear here.</div>'; return; }
  historyList.innerHTML = bookings.map(item => `
    <div class="history-item">
      <div><div class="history-route">${item.pickup} → ${item.dropoff}</div><div class="history-detail">${formatWhen(item.schedule)} · ${item.passengers} passenger${item.passengers===1?'':'s'} · ${item.driver}</div></div>
      <div class="history-price">₹${item.fare}</div>
    </div>`).join('');
}

async function renderHistory(){
  try { const data = await api('/api/bookings'); renderHistoryItems(data.bookings || []); }
  catch (_error) { rideCount.textContent='0'; historyList.innerHTML='<div class="empty-history">Connect the backend to view saved rides.</div>'; }
}

$('#bookingForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if(pickup.value === drop.value){ alert('Please choose different pickup and drop points.'); return; }
  const button = event.submitter || document.querySelector('.book-btn');
  button.disabled = true; button.classList.add('loading');
  try {
    const data = await api('/api/bookings', {method:'POST', body:JSON.stringify({pickup:pickup.value, dropoff:drop.value, schedule:schedule.value, passengers})});
    const booking = data.booking; activeBookingId = booking.id;
    $('#resultTitle').textContent = `${booking.driver} is heading to you`;
    $('#resultMeta').textContent = `🛺 ${booking.vehicle} · ${booking.pickup} → ${booking.dropoff} · ${formatWhen(booking.schedule)}`;
    $('#resultEta').textContent = `${booking.eta} min`;
    resultPanel.classList.remove('hidden'); resultPanel.dataset.active='true';
    resultPanel.scrollIntoView({behavior:'smooth', block:'center'});
    await renderHistory();
  } catch (error) { alert(`Could not book the Toto: ${error.message}`); }
  finally { button.disabled=false; button.classList.remove('loading'); }
});

$('#cancelBtn').addEventListener('click', async () => {
  if(!activeBookingId) return;
  try {
    await api(`/api/bookings/${activeBookingId}/cancel`, {method:'PATCH'});
    resultPanel.classList.add('hidden'); delete resultPanel.dataset.active; activeBookingId=null; await renderHistory();
  } catch(error) { alert(`Could not cancel the ride: ${error.message}`); }
});

$('#historyBtn').addEventListener('click', async () => { await renderHistory(); historyDialog.showModal(); });
$('#closeDialog').addEventListener('click', () => historyDialog.close());
historyDialog.addEventListener('click', event => {
  const r=historyDialog.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) historyDialog.close();
});

function renderRoutes(){
  document.getElementById('routeGrid').innerHTML = routes.map((route,index) => `
    <article class="route-card" data-index="${index}" role="button" tabindex="0" aria-label="Select ${route.from} to ${route.to}">
      <div class="route-top"><div class="route-name">${route.from} <span class="route-arrow">→</span> ${route.to}</div><strong>₹${route.fare}</strong></div>
      <div class="route-meta">Typical time · ${route.time}</div>
    </article>`).join('');
  document.querySelectorAll('.route-card').forEach(card => {
    const apply=()=>{ const route=routes[Number(card.dataset.index)]; pickup.value=route.from; drop.value=route.to; fareEstimate(); document.getElementById('book').scrollIntoView({behavior:'smooth',block:'start'}); };
    card.addEventListener('click',apply); card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();apply();}});
  });
}

async function loadRoutes(){ try { const data=await api('/api/routes'); if(data.routes?.length) routes=data.routes; } catch(_e){} renderRoutes(); fareEstimate(); }
loadRoutes();
renderHistory();
fareEstimate();

window.setCampusTotoApi = (url) => { localStorage.setItem('campusTotoApi',String(url).replace(/\/$/,'')); location.reload(); };

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
