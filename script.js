// ========== ТАЙМЕР ==========
const weddingDate = new Date("August 28, 2026 18:00:00").getTime();
function updateCountdown() {
  const now = new Date().getTime();
  const distance = weddingDate - now;
  const totalDays = Math.floor(distance / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  const hours = Math.floor((distance % (86400000)) / 3600000);
  const minutes = Math.floor((distance % 3600000) / 60000);
  const seconds = Math.floor((distance % 60000) / 1000);
  
  document.getElementById("weeks").innerText = weeks < 10 ? "0" + weeks : weeks;
  document.getElementById("days").innerText = days < 10 ? "0" + days : days;
  document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
  document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
  document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ========== КАРТА ==========
function initMap() {
  if (typeof ymaps === 'undefined') return;
  ymaps.ready(() => {
    const myMap = new ymaps.Map('map', { center: [55.865728, 49.108624], zoom: 17, controls: ['zoomControl'] });
    myMap.geoObjects.add(new ymaps.Placemark([55.865728, 49.108624], { balloonContent: "Банкетный зал 'Чайковский', ул. Деметьева, 51, Казань" }));
  });
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', initMap) : initMap();

// ========== ПРЕДВАРИТЕЛЬНЫЙ ОТВЕТ И ПОКАЗ АНКЕТЫ ==========
let currentGuestId = null;
let confettiFired = false; // флаг, чтобы конфетти были только один раз

const preForm = document.getElementById('preRsvpForm');
const preMsg = document.getElementById('preMsg');
const questionnaireBlock = document.getElementById('questionnaireBlock');
const guestNameInput = document.getElementById('guestName');
const attendingSelect = document.getElementById('preAttending');

// Функция конфетти
function fireConfettiOnce() {
  if (confettiFired) return;
  confettiFired = true;
  const colors = ['#FFD700', '#FF69B4', '#FFFFFF', '#9B6B5C', '#C5E0B4'];
  for (let i = 0; i < 180; i++) {
    const confetto = document.createElement('div');
    confetto.style.position = 'fixed';
    confetto.style.width = Math.random() * 10 + 5 + 'px';
    confetto.style.height = Math.random() * 10 + 5 + 'px';
    confetto.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetto.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetto.style.left = Math.random() * window.innerWidth + 'px';
    confetto.style.top = '-20px';
    confetto.style.zIndex = '9999';
    confetto.style.pointerEvents = 'none';
    confetto.style.opacity = Math.random() * 0.8 + 0.3;
    confetto.style.animation = `fall ${Math.random() * 2 + 2}s linear forwards`;
    document.body.appendChild(confetto);
    setTimeout(() => confetto.remove(), 3000);
  }
}

// Добавляем анимацию падения, если её ещё нет
if (!document.querySelector('#confetti-style')) {
  const style = document.createElement('style');
  style.id = 'confetti-style';
  style.textContent = `@keyframes fall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(360deg); opacity: 0; } }`;
  document.head.appendChild(style);
}

preForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const guestName = guestNameInput.value.trim();
  const attending = attendingSelect.value;
  if (!guestName || !attending) {
    preMsg.innerText = 'Пожалуйста, укажите имя и выберите статус.';
    preMsg.style.color = 'red';
    return;
  }
  const attendingBool = (attending === 'yes');
  const data = {
    name: guestName,
    attending: attendingBool,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    const docRef = await db.collection("guests").add(data);
    currentGuestId = docRef.id;
    preMsg.innerText = 'Спасибо, ' + guestName + '! Ваш ответ сохранён.';
    preMsg.style.color = 'green';
    
    if (attendingBool) {
      questionnaireBlock.style.display = 'block';
      fireConfettiOnce(); // конфетти только при положительном ответе
    } else {
      questionnaireBlock.style.display = 'none';
    }
    // Блокируем повторную отправку предварительной формы
    guestNameInput.disabled = true;
    attendingSelect.disabled = true;
  } catch(err) {
    preMsg.innerText = 'Ошибка: ' + err.message;
    preMsg.style.color = 'red';
  }
});

// ========== ОТПРАВКА АНКЕТЫ ==========
const fullForm = document.getElementById('fullQuestionnaire');
const qMsg = document.getElementById('questionnaireMsg');

fullForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentGuestId) {
    qMsg.innerText = 'Ошибка: сначала подтвердите участие.';
    qMsg.style.color = 'red';
    return;
  }
  const formData = {
    transfer: fullForm.transfer.value,
    alcohol: fullForm.alcohol.value,
    accommodation: fullForm.accommodation.value,
    nextDay: fullForm.nextDay.value,
    questionnaireTimestamp: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    await db.collection("guests").doc(currentGuestId).update(formData);
    qMsg.innerText = 'Анкета отправлена! Спасибо.';
    qMsg.style.color = 'green';
    fullForm.reset();
    // Опционально: скрыть анкету после отправки
    // questionnaireBlock.style.display = 'none';
  } catch(err) {
    qMsg.innerText = 'Ошибка: ' + err.message;
    qMsg.style.color = 'red';
  }
});

// ========== КАЛЕНДАРЬ ==========
document.getElementById('addToCalendarBtn').addEventListener('click', () => {
  const start = new Date(2026, 7, 28, 18, 0, 0);
  const end = new Date(2026, 7, 28, 23, 0, 0);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${Date.now()}@wedding\nDTSTAMP:${fmt(new Date())}\nDTSTART:${fmt(start)}\nDTEND:${fmt(end)}\nSUMMARY:Свадьба Алексея и Регины\nDESCRIPTION:Гостевой дом "Чайковский", ул. Деметьева 51, Казань\nLOCATION:ул. Деметьева 51, Казань\nEND:VEVENT\nEND:VCALENDAR`;
  const blob = new Blob([ics], { type: 'text/calendar' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'wedding.ics';
  link.click();
  URL.revokeObjectURL(link.href);
});

// ========== МУЗЫКА ==========
const audio = document.getElementById('weddingAudio');
const musicBtn = document.getElementById('playMusicBtn');
let playing = false;
musicBtn.onclick = () => {
  if (playing) {
    audio.pause();
    musicBtn.innerHTML = '<i class="fas fa-music"></i> Включить музыку';
  } else {
    audio.play().catch(e => alert('Ошибка: ' + e));
    musicBtn.innerHTML = '<i class="fas fa-stop"></i> Выключить музыку';
  }
  playing = !playing;
};