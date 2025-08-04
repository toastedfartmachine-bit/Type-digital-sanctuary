let db;
let currentId = null;
let creationTime = null;

window.addEventListener('DOMContentLoaded', async () => {
  db = await idb.openDB('MyFilesDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
      }
    }
  });

  const fileList = document.getElementById('fileList');
  const newFileBtn = document.getElementById('newFileBtn');
  const saveBtn = document.getElementById('saveBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const fileName = document.getElementById('fileName');
  const fileContent = document.getElementById('fileContent');
  const status = document.getElementById('status');

  newFileBtn.addEventListener('click', () => {
    currentId = null;
    creationTime = null;
    fileName.value = '';
    fileContent.value = '';
    updateCount();
  });

  saveBtn.addEventListener('click', async () => {
    const name = fileName.value.trim() || 'untitled.txt';
    const content = fileContent.value;
    const now = new Date().toISOString();

    if (currentId) {
      await db.put('files', {
        id: currentId,
        name,
        content,
        created: creationTime,
        modified: now
      });
    } else {
      const id = await db.add('files', {
        name,
        content,
        created: now,
        modified: now
      });
      currentId = id;
      creationTime = now;
    }
    await refreshFileList();
  });

  deleteBtn.addEventListener('click', async () => {
    if (!currentId) return;
    await db.delete('files', currentId);
    currentId = null;
    fileName.value = '';
    fileContent.value = '';
    updateCount();
    await refreshFileList();
  });

  fileContent.addEventListener('input', updateCount);

  async function refreshFileList() {
    const files = await db.getAll('files');
    fileList.innerHTML = '';
    files.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f.name;
      li.dataset.id = f.id;
      li.addEventListener('click', () => loadFile(f.id));
      fileList.appendChild(li);
    });
  }

  async function loadFile(id) {
    const file = await db.get('files', id);
    if (!file) return;
    currentId = id;
    creationTime = file.created;
    fileName.value = file.name;
    fileContent.value = file.content;
    updateCount();
  }

  function updateCount() {
    const text = fileContent.value;
    const charCount = text.length;
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    status.textContent = `Words: ${wordCount}, Chars: ${charCount}`;
  }

  await refreshFileList();
});
