// Dashboard de Clima sem chave (Open-Meteo + Nominatim)
// Não requer API key — atente-se às políticas de uso do Nominatim (limites).

// DOM
const searchForm = document.getElementById('searchForm');
const inputCity = document.getElementById('inputCity');
const recentList = document.getElementById('recentList');
const btnLocate = document.getElementById('btn-locate');
const unitToggle = document.getElementById('unitToggle');

const messageEl = document.getElementById('message');
const currentCard = document.getElementById('currentCard');
const locationName = document.getElementById('locationName');
const currentDate = document.getElementById('currentDate');
const currentIcon = document.getElementById('currentIcon');
const currentTemp = document.getElementById('currentTemp');
const currentDesc = document.getElementById('currentDesc');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const pressure = document.getElementById('pressure');
const forecastSection = document.getElementById('forecast');
const forecastGrid = document.getElementById('forecastGrid');

const RECENT_KEY = 'pituach_weather_recent_open_meteo';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

// Nominatim geocoding
async function geocodeCityNoKey(city){
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`;
  const res = await fetch(url, {headers:{'Accept':'application/json'}});
  if(!res.ok) throw new Error('Falha ao buscar a cidade (Nominatim)');
  const data = await res.json();
  if(!data || data.length === 0) throw new Error('Cidade não encontrada');
  return data[0]; // {lat, lon, display_name}
}

// reverse geocode
async function reverseGeocodeNoKey(lat, lon){
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const res = await fetch(url,{headers:{'Accept':'application/json'}});
  if(!res.ok) return null;
  const data = await res.json();
  return data ? data : null;
}

// Open-Meteo fetch
async function fetchOpenMeteo(lat, lon, units='metric'){
  const cached = loadCache(lat, lon, units);
  if(cached) return cached;
  const tempUnit = units === 'metric' ? 'celsius' : 'fahrenheit';
  const windUnit = units === 'metric' ? 'ms' : 'mph';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&temperature_unit=${tempUnit}&windspeed_unit=${windUnit}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Erro ao obter dados meteorológicos (Open-Meteo)');
  const data = await res.json();
  saveCache(lat, lon, units, data);
  return data;
}

// cache, recent same as other implementation
function loadRecent() {
  const raw = localStorage.getItem(RECENT_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveRecent(list) { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0,6))); }
function addRecent(label, lat, lon){ let list = loadRecent(); list = list.filter(i=>!(i.label===label)); list.unshift({label,lat,lon}); saveRecent(list); renderRecent(); }
function renderRecent(){ const list = loadRecent(); recentList.innerHTML=''; if(list.length===0){ recentList.innerHTML='<li>Nenhuma pesquisa</li>'; return;} list.forEach(item=>{ const li=document.createElement('li'); const btn=document.createElement('button'); btn.textContent=item.label; btn.addEventListener('click',()=> fetchWeatherByCoords(item.lat,item.lon, unitToggle.value)); li.appendChild(btn); recentList.appendChild(li); }); }

function getCacheKey(lat,lon,units){ return `om_weather_${lat}_${lon}_${units}` }
function loadCache(lat,lon,units){ try{ const key=getCacheKey(lat,lon,units); const raw=sessionStorage.getItem(key); if(!raw) return null; const obj=JSON.parse(raw); if(Date.now()-obj.ts < CACHE_TTL_MS) return obj.data; sessionStorage.removeItem(key); return null;}catch(e){return null} }
function saveCache(lat,lon,units,data){ try{ const key=getCacheKey(lat,lon,units); sessionStorage.setItem(key, JSON.stringify({ts:Date.now(), data})); }catch(e){} }

// Map Open-Meteo weathercode to description + emoji
const WEATHER_MAP = {
  0: ['Céu limpo','☀️'],
  1: ['Parcialmente nublado','🌤️'],
  2: ['Nuvens dispersas','⛅'],
  3: ['Nublado','☁️'],
  45: ['Neblina','🌫️'],
  48: ['Depósito de gelo','🌫️'],
  51: ['Chuvisco leve','🌦️'],
  53: ['Chuvisco moderado','🌦️'],
  55: ['Chuvisco denso','🌧️'],
  56: ['Chuvisco gelado leve','🌧️❄️'],
  57: ['Chuvisco gelado denso','🌧️❄️'],
  61: ['Chuva fraca','🌧️'],
  63: ['Chuva moderada','🌧️'],
  65: ['Chuva forte','⛈️'],
  66: ['Chuva congelante fraca','❄️🌧️'],
  67: ['Chuva congelante forte','❄️🌧️'],
  71: ['Neve fraca','🌨️'],
  73: ['Neve moderada','🌨️'],
  75: ['Neve forte','❄️'],
  77: ['Granizo','🌨️'],
  80: ['Chuvas intermitentes fracas','🌦️'],
  81: ['Chuvas intermitentes','🌧️'],
  82: ['Chuvas intermitentes fortes','⛈️'],
  85: ['Neve intermitente fraca','🌨️'],
  86: ['Neve intermitente forte','❄️'],
  95: ['Trovoada','⛈️'],
  96: ['Trovoada com granizo fraco','⛈️'],
  99: ['Trovoada com granizo forte','⛈️']
};
function codeToDesc(code){ return WEATHER_MAP[code] ? WEATHER_MAP[code][0] : 'Condições'; }
function codeToEmoji(code){ return WEATHER_MAP[code] ? WEATHER_MAP[code][1] : '🌈'; }

function showMessage(text,type='info'){ messageEl.hidden=false; messageEl.textContent=text; messageEl.style.borderColor = type==='error' ? '#f5c2c7' : '#f1e6a8'; if(type==='error') messageEl.style.background='#fff1f0'; setTimeout(()=>{ if(messageEl.textContent===text) messageEl.hidden=true; },7000); }
function formatDateFromUnixISO(iso){ const d=new Date(iso); return d.toLocaleString('pt-BR',{ weekday:'short', day:'2-digit', month:'short' }); }

async function fetchWeatherByCoords(lat, lon, units='metric'){
  try{
    showMessage('Carregando dados...', 'info');
    const place = await reverseGeocodeNoKey(lat, lon);
    const displayName = place && place.address ? (place.address.city || place.address.town || place.address.village || place.display_name) : `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    const data = await fetchOpenMeteo(lat, lon, units);
    renderWeather(displayName, data, units);
    addRecent(displayName, lat, lon);
    messageEl.hidden = true;
  }catch(err){ showMessage(err.message || 'Erro', 'error'); console.error(err); }
}

