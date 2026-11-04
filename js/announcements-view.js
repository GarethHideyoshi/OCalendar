/* ===========================================================
   announcements-view.js
   Event / Suspension tabs: cards, filter popup, delete popup.
   Must be loaded AFTER upload.js (uses AnnouncementStore).
   =========================================================== */

const LISTS = {
    Events:     { container: document.getElementById("eventList"),      icon: ".filter-event",      label: "events" },
    Suspension: { container: document.getElementById("suspensionList"), icon: ".filter-suspension",  label: "suspensions" }
};

const TRASH_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/><path d="M10 11v6M14 11v6"/></svg>';
const EDIT_SVG  = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';


/* ---------- Helpers ---------- */

// textContent (not innerHTML) so typed text can't inject HTML
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function formatDate(dateStr, timeStr) {
    if (!dateStr) return "";
    const d = new Date(`${dateStr}T${timeStr || "00:00"}`);
    const datePart = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    const timePart = timeStr
        ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
        : "";
    return timePart ? `${datePart} - ${timePart}` : datePart;
}

// Read [value, label] pairs from an existing <select> (skips the placeholder)
function optionsFrom(selectId) {
    return Array.from(document.getElementById(selectId).options)
        .filter(o => o.value !== "")
        .map(o => [o.value, o.textContent.trim()]);
}

function makeSelect(options, value) {
    const s = document.createElement("select");
    options.forEach(([v, label]) => {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = label;
        s.appendChild(o);
    });
    s.value = value;
    return s;
}


/* ---------- Popup (used by filter + delete) ---------- */

