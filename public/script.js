// File system simulation (in real app, this would connect to Node.js backend)
let fileSystem = JSON.parse(localStorage.getItem('wordProcessorFiles')) || {};

const editor = document.getElementById('editor');
const filenameInput = document.getElementById('filename');
const messageDiv = document.getElementById('message');
const wordCountSpan = document.getElementById('wordCount');
const charCountSpan = document.getElementById('charCount');
const lastSavedSpan = document.getElementById('lastSaved');
const fileListDiv = document.getElementById('fileList');
const fileItemsDiv = document.getElementById('fileItems');

// Update word and character count
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

// File operations that would typically connect to Node.js server
function saveFile() {
    const filename = filenameInput.value.trim();
    const content = editor.value;

    if (!filename) {
        showMessage('Please enter a filename!', 'error');
        return;
    }

    // Download file to PC
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Always update (overwrite) in app's file list (localStorage)
    fileSystem[filename] = {
        content: content,
        lastModified: new Date().toLocaleString(),
        size: content.length
    };
    localStorage.setItem('wordProcessorFiles', JSON.stringify(fileSystem));

    lastSavedSpan.textContent = new Date().toLocaleString();
    showMessage(`File "${filename}" saved (updated) in app and downloaded to your PC!`);
}

function loadFile() {
    const filename = filenameInput.value.trim();
    
    if (!filename) {
        showMessage('Please enter a filename to load!', 'error');
        return;
    }
    
    // In real application, this would make an API call to Node.js:
    // fetch(`/api/load/${filename}`)
    //     .then(response => response.json())
    //     .then(data => {
    //         editor.value = data.content;
    //         updateStats();
    //     });
    
    if (fileSystem[filename]) {
        editor.value = fileSystem[filename].content;
        updateStats();
        showMessage(`File "${filename}" loaded successfully!`);
    } else {
        showMessage('This file does not exist. Use "New" to create a file first.', 'error');
        return;
    }
}

// Load file from user's PC
document.getElementById('fileUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        editor.value = evt.target.result;
        filenameInput.value = file.name;
        updateStats();
        showMessage(`File "${file.name}" loaded from your PC!`);
    };
    reader.readAsText(file);
});

// Update file (download updated content)
function updateFile() {
    const filename = filenameInput.value.trim();
    const content = editor.value;

    if (!filename) {
        showMessage('Please enter a filename to update!', 'error');
        return;
    }

    // Download updated file to PC
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Update in app's file list (localStorage)
    fileSystem[filename] = {
        content: content,
        lastModified: new Date().toLocaleString(),
        size: content.length
    };
    localStorage.setItem('wordProcessorFiles', JSON.stringify(fileSystem));

    lastSavedSpan.textContent = new Date().toLocaleString();
    showMessage(`File "${filename}" updated and downloaded to your PC!`);
}

// Delete file from app list (not from PC)
function deleteFile(filename) {
    if (confirm(`This will remove "${filename}" from the app list only.\n\nTo delete the file from your PC, please remove it manually from your Downloads or Desktop folder.`)) {
        delete fileSystem[filename];
        localStorage.setItem('wordProcessorFiles', JSON.stringify(fileSystem));
        showMessage(`File "${filename}" removed from app list! (Not deleted from your PC)`);
        listFiles();
    }
}

