/* ===========================================================
   upload.js  -  Upload / edit form
   Needs announcement-store.js loaded first (AnnouncementStore lives there)
   =========================================================== */

/* ---------- Tab switching helper ---------- */
// Clicks the sidebar item so nav.js does its normal job.
// Fallback: toggles the "hidden" class directly if nav.js didn't.

const TABS = {
    user:       [".D-user",       ".content-user"],
    event:      [".D-event",      ".content-event"],
    suspension: [".D-suspension", ".content-suspension"],
    upload:     [".D-upload",     ".content-upload"]
};

const TYPE_TO_TAB = { Events: "event", Suspension: "suspension" };

window.showDashboardTab = function (name) {
    const tab = TABS[name];
    if (!tab) return;

    const sidebarItem = document.querySelector(tab[0]);
    if (sidebarItem) sidebarItem.click();

    const target = document.querySelector(tab[1]);
    if (target && target.classList.contains("hidden")) {
        Object.values(TABS).forEach(([, contentSel]) => {
            const c = document.querySelector(contentSel);
            if (c) c.classList.add("hidden");
        });
        target.classList.remove("hidden");
    }
};


/* ---------- Elements ---------- */

const form = document.getElementById("announcementForm");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const contentType = document.getElementById("contentType");
const department = document.getElementById("department");
const programContainer = document.getElementById("programContainer");
const program = document.getElementById("program");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");

const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");
const cancelButton = document.getElementById("cancelEdit");
const saveButton = document.getElementById("saveButton");
const uploadHeading = document.querySelector(".content-upload .header-left p");

const DEFAULT_PREVIEW = imagePreview.getAttribute("src");

let imageDataUrl = "";   // compressed image saved with the record
let editingId = null;    // null = publishing new, otherwise id being edited


/* ---------- Edit mode ---------- */

function setEditMode(id) {
    editingId = id;
    saveButton.textContent = id ? "Update Announcement" : "Publish Announcement";
    if (uploadHeading) uploadHeading.textContent = id ? "EDIT" : "UPLOAD";
}

// Called by the Edit button on each card (announcements-view.js)
window.startEdit = function (id) {
    const rec = AnnouncementStore.getById(id);
    if (!rec) return;

    form.reset();
    titleInput.value = rec.title;
    descriptionInput.value = rec.description;
    contentType.value = rec.contentType;
    department.value = rec.department;
    syncProgramState();
    if (rec.department === "COLLEGE") program.value = rec.program;
    eventDate.value = rec.date;
    eventTime.value = rec.time;

    imageInput.value = "";
    imageDataUrl = rec.image || "";
    imagePreview.src = imageDataUrl || DEFAULT_PREVIEW;

    setEditMode(id);
    window.showDashboardTab("upload");
};


/* ---------- Program only usable when department = COLLEGE ---------- */

function syncProgramState() {
    const isCollege = department.value === "COLLEGE";

    program.disabled = !isCollege;
    program.required = isCollege;
    programContainer.classList.toggle("is-disabled", !isCollege);

    if (!isCollege) program.value = "";
}

department.addEventListener("change", syncProgramState);
syncProgramState();


/* ---------- Image preview + conversion ---------- */

function fileToDataUrl(file, maxSize = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => reject(reader.error);
        reader.onload = () => {
            const img = new Image();

            img.onerror = () => reject(new Error("Invalid image file"));
            img.onload = () => {
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };

            img.src = reader.result;
        };

        reader.readAsDataURL(file);
    });
}

imageInput.addEventListener("change", async function () {
    const file = this.files[0];

    // No file chosen: fall back to the record's image (editing) or the default
    if (!file) {
        const rec = editingId ? AnnouncementStore.getById(editingId) : null;
        imageDataUrl = rec ? rec.image || "" : "";
        imagePreview.src = imageDataUrl || DEFAULT_PREVIEW;
        return;
    }

    try {
        imageDataUrl = await fileToDataUrl(file);
        imagePreview.src = imageDataUrl;
    } catch (err) {
        console.error(err);
        alert("Could not read that image. Please try another file.");
        this.value = "";
    }
});


/* ---------- Reset / Cancel ---------- */

function resetForm() {
    form.reset();
    imageDataUrl = "";
    imagePreview.src = DEFAULT_PREVIEW;
    syncProgramState();   // form.reset() doesn't fire "change"
    setEditMode(null);
}

cancelButton.addEventListener("click", () => {
    const rec = editingId ? AnnouncementStore.getById(editingId) : null;
    resetForm();
    // Cancelling an edit returns to the tab the announcement lives in
    if (rec) window.showDashboardTab(TYPE_TO_TAB[rec.contentType]);
});


/* ---------- Submit -> publish or update ---------- */

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const data = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        image: imageDataUrl,
        contentType: contentType.value,
        department: department.value,
        program: department.value === "COLLEGE" ? program.value : "",
        date: eventDate.value,
        time: eventTime.value
    };

    const wasEditing = editingId;

    try {
        if (wasEditing) {
            if (!AnnouncementStore.update(wasEditing, data)) {
                throw new Error("Announcement no longer exists");
            }
        } else {
            AnnouncementStore.add(data);
        }

        window.dispatchEvent(new Event("announcements:changed"));
        alert(wasEditing ? "Announcement updated!" : "Announcement published!");
        resetForm();

        if (wasEditing) window.showDashboardTab(TYPE_TO_TAB[data.contentType]);
    } catch (err) {
        console.error(err);
        alert("Could not save. Storage may be full - try a smaller image.");
    }
});
