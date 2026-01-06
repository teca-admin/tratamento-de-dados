const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const uploadArea = document.getElementById('uploadArea') as HTMLDivElement;
const filesList = document.getElementById('filesList') as HTMLDivElement;
const filesGrid = document.getElementById('filesGrid') as HTMLDivElement;
const filesCount = document.getElementById('filesCount') as HTMLSpanElement;
const counterBadge = document.getElementById('counterBadge') as HTMLDivElement;
const btnProcess = document.getElementById('btnProcess') as HTMLButtonElement;
const btnCancel = document.getElementById('btnCancel') as HTMLButtonElement;
const btnNewUpload = document.getElementById('btnNewUpload') as HTMLButtonElement;
const btnContinue = document.getElementById('btnContinue') as HTMLButtonElement;
const btnChoose = document.getElementById('btnChoose') as HTMLLabelElement;
const processingScreen = document.getElementById('processingScreen') as HTMLElement;
const processingTitle = document.getElementById('processingTitle') as HTMLElement;
const processingSubtitle = document.getElementById('processingSubtitle') as HTMLElement;
const resultsScreen = document.getElementById('resultsScreen') as HTMLElement;
const resultsTitle = document.getElementById('resultsTitle') as HTMLElement;
const resultsSubtitle = document.getElementById('resultsSubtitle') as HTMLElement;
const resultsGrid = document.getElementById('resultsGrid') as HTMLDivElement;
const typeScreen = document.getElementById('typeScreen') as HTMLElement;
const uploadScreen = document.getElementById('uploadScreen') as HTMLElement;

let selectedFiles: File[] = [];
let processedFile: { url: string; blob: Blob; fileName: string } | null = null;
let objectUrl: string | null = null;
let selectedReportType = 'recebido';

const URLs: Record<string, string> = {
  recebido: 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/processar-8-arquivos',
  entrega: 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/processar-8-arquivos',
  carga: 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/processar-8-arquivos',
  exportacao: 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/processar-8-arquivos',
  'exportacao-entrega': 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/processar-8-arquivos',
  liberacao: 'https://teca-admin-n8n.ly7t0m.easypanel.host/webhook/liberação'
};

// Type selection
btnContinue?.addEventListener('click', () => {
  const checkedInput = document.querySelector('input[name="reportType"]:checked') as HTMLInputElement;
  selectedReportType = checkedInput?.value || 'recebido';
  showUpload();
});

// Upload events
fileInput?.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []).slice(0, 8 - selectedFiles.length);
  selectedFiles = [...selectedFiles, ...files];
  target.value = '';
  renderFilesList();
});

uploadArea?.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('hover');
});

uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('hover'));

uploadArea?.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('hover');
  const files = Array.from(e.dataTransfer?.files || []).slice(0, 8 - selectedFiles.length);
  selectedFiles = [...selectedFiles, ...files];
  renderFilesList();
});

uploadArea?.addEventListener('click', (e) => {
  if (e.target !== fileInput && !btnChoose.contains(e.target as Node) && e.target !== btnChoose) {
    fileInput.click();
  }
});

btnCancel?.addEventListener('click', () => {
  selectedFiles = [];
  fileInput.value = '';
  renderFilesList();
  showTypeSelection();
});

btnProcess?.addEventListener('click', startProcessing);

btnNewUpload?.addEventListener('click', () => {
  selectedFiles = [];
  processedFile = null;
  fileInput.value = '';
  renderFilesList();
  showTypeSelection();
});

