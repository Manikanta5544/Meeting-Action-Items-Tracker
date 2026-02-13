const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://meeting-action-items-tracker-6aqr.onrender.com";

const transcriptInput = document.getElementById("transcriptInput");
const extractionSource = document.getElementById("extractionSource");
const actionItems = document.getElementById("actionItems");
const historyEl = document.getElementById("history");
const processBtn = document.getElementById("processBtn");
const toast = document.getElementById("toast");
const filterButtons = document.querySelectorAll(".filter");

const confirmModal = document.getElementById("confirmModal");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const confirmCancelBtn = document.getElementById("confirmCancel");

let pendingDeleteId = null;
let editingId = null;

const AppState = {
    currentTranscriptId: null,
    currentFilter: "all",
    items: [],
    transcripts: []
};

const API = {
    async processTranscript(text) {
        const res = await fetch(`${API_BASE}/api/transcripts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error("Process failed");
        return res.json();
    },

    async getItems(id, status) {
        let url = `${API_BASE}/api/transcripts/${id}`;
        if (status && status !== "all") url += `?status=${status}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Fetch items failed");
        return res.json();
    },

    async updateItem(id, updates) {
        const res = await fetch(`${API_BASE}/api/action-items/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error("Update failed");
    },

    async deleteItem(id) {
        const res = await fetch(`${API_BASE}/api/action-items/${id}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error("Delete failed");
    },

    async addItem(payload) {
        const res = await fetch(`${API_BASE}/api/action-items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Add failed");
    },

    async getTranscripts() {
        const res = await fetch(`${API_BASE}/api/transcripts`);
        if (!res.ok) throw new Error("Fetch transcripts failed");
        return res.json();
    }
};

processBtn.addEventListener("click", handleProcessTranscript);

filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        handleFilterChange(btn.dataset.filter, btn);
    });
});

confirmCancelBtn.onclick = () => {
    pendingDeleteId = null;
    confirmModal.classList.add("hidden");
};

confirmDeleteBtn.onclick = async () => {
    if (!pendingDeleteId) return;
    try {
        await API.deleteItem(pendingDeleteId);
        await loadItems();
        showToast("Item deleted");
    } catch {
        showToast("Delete failed");
    }
    pendingDeleteId = null;
    confirmModal.classList.add("hidden");
};

async function handleProcessTranscript() {
    const text = transcriptInput.value.trim();
    if (!text) return showToast("Transcript is empty");

    setLoading(true);
    try {
        const data = await API.processTranscript(text);
        AppState.currentTranscriptId = data.transcript_id;
        extractionSource.textContent = `Source: ${data.source}`;
        transcriptInput.value = "";

        await loadItems();
        await loadHistory();
        showToast("Action items extracted");
    } catch {
        showToast("Extraction failed");
    } finally {
        setLoading(false);
    }
}

async function loadItems() {
    if (!AppState.currentTranscriptId) return;
    try {
        AppState.items = await API.getItems(
            AppState.currentTranscriptId,
            AppState.currentFilter
        );
        renderItems();
    } catch {
        showToast("Failed to load items");
    }
}

async function loadHistory() {
    try {
        AppState.transcripts = await API.getTranscripts();
        renderHistory();
    } catch {}
}

function handleFilterChange(filter, btn) {
    AppState.currentFilter = filter;
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadItems();
}

async function toggleDone(id, checked) {
    try {
        await API.updateItem(id, { status: checked ? "done" : "open" });
        loadItems();
    } catch {
        showToast("Update failed");
    }
}

function deleteItem(id) {
    pendingDeleteId = id;
    confirmModal.classList.remove("hidden");
}

function editItem(id) {
    editingId = id;
    renderItems();
}

async function saveEdit(id) {
    const task = document.getElementById(`edit-task-${id}`).value;
    const owner = document.getElementById(`edit-owner-${id}`).value || null;
    const due_date = document.getElementById(`edit-date-${id}`).value || null;

    try {
        await API.updateItem(id, { task, owner, due_date });
        editingId = null;
        await loadItems();
        showToast("Item updated");
    } catch {
        showToast("Update failed");
    }
}

function cancelEdit() {
    editingId = null;
    renderItems();
}

async function addItem() {
    const task = document.getElementById("newTask").value.trim();
    if (!task || !AppState.currentTranscriptId) return showToast("Task is required");

    const owner = document.getElementById("newOwner").value || null;
    const due_date = document.getElementById("newDate").value || null;

    try {
        await API.addItem({
            transcript_id: AppState.currentTranscriptId,
            task,
            owner,
            due_date
        });

        document.getElementById("newTask").value = "";
        document.getElementById("newOwner").value = "";
        document.getElementById("newDate").value = "";

        await loadItems();
        showToast("Item added");
    } catch {
        showToast("Add failed");
    }
}

async function loadTranscript(id) {
    AppState.currentTranscriptId = id;
    AppState.currentFilter = "all";
    filterButtons.forEach(b => b.classList.remove("active"));
    filterButtons[0].classList.add("active");
    loadItems();
}

function renderItems() {
    if (!AppState.items.length) {
        actionItems.innerHTML = `<div class="meta">No action items found</div>`;
        return;
    }

    actionItems.innerHTML = AppState.items.map(item => {
        if (editingId === item.id) {
            return `
                <div class="item">
                    <div>
                        <input id="edit-task-${item.id}" value="${escapeHtml(item.task)}" />
                        <input id="edit-owner-${item.id}" value="${escapeHtml(item.owner || "")}" placeholder="Owner" />
                        <input id="edit-date-${item.id}" value="${escapeHtml(item.due_date || "")}" placeholder="Due date" />
                        <div>
                            <button class="btn primary" onclick="saveEdit(${item.id})">Save</button>
                            <button class="btn" onclick="cancelEdit()">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="item ${item.status === "done" ? "done" : ""}">
                <input type="checkbox"
                    ${item.status === "done" ? "checked" : ""}
                    onchange="toggleDone(${item.id}, this.checked)">
                <div>
                    <div>${escapeHtml(item.task)}</div>
                    ${(item.owner || item.due_date) ? `
                        <div class="meta">
                            ${item.owner || ""} ${item.due_date || ""}
                        </div>` : ""}
                </div>
                <div>
                    <button onclick="editItem(${item.id})">Edit</button>
                    <button onclick="deleteItem(${item.id})">Delete</button>
                </div>
            </div>
        `;
    }).join("");
}

function renderHistory() {
    historyEl.innerHTML = AppState.transcripts.map(t => `
        <div class="history-item" onclick="loadTranscript(${t.id})">
            ${new Date(t.created_at).toLocaleString()} (${t.item_count})
        </div>
    `).join("");
}

function setLoading(on) {
    processBtn.disabled = on;
    processBtn.textContent = on ? "Processing..." : "Extract action items";
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

function escapeHtml(text) {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
}

document.addEventListener("DOMContentLoaded", loadHistory);