function renderWeather(displayName, data, units){
  // current
  const cur = data.current_weather;
  locationName.textContent = displayName;
  currentDate.textContent = new Date().toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  const code = data.daily && data.daily.weathercode && data.daily.weathercode[0] !== undefined ? data.daily.weathercode[0] : (cur && cur.weathercode ? cur.weathercode : 0);
  currentIcon.textContent = codeToEmoji(code);
  currentTemp.textContent = `${Math.round(cur.temperature)}° ${units==='metric'?'C':'F'}`;
  currentDesc.textContent = codeToDesc(code);
  feelsLike.textContent = `${Math.round(cur.temperature)}°`;
  humidity.textContent = `—`;
  wind.textContent = `${cur.windspeed} ${units==='metric'?'m/s':'mph'}`;
  pressure.textContent = `—`;

  currentCard.hidden = false;

  // forecast daily (using daily arrays)
  const days = [];
  if(data.daily && data.daily.time){
    for(let i=0;i<data.daily.time.length;i++){
      days.push({date: data.daily.time[i], max: data.daily.temperature_2m_max[i], min: data.daily.temperature_2m_min[i], code: data.daily.weathercode[i]});
    }
  }
  forecastGrid.innerHTML = '';
  days.slice(1,8).forEach(d => {
    const item = document.createElement('div');
    item.className = 'forecast-item card';
    const date = formatDateFromUnixISO(d.date);
    const emoji = codeToEmoji(d.code);
    const desc = codeToDesc(d.code);
    item.innerHTML = `\n      <div><strong>${date}</strong></div>\n      <div style="font-size:36px">${emoji}</div>\n      <div>${desc}</div>\n      <div><strong>${Math.round(d.max)}° / ${Math.round(d.min)}°</strong></div>\n    `;
    forecastGrid.appendChild(item);
  });
  forecastSection.hidden = false;
}

// Events
searchForm.addEventListener('submit', async (ev)=>{ ev.preventDefault(); const city = inputCity.value.trim(); if(!city) return; try{ showMessage('Localizando cidade...', 'info'); const geo = await geocodeCityNoKey(city); await fetchWeatherByCoords(geo.lat, geo.lon, unitToggle.value); inputCity.value=''; }catch(err){ showMessage(err.message||'Erro na busca','error'); console.error(err); } });

btnLocate.addEventListener('click', ()=>{ if(!navigator.geolocation){ showMessage('Geolocalização não suportada no seu navegador','error'); return; } showMessage('Obtendo sua localização...','info'); navigator.geolocation.getCurrentPosition(async pos=>{ const {latitude, longitude}=pos.coords; await fetchWeatherByCoords(latitude, longitude, unitToggle.value); }, err=>{ showMessage('Não foi possível obter localização: '+err.message,'error'); }, {timeout:10000}); });

unitToggle.addEventListener('change', ()=>{ const displayed = locationName.textContent; if(displayed && displayed!=='—'){ const recent = loadRecent(); if(recent.length>0){ const first = recent[0]; fetchWeatherByCoords(first.lat, first.lon, unitToggle.value); } } });

// init
(function init(){ renderRecent(); const rec = loadRecent(); if(rec.length>0){ fetchWeatherByCoords(rec[0].lat, rec[0].lon, unitToggle.value); } else { geocodeCityNoKey('São Paulo').then(g=>fetchWeatherByCoords(g.lat,g.lon,unitToggle.value)).catch(()=>{}); }})();
