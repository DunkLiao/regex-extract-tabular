(() => {
  const $ = (selector) => document.querySelector(selector);
  const rawInput = $('#rawInput'), patternInput = $('#patternInput'), workerUrl = new URL('./regex-worker.js', location.href);
  const { filterPresets } = window.RegexPresetCatalog;
  const state = { result: { isValid: true, columns: [], rows: [], totalMatches: 0, executionTimeMs: 0 }, aliases: new Map(), hidden: new Set(), sortKey: '', sortDirection: 1, page: 1, filteredRows: [], worker: null, timer: 0, requestId: 0, scrollFrame: 0 };
  const samples = {
    nginx: { pattern: '^(?<ip>\\S+) \\S+ \\S+ \\[(?<time>[^\\]]+)\\] "(?<method>\\S+) (?<path>\\S+) [^\\"]+" (?<status>\\d{3}) (?<bytes>\\d+)', flags: ['g','m'], text: '203.0.113.10 - - [15/Oct/2026:10:31:08 +0800] "GET /dashboard HTTP/1.1" 200 1842\n198.51.100.22 - - [15/Oct/2026:10:32:19 +0800] "POST /api/login HTTP/1.1" 401 312\n203.0.113.10 - - [15/Oct/2026:10:35:43 +0800] "GET /assets/app.css HTTP/1.1" 200 9231' },
    orders: { pattern: '訂單：(?<order>\\w+)\s+客戶：(?<customer>[^，\\n]+)，金額：(?<amount>[\\d,.]+)', flags: ['g','m'], text: '訂單：ORD-2081 客戶：陳怡君，金額：2,450.00\n訂單：ORD-2082 客戶：王柏翰，金額：890.50\n訂單：ORD-2083 客戶：林美玲，金額：12,000.00' },
    contacts: { pattern: '(?<name>[^,\\n]+),(?<email>[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,})(?:,(?<phone>[+\\d -]+))?', flags: ['g','m'], text: 'Avery Chen,avery@example.com,+886 912 345 678\nMorgan Lee,morgan.lee@example.org\nJordan Wu,jordan@example.net,+1 415 555 0134' },
    commits: { pattern: '^(?<hash>[0-9a-f]{7,40}) (?<date>\\d{4}-\\d{2}-\\d{2}) (?<author>[^|]+)\\|(?<subject>.+)$', flags: ['g','m'], text: 'a41f2c9 2026-10-14 Alex Chen|Add batch export options\n7b09d11 2026-10-13 Sam Wu|Fix empty capture handling\ncf318ea 2026-10-12 Alex Chen|Improve table sorting and filtering' }
  };
  renderPresetMenu();

  function renderPresetMenu(query = '') {
    const groups = new Map();
    for (const preset of filterPresets(query)) {
      if (!groups.has(preset.category)) groups.set(preset.category, []);
      groups.get(preset.category).push(preset);
    }
    $('#presetResults').innerHTML = groups.size
      ? [...groups].map(([category, items]) => `<details class="preset-group" ${query ? 'open' : ''}><summary>${escapeHtml(category)}<span>${items.length}</span></summary><div class="preset-group-items">${items.map(({ name, description, pattern }) => `<button type="button" class="preset-item" data-pattern="${escapeAttr(pattern)}" title="${escapeAttr(description)}"><strong>${escapeHtml(name)}</strong><small>${escapeHtml(description)}</small><code>${escapeHtml(pattern)}</code></button>`).join('')}</div></details>`).join('')
      : '<p class="preset-empty">找不到符合的範本，試試其他關鍵字。</p>';
  }
  function createWorker() {
    if (state.worker) state.worker.terminate();
    state.worker = new Worker(workerUrl);
    state.worker.onmessage = ({ data }) => {
      if (data.id !== state.requestId) return;
      clearTimeout(state.timer);
      const result = data.result;
      state.result = result;
      state.aliases.clear(); state.hidden.clear(); state.sortKey = ''; state.page = 1;
      if (result.isValid) {
        for (const column of result.columns) state.aliases.set(column.key, column.title);
        state.filteredRows = result.rows.slice();
        setStatus('valid', result.capped ? '已達 50,000 筆上限' : '正則有效');
        $('#patternError').textContent = '';
        $('#parseMeta').textContent = `解析 ${formatMs(result.executionTimeMs)}`;
      } else {
        state.filteredRows = [];
        setStatus('error', '正則無效');
        $('#patternError').textContent = result.errorMessage;
        $('#parseMeta').textContent = '解析失敗';
      }
      applyFilter(); renderAll();
    };
    state.worker.onerror = (event) => { clearTimeout(state.timer); setStatus('error', '解析器發生錯誤'); $('#patternError').textContent = event.message || 'Worker 無法解析此正則。'; };
  }
  function scheduleParse() {
    clearTimeout(state.timer);
    if (state.worker) { state.worker.terminate(); state.worker = null; }
    setStatus('pending', '等待解析…');
    state.timer = setTimeout(runParse, 150);
  }
  function runParse() {
    const text = rawInput.value, pattern = patternInput.value;
    updateTextStats();
    if (!pattern) {
      state.requestId++;
      state.result = { isValid: true, columns: [], rows: [], totalMatches: 0, executionTimeMs: 0 };
      state.filteredRows = []; state.aliases.clear(); setStatus('', '準備就緒'); $('#patternError').textContent = ''; $('#parseMeta').textContent = '等待正則與文字'; renderAll(); return;
    }
    const flags = [...document.querySelectorAll('[data-flag]:checked')].map((input) => input.dataset.flag).join('');
    const id = ++state.requestId;
    try {
      if (!state.worker) createWorker();
      state.worker.postMessage({ id, text, pattern, flags, options: { trimWhitespace: $('#trimOption').checked, ignoreEmptyMatches: $('#emptyOption').checked, placeholder: $('#placeholderInput').value } });
    } catch (error) {
      if (state.worker) state.worker.terminate();
      state.worker = null;
      const detail = location.protocol === 'file:'
        ? '瀏覽器不允許 file:// 頁面啟動 Web Worker。請在專案資料夾執行「py -m http.server 8000」，再開啟 http://localhost:8000。'
        : `請確認此頁面由 localhost 或 HTTPS 提供。(${error.message})`;
      state.result = { isValid: false, columns: [], rows: [], totalMatches: 0, executionTimeMs: 0, errorMessage: detail };
      state.filteredRows = [];
      setStatus('error', '無法啟動解析器');
      $('#patternError').textContent = detail;
      $('#parseMeta').textContent = '解析器未啟動';
      renderAll();
      return;
    }
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      if (id !== state.requestId) return;
      state.worker.terminate(); state.worker = null;
      state.result = { isValid: false, columns: [], rows: [], totalMatches: 0, executionTimeMs: 500, errorMessage: '解析超過 500ms，已中止此次運算。請簡化正則或縮小輸入文字。' };
      state.filteredRows = []; setStatus('error', '解析逾時'); $('#patternError').textContent = state.result.errorMessage; $('#parseMeta').textContent = '運算已中止'; renderAll();
    }, 500);
    setStatus('pending', '解析中…');
  }
  function setStatus(kind, message) { const el = $('#status'); el.className = `regex-status ${kind}`; el.innerHTML = `<span class="status-dot"></span><span>${escapeHtml(message)}</span>`; }
  function updateTextStats() { const text = rawInput.value; const lines = text ? text.split(/\r\n|\r|\n/).length : 0; $('#textStats').textContent = `${text.length.toLocaleString()} 字元 · ${lines.toLocaleString()} 行`; }
  function applyFilter() {
    const term = $('#quickFilter').value.trim().toLocaleLowerCase();
    let rows = state.result.rows;
    if (term) rows = rows.filter((row) => Object.entries(row).some(([key, value]) => !key.startsWith('__') && String(value ?? '').toLocaleLowerCase().includes(term)) || String(row.__fullMatch ?? '').toLocaleLowerCase().includes(term));
    if (state.sortKey) rows = rows.slice().sort((a,b) => String(a[state.sortKey] ?? '').localeCompare(String(b[state.sortKey] ?? ''), undefined, { numeric:true, sensitivity:'base' }) * state.sortDirection);
    state.filteredRows = rows;
    const virtual = state.result.rows.length > 20000;
    if (!virtual) state.page = Math.min(state.page, Math.max(1, Math.ceil(rows.length / pageSize())));
  }
  function pageSize() { return Number($('#pageSize').value); }
  function visibleColumns() { return state.result.columns.filter((column) => !state.hidden.has(column.key)); }
  function renderAll() { renderTable(); renderColumnControls(); renderExports(); $('#matchCount').textContent = state.result.totalMatches.toLocaleString(); $('#resultSummary').textContent = `${state.filteredRows.length.toLocaleString()} 筆顯示`; }
  function renderTable() {
    const cols = visibleColumns(), virtual = state.result.rows.length > 20000, rows = state.filteredRows;
    const thead = $('#tableHead'), tbody = $('#tableBody'), wrap = $('#tableWrap');
    thead.innerHTML = `<tr><th class="row-number">#</th>${cols.map((c) => `<th><button type="button" data-sort="${escapeAttr(c.key)}">${escapeHtml(state.aliases.get(c.key) ?? c.title)} ${state.sortKey === c.key ? (state.sortDirection === 1 ? '↑' : '↓') : '↕'}</button></th>`).join('')}</tr>`;
    const start = virtual ? Math.max(0, Math.floor(wrap.scrollTop / 36) - 4) : (state.page - 1) * pageSize();
    const count = virtual ? Math.ceil((wrap.clientHeight || 260) / 36) + 9 : pageSize();
    const end = Math.min(rows.length, start + count), shown = rows.slice(start, end), colSpan = cols.length + 1;
    const topSpace = virtual ? `<tr class="spacer-row"><td colspan="${colSpan}" style="height:${start * 36}px;padding:0;border:0"></td></tr>` : '';
    const bottomSpace = virtual ? `<tr class="spacer-row"><td colspan="${colSpan}" style="height:${Math.max(0, (rows.length-end)*36)}px;padding:0;border:0"></td></tr>` : '';
    tbody.innerHTML = topSpace + shown.map((row, index) => `<tr><td class="row-number">${(virtual ? start : (state.page-1)*pageSize()) + index + 1}</td>${cols.map((c) => `<td title="${escapeAttr(row[c.key] ?? '')}">${escapeHtml(row[c.key] ?? '')}</td>`).join('')}</tr>`).join('') + bottomSpace;
    const empty = state.result.rows.length === 0;
    $('#emptyState').style.display = empty ? 'flex' : 'none';
    if (empty) { $('#emptyState strong').textContent = state.result.isValid ? '尚無擷取結果' : '無法解析正則'; $('#emptyState span').textContent = state.result.errorMessage || '貼上文字並輸入正則表達式，結果會即時顯示。'; }
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize()));
    $('#pageInfo').textContent = virtual ? `虛擬列表 · ${rows.length.toLocaleString()} 筆` : `${rows.length.toLocaleString()} 筆結果`;
    $('#pageLabel').textContent = virtual ? `${start+1}–${end} / ${rows.length}` : `${state.page} / ${totalPages}`;
    $('#prevPage').disabled = virtual || state.page <= 1; $('#nextPage').disabled = virtual || state.page >= totalPages;
  }
  function renderColumnControls() {
    const host = $('#columnControls');
    host.innerHTML = state.result.columns.map((column) => `<label class="column-item"><input type="checkbox" data-visible="${escapeAttr(column.key)}" ${state.hidden.has(column.key)?'':'checked'}><input type="text" data-alias="${escapeAttr(column.key)}" value="${escapeAttr(state.aliases.get(column.key) ?? column.title)}" aria-label="欄位名稱"></label>`).join('') || '<span>尚無欄位</span>';
  }
  function exportRows() {
    const cols = visibleColumns();
    const includeInternal = $('#internalOption').checked;
    const allCols = cols.map((column) => ({ key:column.key, title:state.aliases.get(column.key) ?? column.title }));
    if (includeInternal) allCols.unshift({key:'__rowId',title:'Row ID'});
    if ($('#fullMatchOption').checked) allCols.push({key:'__fullMatch',title:'Full Match'});
    return { cols:allCols, rows:state.filteredRows };
  }
  function outputText() {
    const {cols,rows}=exportRows(), format=$('#exportFormat').value;
    if (format==='json') return JSON.stringify(rows.map(row=>Object.fromEntries(cols.map(col=>[col.title,row[col.key] ?? '']))), $('#minifiedOption').checked ? undefined : 2);
    if (format==='md') { const cell=(value)=>String(value??'').replace(/\r\n|\r|\n/g,'<br>').replace(/\|/g,'\\|'); return [mdRow(cols.map(c=>c.title)),mdRow(cols.map(()=> '---')),...rows.map(r=>mdRow(cols.map(c=>cell(r[c.key]))))].join('\n'); }
    if (format==='sql') { const table=quoteIdentifier($('#tableName').value.trim()||'records'); const names=cols.map(c=>quoteIdentifier(c.title)).join(', '); return rows.map(row=>`INSERT INTO ${table} (${names}) VALUES (${cols.map(c=>sqlString(row[c.key]??'')).join(', ')});`).join('\n'); }
    const delimiter=format==='tsv'?($('#delimiterInput').value||'\t'):($('#delimiterInput').value||',');
    return [cols.map(c=>quoteField(c.title,delimiter)).join(delimiter),...rows.map(row=>cols.map(c=>quoteField(row[c.key]??'',delimiter)).join(delimiter))].join('\r\n');
  }
  function mdRow(values) { return `| ${values.join(' | ')} |`; }
  function quoteField(value, delimiter) { const text=String(value??''); return /["\r\n]/.test(text)||text.includes(delimiter)?`"${text.replace(/"/g,'""')}"`:text; }
  function quoteIdentifier(value) { return `"${String(value).replace(/"/g,'""')}"`; }
  function sqlString(value) { return `'${String(value??'').replace(/'/g,"''")}'`; }
  function renderExports() {
    const format=$('#exportFormat').value;
    $('#delimiterControl').style.display=['csv','tsv'].includes(format)?'inline-flex':'none';
    $('#delimiterInput').value=format==='tsv'&&$('#delimiterInput').value===','?'\t':$('#delimiterInput').value;
    $('#minifiedControl').style.display=format==='json'?'inline-flex':'none';
    $('#internalControl').style.display=format==='json'?'inline-flex':'none';
    $('#fullMatchControl').style.display=format==='json'?'inline-flex':'none';
    $('#sqlControl').style.display=format==='sql'?'inline-flex':'none';
    if (!$('#previewCode').hidden) $('#previewCode').textContent=outputText();
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
  function escapeAttr(value) { return escapeHtml(value); }
  function formatMs(value) { return `${value < 10 ? value.toFixed(2) : value.toFixed(1)} ms`; }
  let toastTimer;
  function toast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),1500); }
  async function copyOutput() { const text=outputText(); try { await navigator.clipboard.writeText(text); toast('已複製到剪貼簿'); } catch { const area=document.createElement('textarea'); area.value=text; document.body.append(area); area.select(); const ok=document.execCommand('copy'); area.remove(); toast(ok?'已複製到剪貼簿':'複製失敗，請手動複製預覽內容'); } }
  async function downloadOutput() {
    const format=$('#exportFormat').value, ext={csv:'csv',tsv:'tsv',json:'json',md:'md',sql:'sql'}[format];
    const fileName=`regex-export-${new Date().toISOString().slice(0,10)}.${ext}`, content=outputText();
    try {
      if (window.__TAURI__?.core?.invoke) {
        const saved=await window.__TAURI__.core.invoke('save_export',{fileName,content,format});
        if (saved) toast('檔案已儲存');
        return;
      }
      const mime=format==='json'?'application/json':format==='sql'?'text/sql':'text/plain';
      const blob=new Blob([content],{type:`${mime};charset=utf-8`}), url=URL.createObjectURL(blob), link=document.createElement('a');
      link.href=url; link.download=fileName; document.body.append(link); link.click(); link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000); toast('下載已開始');
    } catch (error) {
      toast(`儲存失敗：${error?.message || '請再試一次'}`);
    }
  }

  rawInput.addEventListener('input',()=>{updateTextStats();scheduleParse();});
  patternInput.addEventListener('input',scheduleParse);
  document.querySelectorAll('[data-flag]').forEach(input=>input.addEventListener('change',scheduleParse));
  ['trimOption','emptyOption','placeholderInput'].forEach(id=>$('#'+id).addEventListener('input',scheduleParse));
  $('#sampleSelect').addEventListener('change',event=>{const sample=samples[event.target.value];if(!sample)return;rawInput.value=sample.text;patternInput.value=sample.pattern;document.querySelectorAll('[data-flag]').forEach(input=>{if(input.dataset.flag==='g')return;input.checked=sample.flags.includes(input.dataset.flag);});$('#quickFilter').value='';updateTextStats();scheduleParse();event.target.value='';});
  $('#clearButton').addEventListener('click',()=>{rawInput.value='';patternInput.value='';$('#quickFilter').value='';updateTextStats();scheduleParse();});
  $('#presetSearch').addEventListener('input',event=>renderPresetMenu(event.currentTarget.value));
  $('#presetMenu').addEventListener('click',event=>{const button=event.target.closest('[data-pattern]');if(!button)return;patternInput.value=button.dataset.pattern;$('#presetMenu').closest('details').open=false;$('#presetSearch').value='';renderPresetMenu();scheduleParse();});
  $('#themeButton').addEventListener('click',()=>{document.body.classList.toggle('light');$('#themeButton').textContent=document.body.classList.contains('light')?'☾':'◐';});
  $('#quickFilter').addEventListener('input',()=>{state.page=1;applyFilter();renderTable();$('#resultSummary').textContent=`${state.filteredRows.length.toLocaleString()} 筆顯示`;renderExports();});
  $('#pageSize').addEventListener('change',()=>{state.page=1;renderTable();});
  $('#prevPage').addEventListener('click',()=>{state.page=Math.max(1,state.page-1);renderTable();});
  $('#nextPage').addEventListener('click',()=>{state.page++;renderTable();});
  $('#tableHead').addEventListener('click',event=>{const button=event.target.closest('[data-sort]');if(!button)return;const key=button.dataset.sort;state.sortDirection=state.sortKey===key?-state.sortDirection:1;state.sortKey=key;applyFilter();renderTable();});
  $('#columnControls').addEventListener('change',event=>{const key=event.target.dataset.visible;if(!key)return;if(event.target.checked)state.hidden.delete(key);else state.hidden.add(key);renderTable();renderExports();});
  $('#columnControls').addEventListener('input',event=>{const key=event.target.dataset.alias;if(!key)return;state.aliases.set(key,event.target.value);renderTable();renderExports();});
  $('#columnsButton').addEventListener('click',()=>{$('#columnMenu').open=!$('#columnMenu').open;$('#columnMenu').scrollIntoView({behavior:'smooth',block:'nearest'});});
  $('#exportFormat').addEventListener('change',()=>{renderExports();});
  ['delimiterInput','minifiedOption','internalOption','fullMatchOption','tableName'].forEach(id=>$('#'+id).addEventListener('input',renderExports));
  $('#copyButton').addEventListener('click',copyOutput);$('#downloadButton').addEventListener('click',downloadOutput);
  $('#previewToggle').addEventListener('click',()=>{const preview=$('#previewCode'), open=preview.hidden;preview.hidden=!open;$('#previewToggle').setAttribute('aria-expanded',String(open));$('#previewChevron').textContent=open?'−':'＋';if(open)preview.textContent=outputText();});
  $('#tableWrap').addEventListener('scroll',()=>{if(state.result.rows.length<=20000||state.scrollFrame)return;state.scrollFrame=requestAnimationFrame(()=>{state.scrollFrame=0;renderTable();});},{passive:true});
  if (matchMedia('(prefers-color-scheme: light)').matches) { document.body.classList.add('light');$('#themeButton').textContent='☾'; }
  updateTextStats();renderAll();
})();