function renderFilesList() {
  const hasFiles = selectedFiles.length > 0;
  if (filesList) filesList.style.display = hasFiles ? 'block' : 'none';
  if (btnProcess) btnProcess.disabled = !hasFiles;
  if (filesCount) filesCount.textContent = `${selectedFiles.length} arquivo${selectedFiles.length !== 1 ? 's' : ''} selecionado${selectedFiles.length !== 1 ? 's' : ''}`;
  if (counterBadge) counterBadge.textContent = `${selectedFiles.length} / 8`;

  if (filesGrid) {
    filesGrid.innerHTML = '';
    selectedFiles.forEach((file, idx) => {
      const card = document.createElement('div');
      card.className = 'file-card';

      const thumb = document.createElement('div');
      thumb.className = 'file-thumb';
      thumb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';

      const meta = document.createElement('div');
      meta.className = 'file-meta';

      const name = document.createElement('div');
      name.className = 'file-name';
      name.title = file.name;
      name.textContent = file.name;

      const size = document.createElement('div');
      size.className = 'file-size';
      size.textContent = formatBytes(file.size);

      meta.appendChild(name);
      meta.appendChild(size);

      const actions = document.createElement('div');
      actions.className = 'file-actions';
      const btnRemove = document.createElement('button');
      btnRemove.type = 'button';
      btnRemove.title = 'Remover arquivo';
      btnRemove.className = 'icon-btn danger';
      btnRemove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="color:var(--danger)"><path d="M6 18L18 6M6 6l12 12"/></svg>';
      btnRemove.addEventListener('click', () => {
        selectedFiles.splice(idx, 1);
        renderFilesList();
      });
      actions.appendChild(btnRemove);

      card.appendChild(thumb);
      card.appendChild(meta);
      card.appendChild(actions);

      filesGrid.appendChild(card);
    });
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(i ? 2 : 0) + ' ' + sizes[i];
}

async function startProcessing() {
  showProcessing();
  if (processingTitle) processingTitle.textContent = 'Enviando arquivos para processamento';
  if (processingSubtitle) processingSubtitle.textContent = 'Aguarde — enviando os arquivos para o serviço.';

  const fd = new FormData();
  selectedFiles.forEach((f, i) => fd.append(`file${i + 1}`, f));
  fd.append('reportType', selectedReportType);

  const webhookURL = URLs[selectedReportType];

  try {
    const resp = await fetch(webhookURL, { method: 'POST', body: fd });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(text || `Resposta do servidor: ${resp.status}`);
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    objectUrl = url;

    const fileName = 'arquivo_processado.xlsx';

    processedFile = {
      url,
      blob,
      fileName
    };

    if (processingTitle) processingTitle.textContent = 'Concluído';
    if (processingSubtitle) processingSubtitle.textContent = 'Arquivo recebido com sucesso.';
    setTimeout(() => showResults(), 450);

  } catch (err: any) {
    console.error('Erro no envio/recebimento:', err);
    if (processingTitle) processingTitle.textContent = 'Erro';
    if (processingSubtitle) processingSubtitle.textContent = 'Ocorreu um erro no processamento.';
    alert('Erro ao processar: ' + (err.message || err));
    showUpload();
  }
}

function showTypeSelection() {
  if (typeScreen) typeScreen.style.display = 'block';
  if (uploadScreen) uploadScreen.style.display = 'none';
  if (processingScreen) processingScreen.style.display = 'none';
  if (resultsScreen) resultsScreen.style.display = 'none';
}

function showUpload() {
  if (typeScreen) typeScreen.style.display = 'none';
  if (uploadScreen) uploadScreen.style.display = 'block';
  if (processingScreen) processingScreen.style.display = 'none';
  if (resultsScreen) resultsScreen.style.display = 'none';
}

function showProcessing() {
  if (typeScreen) typeScreen.style.display = 'none';
  if (uploadScreen) uploadScreen.style.display = 'none';
  if (processingScreen) processingScreen.style.display = 'block';
  if (resultsScreen) resultsScreen.style.display = 'none';
}

function showResults() {
  if (typeScreen) typeScreen.style.display = 'none';
  if (uploadScreen) uploadScreen.style.display = 'none';
  if (processingScreen) processingScreen.style.display = 'none';
  if (resultsScreen) resultsScreen.style.display = 'block';
  renderResults();
}

function renderResults() {
  if (!resultsGrid) return;
  resultsGrid.innerHTML = '';

  if (!processedFile) {
    if (resultsTitle) resultsTitle.textContent = 'Nenhum arquivo retornado';
    if (resultsSubtitle) resultsSubtitle.textContent = 'Não foram encontrados arquivos após o processamento.';
    return;
  }

  if (resultsTitle) resultsTitle.textContent = 'Processamento concluído';
  if (resultsSubtitle) resultsSubtitle.textContent = 'Arquivo disponível para download';

  const item = document.createElement('div');
  item.className = 'result-item';

  const meta = document.createElement('div');
  meta.className = 'result-meta';

  const thumb = document.createElement('div');
  thumb.className = 'result-thumb';
  thumb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="color:var(--primary)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';

  const details = document.createElement('div');
  details.style.minWidth = '0';
  const name = document.createElement('div');
  name.className = 'result-name';
  name.title = processedFile.fileName;
  name.textContent = processedFile.fileName;
  const size = document.createElement('div');
  size.className = 'result-size';
  size.textContent = formatBytes(processedFile.blob.size);

  details.appendChild(name);
  details.appendChild(size);

  meta.appendChild(thumb);
  meta.appendChild(details);

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '8px';

  const dlBtn = document.createElement('button');
  dlBtn.className = 'btn primary';
  dlBtn.type = 'button';
  dlBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="color:currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg><span class="btn-label">Download</span>';
  dlBtn.addEventListener('click', () => {
    if (processedFile) {
      const a = document.createElement('a');
      a.href = processedFile.url;
      a.download = processedFile.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });
  actions.appendChild(dlBtn);

  item.appendChild(meta);
  item.appendChild(actions);

  resultsGrid.appendChild(item);
}

function cleanupProcessed() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
}

window.addEventListener('beforeunload', () => cleanupProcessed());

renderFilesList();
showTypeSelection();