function openModal({ title, content, confirmText = "Confirm", danger = false, onConfirm }) {
    const overlay = el("div", "modal-overlay");
    const box = el("div", "modal-box");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");

    const body = el("div", "modal-body");
    body.appendChild(content);

    const cancelBtn = el("button", "modal-btn modal-cancel", "Cancel");
    const confirmBtn = el("button", "modal-btn modal-confirm" + (danger ? " danger" : ""), confirmText);
    cancelBtn.type = confirmBtn.type = "button";

    const actions = el("div", "modal-actions");
    actions.append(cancelBtn, confirmBtn);

    box.append(el("h2", "modal-title", title), body, actions);
    overlay.appendChild(box);

    function close() {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape") close(); }

    cancelBtn.addEventListener("click", close);
    confirmBtn.addEventListener("click", () => { onConfirm(); close(); });
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", onKey);

    document.body.appendChild(overlay);
    confirmBtn.focus();
}


/* ---------- Delete popup ---------- */

function confirmDelete(a) {
    openModal({
        title: "Delete announcement?",
        content: el("p", "modal-text", `"${a.title}" will be permanently removed.`),
        confirmText: "Delete",
        danger: true,
        onConfirm: () => {
            AnnouncementStore.remove(a.id);
            renderAnnouncements();
        }
    });
}


/* ---------- Filters ---------- */

const DEFAULT_FILTER = { timeMode: "any", time: "", department: "", program: "" };
const filters = { Events: { ...DEFAULT_FILTER }, Suspension: { ...DEFAULT_FILTER } };

function isFiltered(f) {
    return Boolean((f.timeMode !== "any" && f.time) || f.department || f.program);
}

function matches(a, f) {
    if (f.timeMode !== "any" && f.time) {
        // "HH:MM" strings compare correctly as text
        if (f.timeMode === "min" && !(a.time >= f.time)) return false;
        if (f.timeMode === "max" && !(a.time <= f.time)) return false;
        if (f.timeMode === "exact" && a.time !== f.time) return false;
    }
    if (f.department && a.department !== f.department) return false;
    if (f.program && a.program !== f.program) return false;
    return true;
}

function field(labelText, ...controls) {
    const wrap = el("div", "filter-field");
    wrap.appendChild(el("span", "filter-label", labelText));
    controls.forEach(c => wrap.appendChild(c));
    return wrap;
}

function openFilter(type) {
    const f = filters[type];

    const timeMode = makeSelect(
        [["any", "Any time"], ["min", "At or after"], ["max", "At or before"], ["exact", "Exactly at"]],
        f.timeMode
    );
    const timeInput = document.createElement("input");
    timeInput.type = "time";
    timeInput.value = f.time;
    const syncTime = () => {
        timeInput.disabled = timeMode.value === "any";
        if (timeInput.disabled) timeInput.value = "";
    };
    timeMode.addEventListener("change", syncTime);
    syncTime();

    const dept = makeSelect([["", "All departments"], ...optionsFrom("department")], f.department);
    const course = makeSelect([["", "All courses"], ...optionsFrom("program")], f.program);
    const syncCourse = () => {
        course.disabled = dept.value !== "COLLEGE";   // same rule as the upload form
        if (course.disabled) course.value = "";
    };
    dept.addEventListener("change", syncCourse);
    syncCourse();

    const clear = el("button", "filter-clear", "Clear filters");
    clear.type = "button";
    clear.addEventListener("click", () => {
        timeMode.value = "any";
        dept.value = "";
        course.value = "";
        syncTime();
        syncCourse();
    });

    const grid = el("div", "filter-grid");
    grid.append(
        field("Time", timeMode, timeInput),
        field("Dept.", dept),
        field("Course", course)
    );

    const content = el("div");
    content.append(grid, clear);

    openModal({
        title: "Filter",
        content,
        onConfirm: () => {
            filters[type] = {
                timeMode: timeMode.value,
                time: timeInput.value,
                department: dept.value,
                program: course.value
            };
            renderAnnouncements();
        }
    });
}


/* ---------- Cards ---------- */

function iconButton(svg, label, extraClass, onClick) {
    const b = el("button", "icon-btn " + extraClass);
    b.type = "button";
    b.innerHTML = svg;            // constant SVG strings only, no user text
    b.title = label;
    b.setAttribute("aria-label", label);
    b.addEventListener("click", onClick);
    return b;
}

function buildCard(a) {
    const card = el("article", "announcement-card");
    card.title = a.description;   // hover to read the full description

    const imgBox = el("div", "announcement-img-box");
    if (a.image) {
        const img = el("img", "announcement-img");
        img.src = a.image;
        img.alt = a.title;
        imgBox.appendChild(img);
    } else {
        imgBox.textContent = "No image";
    }

    const info = el("div", "announcement-info");
    const target = a.program ? `${a.department} - ${a.program}` : a.department;

    const actions = el("div", "announcement-actions");
    actions.append(
        iconButton(TRASH_SVG, "Delete", "danger", () => confirmDelete(a)),
        iconButton(EDIT_SVG, "Edit", "", () => window.startEdit(a.id))
    );

    info.append(
        el("h3", "announcement-title", a.title),
        el("p", "announcement-meta", target),
        el("p", "announcement-meta", formatDate(a.date, a.time)),
        actions
    );

    card.append(imgBox, info);
    return card;
}


/* ---------- Render ---------- */

function renderAnnouncements() {
    for (const [type, cfg] of Object.entries(LISTS)) {
        if (!cfg.container) continue;

        const all = AnnouncementStore.getByType(type);
        const shown = all
            .filter(a => matches(a, filters[type]))
            .sort((x, y) => `${x.date}${x.time}`.localeCompare(`${y.date}${y.time}`));

        cfg.container.replaceChildren();

        if (shown.length === 0) {
            cfg.container.appendChild(el(
                "p", "announcement-empty",
                all.length === 0 ? `No ${cfg.label} yet.` : `No ${cfg.label} match your filter.`
            ));
        } else {
            shown.forEach(a => cfg.container.appendChild(buildCard(a)));
        }

        const icon = document.querySelector(cfg.icon);
        if (icon) icon.classList.toggle("active", isFiltered(filters[type]));
    }
}

// Open the filter popup from each tab's filter icon
for (const [type, cfg] of Object.entries(LISTS)) {
    const icon = document.querySelector(cfg.icon);
    if (icon) icon.addEventListener("click", () => openFilter(type));
}

renderAnnouncements();
window.addEventListener("announcements:changed", renderAnnouncements);
window.addEventListener("storage", renderAnnouncements);
