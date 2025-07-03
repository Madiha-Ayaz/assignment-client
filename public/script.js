let fileSystem = {}; // Used only for local operations

const editor = document.getElementById('editor');
const filenameInput = document.getElementById('filename');
const messageDiv = document.getElementById('message');
const wordCountSpan = document.getElementById('wordCount');
const charCountSpan = document.getElementById('charCount');
const lastSavedSpan = document.getElementById('lastSaved');
const fileListDiv = document.getElementById('fileList');
const fileItemsDiv = document.getElementById('fileItems');

editor.addEventListener('input', updateStats);

function updateStats() {
  const text = editor.value;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;

  wordCountSpan.textContent = words;
  charCountSpan.textContent = chars;
}

function showMessage(text, type = 'success') {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';

  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 3000);
}

function createNewFile() {
  editor.value = '';
  filenameInput.value = 'document.txt';
  updateStats();
  showMessage('New document created successfully!');
}

async function saveFile() {
  const filename = filenameInput.value.trim();
  const content = editor.value;

  if (!filename) {
    showMessage('Please enter a filename!', 'error');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/files/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content })
    });

    const data = await response.json();
    lastSavedSpan.textContent = new Date().toLocaleString();
    showMessage(data.message || 'File saved!');
  } catch (err) {
    showMessage('Failed to save file!', 'error');
  }
}

async function loadFile() {
  const filename = filenameInput.value.trim();

  if (!filename) {
    showMessage('Please enter a filename to load!', 'error');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/files/load/${filename}`);
    if (!response.ok) throw new Error('Not found');

    const data = await response.json();
    editor.value = data.content;
    updateStats();
    showMessage(`File "${filename}" loaded!`);
  } catch {
    showMessage(`File "${filename}" not found!`, 'error');
  }
}

async function updateFile() {
  const filename = filenameInput.value.trim();
  const content = editor.value;

  if (!filename) {
    showMessage('Please enter a filename to update!', 'error');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/files/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content })
    });

    if (!response.ok) throw new Error();

    const data = await response.json();
    lastSavedSpan.textContent = new Date().toLocaleString();
    showMessage(data.message);
  } catch {
    showMessage(`File "${filename}" could not be updated!`, 'error');
  }
}

async function listFiles() {
  try {
    const response = await fetch('http://localhost:3000/api/files/list');
    const data = await response.json();

    const files = data.files;
    if (files.length === 0) {
      fileItemsDiv.innerHTML = '<p style="text-align:center; color: gray;">No files found.</p>';
    } else {
      fileItemsDiv.innerHTML = files.map(file => `
        <div class="file-item">
          <div>
            <div class="file-name">${file}</div>
          </div>
          <div class="file-actions">
            <button onclick="loadSpecificFile('${file}')" class="btn btn-primary btn-sm">📂 Load</button>
            <button onclick="deleteFile('${file}')" class="btn btn-warning btn-sm">🗑️ Delete</button>
            <button onclick="updateSpecificFile('${file}')" class="btn btn-success btn-sm">✏️ Update</button>
          </div>
        </div>
      `).join('');
    }

    fileListDiv.style.display = 'block';
  } catch {
    showMessage('Failed to load file list', 'error');
  }
}

async function updateSpecificFile(filename) {
  filenameInput.value = filename;
  await loadFile();
  fileListDiv.style.display = 'none';
  // Now user can edit and click "Update" to save changes
}

async function loadSpecificFile(filename) {
  filenameInput.value = filename;
  await loadFile();
  fileListDiv.style.display = 'none';
}

async function deleteFile(filename) {
  if (!confirm(`Delete "${filename}"?`)) return;

  try {
    await fetch(`http://localhost:3000/api/files/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content: '' }) // overwrite with empty
    });
    showMessage(`"${filename}" deleted (emptied).`);
    listFiles();
  } catch {
    showMessage(`Failed to delete "${filename}"`, 'error');
  }
}

editor.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    saveFile();
  }
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    createNewFile();
  }
  if (e.ctrlKey && e.key === 'o') {
    e.preventDefault();
    loadFile();
  }
  if (e.ctrlKey && e.key === 'u') {
    e.preventDefault();
    updateFile();
  }
});

// Auto-save every 30 seconds
setInterval(() => {
  if (editor.value.trim() && filenameInput.value.trim()) {
    updateFile();
  }
}, 30000);

// Initialize
function initializeApp() {
  updateStats();
  filenameInput.value = 'document.txt';
}

initializeApp();
