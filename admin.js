async function loadGuests(){
  const c=document.getElementById("guestsList");
  const snap=await db.collection("guests").orderBy("timestamp","desc").get();
  if(snap.empty){c.innerHTML="<p>Нет ответов</p>";return;}
  let html="<table><thead><tr><th>Имя</th><th>Придёт</th><th>Алкоголь</th><th>Дата</th></tr></thead><tbody>";
  snap.forEach(d=>{const data=d.data();html+=`<tr><td>${escapeHtml(data.name)}</td><td>${data.attending?"Да":"Нет"}</td><td>${data.alcohol?.join(", ")||"—"}</td><td>${data.timestamp?.toDate().toLocaleString()||"—"}</td></tr>`});
  c.innerHTML=html+"</tbody></table>";
}
function escapeHtml(s){return s?.replace(/[&<>]/g,function(m){return { "&":"&amp;","<":"&lt;",">":"&gt;" }[m]})||"";}
document.getElementById("refreshBtn").onclick=loadGuests; loadGuests();
