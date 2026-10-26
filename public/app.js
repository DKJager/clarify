const $ = (id) => document.getElementById(id);
$('go').onclick = async () => {
  $('s').textContent = 'Checking...'; $('out').innerHTML = '';
  try {
    const r = await fetch('/api/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: $('t').value }) });
    const d = await r.json();
    if (d.error) { $('s').textContent = d.error; return; }
    $('s').textContent = d.summary.line || 'No factual statements to check here';
    for (const s of d.statements) {
      const li = document.createElement('li');
      li.textContent = `[${s.mark}] ${s.statement} (${s.judges.map((j) => j.verdict).join('/')}) `;
      for (const x of s.sources.slice(0, 3)) { const a = document.createElement('a'); a.href = x.url; a.textContent = ' source'; li.append(a); }
      $('out').append(li);
    }
  } catch (e) { $('s').textContent = e.message; }
};
