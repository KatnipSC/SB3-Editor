let originalZip;
let jsonEditor;
let fileHandle;

// Import JSZip and JSONEditor from CDN
const JSONEditor = window.JSONEditor;
const JSZip = window.JSZip;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('jsoneditor');
    const options = { mode: 'code' };
    jsonEditor = new JSONEditor(container, options);
});

async function openSb3File() {
    try {
    const handles = await window.showOpenFilePicker({
        types: [{ description: 'Scratch SB3 Files', accept: { 'application/zip': ['.sb3'] } }]
    });
    const handle = handles[0];

    fileHandle = handle;
    const file = await handle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    originalZip = await JSZip.loadAsync(arrayBuffer);

    const jsonFile = originalZip.file('project.json');
    if (jsonFile) {
        const jsonText = await jsonFile.async('text');
        const jsonObj = JSON.parse(jsonText);
        jsonEditor.set(jsonObj);
    } else {
        alert('project.json not found in .sb3 file');
    }
    } catch (err) {
    console.error(err);
    alert('Error opening file');
    }
}

async function saveToFileSystem() {
    if (!fileHandle || !originalZip) { alert('No file opened.'); return; }

    try {
        const newJsonObj = jsonEditor.get();
        const newJson = JSON.stringify(newJsonObj);

        const newZip = new JSZip();
        await Promise.all(
            Object.keys(originalZip.files).map(async (filename) => {
            if (filename === 'project.json') {
                newZip.file(filename, newJson);
            } else {
                const fileData = await originalZip.file(filename).async("arraybuffer");
                newZip.file(filename, fileData);
            }
            })
        );

        const newBlob = await newZip.generateAsync({ type: 'blob' });
        const writable = await fileHandle.createWritable();
        await writable.write(newBlob);
        await writable.close();
        alert('Saved successfully.');
    } catch (e) {
        console.error(e);
        alert('Error saving file.');
    }
}