function listFiles() {
    const files = Object.keys(fileSystem);
    
    if (files.length === 0) {
        fileItemsDiv.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No files found. Create and save a document first!</p>';
    } else {
        fileItemsDiv.innerHTML = files.map(filename => {
            const file = fileSystem[filename];
            return `
                <div class="file-item">
                    <div>
                        <div class="file-name">${filename}</div>
                        <small style="color: #6c757d;">
                            ${file.size} characters • Modified: ${file.lastModified}
                        </small>
                    </div>
                    <div class="file-actions">
                        <button class="btn btn-primary btn-sm" onclick="loadSpecificFile('${filename}')">📂 Load</button>
                        <button class="btn btn-info btn-sm" onclick="updateSpecificFile('${filename}')">✏️ Update</button>
                        <button class="btn btn-warning btn-sm" onclick="deleteFile('${filename}')">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    fileListDiv.style.display = fileListDiv.style.display === 'none' ? 'block' : 'none';
}

function loadSpecificFile(filename) {
    filenameInput.value = filename;
    editor.value = fileSystem[filename].content;
    updateStats();
    showMessage(`File "${filename}" loaded successfully!`);
    fileListDiv.style.display = 'none';
}

function updateSpecificFile(filename) {
    filenameInput.value = filename;
    editor.value = fileSystem[filename].content;
    updateStats();
    showMessage(`File "${filename}" loaded for editing. Make changes and save/update!`);
    fileListDiv.style.display = 'none';
}

function deleteFile(filename) {
    if (confirm(`This will remove "${filename}" from the app list only.\n\nTo delete the file from your PC, please remove it manually from your Downloads or Desktop folder.`)) {
        delete fileSystem[filename];
        localStorage.setItem('wordProcessorFiles', JSON.stringify(fileSystem));
        showMessage(`File "${filename}" removed from app list! (Not deleted from your PC)`);
        listFiles();
    }
}

// API functions that would connect to Node.js server
async function saveFileToServer(filename, content) {
    try {
        const response = await fetch('/api/files/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename, content })
        });
        
        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            throw new Error('Failed to save file');
        }
    } catch (error) {
        console.error('Error saving file:', error);
        throw error;
    }
}

async function loadFileFromServer(filename) {
    try {
        const response = await fetch(`/api/files/load/${filename}`);
        
        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            throw new Error('File not found');
        }
    } catch (error) {
        console.error('Error loading file:', error);
        throw error;
    }
}

async function updateFileOnServer(filename, content) {
    try {
        const response = await fetch('/api/files/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename, content })
        });
        
        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            throw new Error('Failed to update file');
        }
    } catch (error) {
        console.error('Error updating file:', error);
        throw error;
    }
}

async function listFilesFromServer() {
    try {
        const response = await fetch('/api/files/list');
        
        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            throw new Error('Failed to list files');
        }
    } catch (error) {
        console.error('Error listing files:', error);
        throw error;
    }
}

// Auto-save feature (saves every 30 seconds if there's content)
setInterval(() => {
    if (editor.value.trim() && filenameInput.value.trim()) {
        const filename = filenameInput.value.trim();
        if (fileSystem[filename] && fileSystem[filename].content !== editor.value) {
            updateFile();
        }
    }
}, 30000);

// Keyboard shortcuts
editor.addEventListener('keydown', (e) => {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveFile();
    }
    // Ctrl+N for new file
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        createNewFile();
    }
    // Ctrl+O to open/load
    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        loadFile();
    }
    // Ctrl+U to update
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        updateFile();
    }
});

// Initialize application
function initializeApp() {
    updateStats();
    
    // Load a demo file if it's the first visit
    if (Object.keys(fileSystem).length === 0) {
        fileSystem['welcome.txt'] = {
            content: `Welcome to Word Processor!

This is a sample document to get you started. Here are the features:

📝 Writing Features:
- Real-time word and character counting
- Auto-save every 30 seconds
- Keyboard shortcuts (Ctrl+S, Ctrl+N, Ctrl+O, Ctrl+U)

💾 File Management:
- Save documents with custom names
- Load existing documents
- Update existing documents
- List all saved documents
- Delete unwanted files

🎨 Modern Interface:
- Beautiful gradient design
- Responsive layout
- Smooth animations
- User-friendly notifications

🔧 Technical Features:
- HTML5 structure
- CSS3 styling with gradients and animations
- JavaScript for interactivity
- Node.js backend integration ready
- File read/write/update operations

Instructions:
1. Type your content in the text area
2. Enter a filename and click "Save"
3. Use "Load" to open existing files
4. Use "Update" to modify existing files
5. Click "List Files" to see all saved documents

Start writing your masterpiece!`,
            lastModified: new Date().toLocaleString(),
            size: 0
        };
        fileSystem['welcome.txt'].size = fileSystem['welcome.txt'].content.length;
        localStorage.setItem('wordProcessorFiles', JSON.stringify(fileSystem));
    }
}

// Start the application
initializeApp();