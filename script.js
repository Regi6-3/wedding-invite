document.addEventListener('DOMContentLoaded', function() {
  const weddingDate = new Date("August 28, 2026 18:00:00").getTime();
  function updateCountdown() {
    const now = new Date().getTime();
    const distance = weddingDate - now;
    const totalDays = Math.floor(distance / (1000*60*60*24));
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    const hours = Math.floor((distance % (86400000)) / 3600000);
    const minutes = Math.floor((distance % 3600000) / 60000);
    const seconds = Math.floor((distance % 60000) / 1000);
    document.getElementById("weeks").innerText = weeks < 10 ? "0"+weeks : weeks;
    document.getElementById("days").innerText = days < 10 ? "0"+days : days;
    document.getElementById("hours").innerText = hours < 10 ? "0"+hours : hours;
    document.getElementById("minutes").innerText = minutes < 10 ? "0"+minutes : minutes;
    document.getElementById("seconds").innerText = seconds < 10 ? "0"+seconds : seconds;
  }
  setInterval(updateCountdown, 1000);
  updateCountdown();

  function initMap() {
    if (typeof ymaps === 'undefined') return;
    ymaps.ready(() => {
      const myMap = new ymaps.Map('map', { center: [55.865728, 49.108624], zoom: 17, controls: ['zoomControl'] });
      myMap.geoObjects.add(new ymaps.Placemark([55.865728, 49.108624], { balloonContent: "Банкетный зал 'Чайковский', ул. Деметьева, 51, Казань" }));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMap);
  else initMap();

  let currentGuestId = null;
  const preForm = document.getElementById('preRsvpForm');
  const preMsg = document.getElementById('preMsg');
  const questionnaireBlock = document.getElementById('questionnaireBlock');
  const guestNameInput = document.getElementById('guestName');
  const attendingSelect = document.getElementById('preAttending');
  if (preForm) {
    preForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const guestName = guestNameInput.value.trim();
      const attending = attendingSelect.value;
      if (!guestName || !attending) {
        preMsg.innerText = 'Укажите имя и выберите статус.';
        preMsg.style.color = 'red';
        return;
      }
      const attendingBool = (attending === 'yes');
      const data = { name: guestName, attending: attendingBool, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
      try {
        const docRef = await db.collection("guests").add(data);
        currentGuestId = docRef.id;
        preMsg.innerText = 'Спасибо, ' + guestName + '! Ваш ответ сохранён.';
        preMsg.style.color = 'green';
        if (attendingBool) questionnaireBlock.style.display = 'block';
        else questionnaireBlock.style.display = 'none';
        guestNameInput.disabled = true;
        attendingSelect.disabled = true;
      } catch(err) {
        preMsg.innerText = 'Ошибка: ' + err.message;
        preMsg.style.color = 'red';
      }
    });
  }

  const companionsContainer = document.getElementById('companionsContainer');
  let companionCounter = 2;

  function createCompanionBlock(index) {
    const div = document.createElement('div');
    div.className = 'companion-block';
    div.innerHTML = `
      <h4>Анкета ${index}</h4>
      <div class="form-group"><label>Имя</label><input type="text" name="cname_${index}" placeholder="Имя гостя" required></div>
      <div class="form-group"><label>Потребуется ли вам трансфер?</label><select name="ctransfer_${index}"><option value="Нет">Нет</option><option value="Да">Да</option></select></div>
      <div class="form-group"><label>Какой алкоголь вы предпочитаете?</label><select name="calcohol_${index}"><option value="Вино">Вино</option><option value="Шампанское">Шампанское</option><option value="Водка">Водка</option><option value="Не буду пить алкоголь">Не буду пить алкоголь</option></select></div>
      <div class="form-group"><label>Присоединитесь ли вы к нам праздновать торжество на следующий день?</label><select name="cnextDay_${index}"><option value="Да">Да</option><option value="Нет">Нет</option></select></div>
      <div class="form-group"><label>Останетесь вы на ночь после торжества?</label><select name="covernight_${index}"><option value="Да">Да</option><option value="Нет">Нет</option></select></div>
      <div class="form-group"><label>Есть ли у вас диетические предпочтения?</label><select name="cdiet_${index}"><option value="Ем всё">Ем всё</option><option value="Не ем мясо">Не ем мясо</option><option value="Не ем рыбу">Не ем рыбу</option><option value="Не ем курицу">Не ем курицу</option></select></div>
      <button type="button" class="remove-companion"><i class="fas fa-trash-alt"></i> Удалить анкету</button>
    `;
    div.querySelector('.remove-companion').addEventListener('click', () => div.remove());
    return div;
  }

  document.body.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'addCompanionBtn') {
      if (companionsContainer) {
        const newBlock = createCompanionBlock(companionCounter);
        companionsContainer.appendChild(newBlock);
        companionCounter++;
      }
    }
  });

  const fullForm = document.getElementById('fullQuestionnaire');
  const qMsg = document.getElementById('questionnaireMsg');
  if (fullForm) {
    fullForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentGuestId) {
        qMsg.innerText = 'Сначала подтвердите участие.';
        qMsg.style.color = 'red';
        return;
      }
      const formData = {
        transfer: fullForm.transfer.value,
        alcohol: fullForm.alcohol.value,
        nextDay: fullForm.nextDay.value,
        overnight: fullForm.overnight.value,
        diet: fullForm.diet.value,
        questionnaireTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      };
      try {
        await db.collection("guests").doc(currentGuestId).update(formData);
        const guestRef = db.collection("guests").doc(currentGuestId);
        const companions = [];
        document.querySelectorAll('.companion-block').forEach(block => {
          const nameInput = block.querySelector('input[type="text"]');
          if (nameInput && nameInput.value.trim()) {
            companions.push({
              name: nameInput.value.trim(),
              transfer: block.querySelector('select[name^="ctransfer"]')?.value || 'Нет',
              alcohol: block.querySelector('select[name^="calcohol"]')?.value || 'Не буду пить алкоголь',
              nextDay: block.querySelector('select[name^="cnextDay"]')?.value || 'Нет',
              overnight: block.querySelector('select[name^="covernight"]')?.value || 'Нет',
              diet: block.querySelector('select[name^="cdiet"]')?.value || 'Ем всё',
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
        });
        for (let comp of companions) {
          await guestRef.collection("companions").add(comp);
        }
        qMsg.innerText = 'Анкета отправлена! Спасибо.';
        qMsg.style.color = 'green';
        fullForm.reset();
        companionsContainer.innerHTML = '';
        companionCounter = 2;
        questionnaireBlock.style.display = 'none';
        fireConfetti();
      } catch(err) {
        qMsg.innerText = 'Ошибка: ' + err.message;
        qMsg.style.color = 'red';
        console.error(err);
      }
    });
  }

  const calendarBtn = document.getElementById('addToCalendarBtn');
  if (calendarBtn) {
    calendarBtn.addEventListener('click', () => {
      const start = new Date(2026,7,28,18,0,0);
      const end = new Date(2026,7,28,23,0,0);
      const fmt = d => d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
      const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${Date.now()}@wedding\nDTSTAMP:${fmt(new Date())}\nDTSTART:${fmt(start)}\nDTEND:${fmt(end)}\nSUMMARY:Свадьба Алексея и Регины\nDESCRIPTION:Гостевой дом "Чайковский", ул. Деметьева 51, Казань\nLOCATION:ул. Деметьева 51, Казань\nEND:VEVENT\nEND:VCALENDAR`;
      const blob = new Blob([ics], {type:'text/calendar'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'wedding.ics';
      link.click();
      URL.revokeObjectURL(link.href);
      if (/android/i.test(navigator.userAgent)) {
        alert('Файл календаря скачан. Откройте его в приложении "Google Календарь" или другом календаре, чтобы добавить событие.');
      }
    });
  }

  const audio = document.getElementById('weddingAudio');
  const musicBtn = document.getElementById('playMusicBtn');
  if (audio && musicBtn) {
    let playing = false;
    musicBtn.onclick = () => {
      if (playing) { audio.pause(); musicBtn.innerHTML = '<i class="fas fa-music"></i> Включить музыку'; }
      else { audio.play().catch(e=>alert('Ошибка: '+e)); musicBtn.innerHTML = '<i class="fas fa-stop"></i> Выключить музыку'; }
      playing = !playing;
    };
  }

  function fireConfetti() {
    const colors = ['#FFD700','#FF69B4','#FFFFFF','#9B6B5C','#C5E0B4'];
    for(let i=0; i<120; i++) {
      const c = document.createElement('div');
      c.style.cssText = `position:fixed; width:${Math.random()*8+4}px; height:${Math.random()*8+4}px; background:${colors[Math.floor(Math.random()*colors.length)]}; border-radius:${Math.random()>0.5?'50%':'0'}; left:${Math.random()*window.innerWidth}px; top:-20px; z-index:9999; pointer-events:none; opacity:${Math.random()*0.8+0.3}; animation:fall ${Math.random()*2+2}s linear forwards;`;
      document.body.appendChild(c);
      setTimeout(()=>c.remove(),3000);
    }
  }
  if(!document.querySelector('#confetti-style')) {
    const style = document.createElement('style');
    style.id = 'confetti-style';
    style.textContent = '@keyframes fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(360deg); opacity: 0; } }';
    document.head.appendChild(style);
  }

  // ========== ЛАЙТБОКС ДЛЯ ФОТО ==========
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.querySelector('.close-lightbox');
  function openLightbox(imgSrc) {
    lightbox.style.display = 'flex';
    lightboxImg.src = imgSrc;
  }
  function closeLightbox() {
    lightbox.style.display = 'none';
  }
  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) closeLightbox();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lightbox && lightbox.style.display === 'flex') closeLightbox();
  });
  document.querySelectorAll('.clickable-photo').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(img.src);
    });
  });
});
