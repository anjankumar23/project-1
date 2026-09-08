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

const routes = [
  {from:'Main Gate', to:'Tech Market', time:'4–6 min', fare:20},
  {from:'Main Gate', to:'Nalanda Complex', time:'7–9 min', fare:30},
  {from:'Tech Market', to:'RP Hall', time:'5–7 min', fare:25},
  {from:'Railway Station', to:'Main Gate', time:'8–12 min', fare:40},
  {from:'Nalanda Complex', to:'Jnan Ghosh Stadium', time:'6–8 min', fare:25},
  {from:'Your Hall', to:'Tech Market', time:'5–8 min', fare:20}
];

let passengers = 1;

function fareEstimate(){
  const route = routes.find(r => r.from === pickup.value && r.to === drop.value);
  const same = pickup.value === drop.value;
  const base = same ? 20 : (route?.fare || 20 + Math.min(35, Math.abs(pickup.selectedIndex - drop.selectedIndex) * 5));
  const extra = Math.max(0, passengers - 2) * 10;
  const total = base + extra;
  fare.textContent = `₹${total}`;
  fareNote.textContent = same ? 'Please choose two different points' : (passengers > 2 ? 'Includes extra passenger' : 'Short campus trip');
}

function updateCount(){ passengerCount.textContent = passengers; fareEstimate(); }

$('#plusBtn').addEventListener('click', () => { if(passengers < 6){ passengers++; updateCount(); }});
$('#minusBtn').addEventListener('click', () => { if(passengers > 1){ passengers--; updateCount(); }});
$('#swapBtn').addEventListener('click', () => {
  const oldPickup = pickup.value;
  pickup.value = drop.value;
  drop.value = oldPickup;
  fareEstimate();
});
pickup.addEventListener('change', fareEstimate);
drop.addEventListener('change', fareEstimate);

function saveRide(ride){
  const history = JSON.parse(localStorage.getItem('campusTotoRides') || '[]');
  history.unshift(ride);
  localStorage.setItem('campusTotoRides', JSON.stringify(history.slice(0, 8)));
  renderHistory();
}

function renderHistory(){
  const history = JSON.parse(localStorage.getItem('campusTotoRides') || '[]');
  rideCount.textContent = history.length;
  if(!history.length){
    historyList.innerHTML = '<div class="empty-history">No bookings yet. Your confirmed rides will appear here.</div>';
    return;
  }
  historyList.innerHTML = history.map(item => `
    <div class="history-item">
      <div><div class="history-route">${item.from} → ${item.to}</div><div class="history-detail">${item.when} · ${item.passengers} passenger${item.passengers===1?'':'s'} · ${item.driver}</div></div>
      <div class="history-price">₹${item.fare}</div>
    </div>
  `).join('');
}

$('#bookingForm').addEventListener('submit', (event) => {
  event.preventDefault();
  if(pickup.value === drop.value){
    alert('Please choose different pickup and drop points.');
    return;
  }
  const eta = Math.floor(2 + Math.random() * 4);
  const driverNames = ['Amit', 'Rakesh', 'Sanjay', 'Bikash', 'Rahul'];
  const driver = driverNames[Math.floor(Math.random() * driverNames.length)];
  const bookingFare = Number(fare.textContent.replace('₹',''));
  const when = schedule.value === 'now' ? 'Now' : `In ${schedule.value} min`;

  $('#resultTitle').textContent = `${driver} is heading to you`;
  $('#resultMeta').textContent = `🛺 KGP Toto · ${pickup.value} → ${drop.value} · ${when}`;
  $('#resultEta').textContent = `${eta} min`;
  resultPanel.dataset.active = 'true';
  resultPanel.classList.remove('hidden');
  resultPanel.scrollIntoView({behavior:'smooth', block:'center'});

  saveRide({from:pickup.value,to:drop.value,when,passengers,driver,fare:bookingFare,created:new Date().toISOString()});
});

$('#cancelBtn').addEventListener('click', () => {
  resultPanel.classList.add('hidden');
  delete resultPanel.dataset.active;
});

$('#historyBtn').addEventListener('click', () => { renderHistory(); historyDialog.showModal(); });
$('#closeDialog').addEventListener('click', () => historyDialog.close());
historyDialog.addEventListener('click', (event) => {
  const rect = historyDialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if(!inside) historyDialog.close();
});

document.getElementById('routeGrid').innerHTML = routes.map((route, index) => `
  <article class="route-card" data-index="${index}" role="button" tabindex="0" aria-label="Select ${route.from} to ${route.to}">
    <div class="route-top"><div class="route-name">${route.from} <span class="route-arrow">→</span> ${route.to}</div><strong>₹${route.fare}</strong></div>
    <div class="route-meta">Typical time · ${route.time}</div>
  </article>
`).join('');

document.querySelectorAll('.route-card').forEach(card => {
  const apply = () => {
    const route = routes[Number(card.dataset.index)];
    pickup.value = route.from;
    drop.value = route.to;
    fareEstimate();
    document.getElementById('book').scrollIntoView({behavior:'smooth', block:'start'});
  };
  card.addEventListener('click', apply);
  card.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); apply(); }});
});

renderHistory();
fareEstimate();
