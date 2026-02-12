const API_BASE = "http://localhost:8000";

/* Cache DOM elements */
const transcriptInput = document.getElementById("transcriptInput");
const extractionSource = document.getElementById("extractionSource");
const actionItems = document.getElementById("actionItems");
const historyEl = document.getElementById("history");
const processBtn = document.getElementById("processBtn");
const toast = document.getElementById("toast");
const filterButtons = document.querySelectorAll(".filter");

/* State */
const AppState = {
    currentTranscriptId: null,
    currentFilter: "all",
    items: [],
    transcripts: []
};

/* API Layer */
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

    async getTranscripts() {
        const res = await fetch(`${API_BASE}/api/transcripts`);
        if (!res.ok) throw new Error("Fetch transcripts failed");
        return res.json();
    }
};

/* Handlers */
processBtn.addEventListener("click", handleProcessTranscript);

filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        handleFilterChange(btn.dataset.filter, btn);
    });
});

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
    } catch (e) {
        console.error(e);
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
    } catch {
        /* silent */
    }
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

async function deleteItem(id) {
    if (!confirm("Delete this action item?")) return;
    try {
        await API.deleteItem(id);
        loadItems();
        showToast("Item deleted");
    } catch {
        showToast("Delete failed");
    }
}

async function loadTranscript(id) {
    AppState.currentTranscriptId = id;
    AppState.currentFilter = "all";
    filterButtons.forEach(b => b.classList.remove("active"));
    filterButtons[0].classList.add("active");
    loadItems();
}

/* Render */
function renderItems() {
    if (!AppState.items.length) {
        actionItems.innerHTML = `<div class="meta">No action items found</div>`;
        return;
    }

    actionItems.innerHTML = AppState.items.map(item => `
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
            <button onclick="deleteItem(${item.id})">Delete</button>
        </div>
    `).join("");
}

function renderHistory() {
    historyEl.innerHTML = AppState.transcripts.map(t => `
        <div class="history-item" onclick="loadTranscript(${t.id})">
            ${new Date(t.created_at).toLocaleString()} (${t.item_count})
        </div>
    `).join("");
}

/* Utils */
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

/* Init */
document.addEventListener("DOMContentLoaded", loadHistory);
