// Weather Widget - Open-Meteo API integration
(function(){
  const el = document.getElementById('weather');
  if (!el) return; // Exit if weather widget not found
  
  const minneapolisPanel = el.querySelector('.weather-panel-minneapolis');
  const localPanel = el.querySelector('.weather-panel-local');
  const localTitle = localPanel.querySelector('.weather-panel-title');
  const localTempEl = localPanel.querySelector('.weather-temp');
    ');
  const localDescEl = localPanel.querySelector('.weather-desc');
  const localEmojiEl = localPanel.querySelector('.weather-emoji');
  const minneapolisTempEl = minneapolisPanel.querySelector('.weather-temp');
  const minneapolisDescEl = minneapolisPanel.querySelector('.weather-desc');
  const minneapolisEmojiEl = minneapolisPanel.querySelector('.weather-emoji');

  function setPanelError(panelTemp, panelDesc, panelEmoji, message){
    panelTemp.textContent = '—';
    panelDesc.textContent = message;
    panelEmoji.textContent = '❗';
  }

  function codeToEmoji(code){
    // Open-Meteo weathercode mapping simplified
    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '🌤️';
    if (code === 3 || (code >= 45 && code <= 48)) return '☁️';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) return '🌧️';
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '❄️';
    return '🌈';
  }

  function codeToDesc(code){
    if (code === 0) return 'Clear';
    if (code === 1 || code === 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 45 && code <= 48) return 'Fog';
    if (code >= 51 && code <= 67) return 'Rain';
    if (code >= 80 && code <= 82) return 'Showers';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 85 && code <= 86) return 'Snow showers';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Weather';
  }

  function fetchWeather(lat, lon, panelTemp, panelDesc, panelEmoji){
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit&timezone=auto`;
    fetch(url).then(r=>{
      if(!r.ok) throw new Error('Weather fetch failed');
      return r.json();
    }).then(data=>{
      const w = data.current_weather;
      if(!w){ setPanelError(panelTemp, panelDesc, panelEmoji, 'No current weather'); return; }
      const t = Math.round(w.temperature);
      const code = w.weathercode;
      panelTemp.textContent = `${t}°F`;
      panelDesc.textContent = codeToDesc(code);
      panelEmoji.textContent = codeToEmoji(code);
    }).catch(err=>{
      setPanelError(panelTemp, panelDesc, panelEmoji, 'Unable to load weather');
      console.error(err);
    });
  }

  function fetchLocationName(lat, lon){
    const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`;
    fetch(url).then(r=>{
      if(!r.ok) throw new Error('Geocode fetch failed');
      return r.json();
    }).then(data=>{
      const res = data.results && data.results[0];
      if(!res){ throw new Error('No geocode results'); }
      let name = res.name || '';
      if(res.admin1 && res.admin1 !== name) name += name ? `, ${res.admin1}` : res.admin1;
      if(res.country && !name.includes(res.country)) name += name ? `, ${res.country}` : res.country;
      const locationText = name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      localTitle.textContent = locationText;
    }).catch(err=>{
      console.warn(err);
      localTitle.textContent = 'Unknown location';
    });
  }

  // Load Minneapolis weather first
  fetchWeather(44.9778, -93.2650, minneapolisTempEl, minneapolisDescEl, minneapolisEmojiEl);

  if (!navigator.geolocation){
    setPanelError(localTempEl, localDescEl, localEmojiEl, 'Geolocation not supported');
    localTitle.textContent = 'Your location unavailable';
  } else {
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude, longitude} = pos.coords;
      fetchWeather(latitude, longitude, localTempEl, localDescEl, localEmojiEl);
      fetchLocationName(latitude, longitude);
    }, err=>{
      console.warn(err);
      const funny = "LOCATION BLOCKED. I promise I'm not secretly following you! Enable location to see your local weather.";
      localTitle.textContent = funny;
      setPanelError(localTempEl, localDescEl, localEmojiEl, 'Location disabled');
    }, {timeout:10000});
  }
})();
