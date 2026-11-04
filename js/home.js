/* ===========================================================
   home.js  -  homepage: filters, carousel, profile defaults
   Needs announcement-store.js (and base.js for Details).
   =========================================================== */

(function () {
    // Must be signed in (otherwise sends you to login.html)
    const user = Session.require();
    if (!user) return;

    const PERIOD_LABEL = { previous: "Previous", today: "Today's", upcoming: "Upcoming" };

    const state = {
        type: "Events",        // "Events" | "Suspension"
        period: "upcoming",    // "previous" | "today" | "upcoming"
        dept: "",              // "" = all, "mine" = profile dept, or a department
        course: "",            // "" = all, "mine" = profile program, or a program value
        timeMode: "any",       // "any" | "min" | "max" | "exact"
        time: "",
        index: 0
    };

    /* ---------- elements ---------- */
    const $ = id => document.getElementById(id);

    const deptSelect = $("deptSelect");
    const courseSelect = $("courseSelect");
    const timeBtn = $("timeFilterBtn");
    const heading = $("listHeading");
    const counter = $("counter");
    const imgLeft = $("imgLeft");
    const imgCenter = $("imgCenter");
    const imgRight = $("imgRight");
    const dispDept = $("dispDept");
    const dispTitle = $("dispTitle");
    const dispDesc = $("dispDesc");
    const dispDate = $("dispDate");
    const detailBtn = $("ID-btn-detail");

    $("profileInitial").textContent = (user.name || user.email).charAt(0);


    /* ---------- helpers ---------- */

    function todayStr() {
        const d = new Date();
        const p = n => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
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

    function fmtTime(t) {
        return new Date(`1970-01-01T${t}`).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }

    function fillSelect(select, options) {
        select.replaceChildren();
        options.forEach(([value, label]) => {
            const o = document.createElement("option");
            o.value = value;
            o.textContent = label;
            select.appendChild(o);
        });
    }


    /* ---------- dropdowns (default = the user's profile) ---------- */

    const hasMineCourse = user.department === "COLLEGE" && Boolean(user.program);

    fillSelect(deptSelect, [
        ...(user.department ? [["mine", "My dept."]] : []),
        ["", "All depts."],
        ...OC_DEPARTMENTS.map(d => [d, d])
    ]);

    fillSelect(courseSelect, [
        ...(hasMineCourse ? [["mine", "My course"]] : []),
        ["", "All courses"],
        ...OC_PROGRAMS
    ]);

    function resolveDept() {
        return state.dept === "mine" ? user.department : state.dept;
    }

    function resolveCourse() {
        return state.course === "mine" ? user.program : state.course;
    }

    // Course only works when the department is COLLEGE (same rule as the upload form)
    function syncCourse() {
        const isCollege = resolveDept() === "COLLEGE";
        courseSelect.disabled = !isCollege;
        state.course = isCollege && state.dept === "mine" && hasMineCourse ? "mine" : "";
        courseSelect.value = state.course;
    }

    state.dept = user.department ? "mine" : "";
    deptSelect.value = state.dept;
    syncCourse();

    deptSelect.addEventListener("change", () => {
        state.dept = deptSelect.value;
        state.index = 0;
        syncCourse();
        render();
    });

    courseSelect.addEventListener("change", () => {
        state.course = courseSelect.value;
        state.index = 0;
        render();
    });


    /* ---------- Events/Suspension + Previous/Today/Upcoming ---------- */

    document.querySelectorAll("[data-type]").forEach(btn => {
        btn.addEventListener("click", () => {
            state.type = btn.dataset.type;
            state.index = 0;
            document.querySelectorAll("[data-type]").forEach(b => b.classList.toggle("active", b === btn));
            render();
        });
    });

    document.querySelectorAll("[data-period]").forEach(btn => {
        btn.addEventListener("click", () => {
            state.period = btn.dataset.period;
            state.index = 0;
            document.querySelectorAll("[data-period]").forEach(b => b.classList.toggle("active", b === btn));
            render();
        });
    });


    /* ---------- time filter popup ---------- */

    function openModal({ title, content, onConfirm }) {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";

        const box = document.createElement("div");
        box.className = "modal-box";
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");

        const h = document.createElement("h2");
        h.className = "modal-title";
        h.textContent = title;

        const body = document.createElement("div");
        body.className = "modal-body";
        body.appendChild(content);

        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "modal-btn modal-cancel";
        cancel.textContent = "Cancel";

        const confirm = document.createElement("button");
        confirm.type = "button";
        confirm.className = "modal-btn modal-confirm";
        confirm.textContent = "Confirm";

        const actions = document.createElement("div");
        actions.className = "modal-actions";
        actions.append(cancel, confirm);

        box.append(h, body, actions);
        overlay.appendChild(box);

        function close() {
            overlay.remove();
            document.removeEventListener("keydown", onKey);
        }
        function onKey(e) { if (e.key === "Escape") close(); }

        cancel.addEventListener("click", close);
        confirm.addEventListener("click", () => { onConfirm(); close(); });
        overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
        document.addEventListener("keydown", onKey);

        document.body.appendChild(overlay);
        confirm.focus();
    }

    function updateTimeButton() {
        const active = state.timeMode !== "any" && Boolean(state.time);
        const word = { min: "from", max: "until", exact: "at" }[state.timeMode];
        timeBtn.textContent = active ? `Time: ${word} ${fmtTime(state.time)}` : "Time filter";
        timeBtn.classList.toggle("filtered", active);
    }

    timeBtn.addEventListener("click", () => {
        const mode = document.createElement("select");
        [["any", "Any time"], ["min", "At or after"], ["max", "At or before"], ["exact", "Exactly at"]]
            .forEach(([v, label]) => {
                const o = document.createElement("option");
                o.value = v;
                o.textContent = label;
                mode.appendChild(o);
            });
        mode.value = state.timeMode;

        const input = document.createElement("input");
        input.type = "time";
        input.value = state.time;

        const sync = () => {
            input.disabled = mode.value === "any";
            if (input.disabled) input.value = "";
        };
        mode.addEventListener("change", sync);
        sync();

        const field = (text, control) => {
            const wrap = document.createElement("div");
            wrap.className = "modal-field";
            const label = document.createElement("span");
            label.className = "modal-label";
            label.textContent = text;
            wrap.append(label, control);
            return wrap;
        };

        const clear = document.createElement("button");
        clear.type = "button";
        clear.className = "modal-clear";
        clear.textContent = "Clear time filter";
        clear.addEventListener("click", () => { mode.value = "any"; sync(); });

        const content = document.createElement("div");
        content.className = "modal-body";
        content.append(field("Show announcements", mode), field("Time", input), clear);

        openModal({
            title: "Time filter",
            content,
            onConfirm: () => {
                state.timeMode = mode.value;
                state.time = input.value;
                state.index = 0;
                updateTimeButton();
                render();
            }
        });
    });


    /* ---------- filtering ---------- */

    function getFiltered() {
        const today = todayStr();
        const dept = resolveDept();
        const course = resolveCourse();

        const list = AnnouncementStore.getByType(state.type).filter(a => {
            if (dept && a.department !== dept) return false;
            if (course && a.program !== course) return false;

            if (state.period === "previous" && !(a.date < today)) return false;
            if (state.period === "today" && a.date !== today) return false;
            if (state.period === "upcoming" && !(a.date > today)) return false;

            if (state.timeMode !== "any" && state.time) {
                // "HH:MM" strings compare correctly as text
                if (state.timeMode === "min" && !(a.time >= state.time)) return false;
                if (state.timeMode === "max" && !(a.time <= state.time)) return false;
                if (state.timeMode === "exact" && a.time !== state.time) return false;
            }
            return true;
        });

        const key = a => `${a.date} ${a.time}`;
        list.sort((x, y) => key(x).localeCompare(key(y)));
        if (state.period === "previous") list.reverse();   // most recent first
        return list;
    }


    /* ---------- render ---------- */

    function setImage(node, a) {
        node.style.backgroundImage = a && a.image ? `url(${JSON.stringify(a.image)})` : "none";
        node.classList.toggle("is-empty", !a);
    }

    function render() {
        const list = getFiltered();
        const n = list.length;
        if (state.index >= n) state.index = 0;

        heading.textContent = `${PERIOD_LABEL[state.period]} ${state.type === "Events" ? "Event" : "Suspension"}`;
        counter.textContent = n ? `${state.index + 1}/${n}` : "0/0";

        const current = n ? list[state.index] : null;
        setImage(imgCenter, current);
        setImage(imgLeft, n >= 3 ? list[(state.index - 1 + n) % n] : null);
        setImage(imgRight, n >= 2 ? list[(state.index + 1) % n] : null);

        if (current) {
            dispDept.textContent = current.program ? `${current.department} - ${current.program}` : current.department;
            dispTitle.textContent = current.title;
            dispDesc.textContent = current.description;
            dispDate.textContent = formatDate(current.date, current.time);
        } else {
            dispDept.textContent = "-";
            dispTitle.textContent = "Nothing to show";
            dispDesc.textContent = "";
            dispDate.textContent = "";
        }
        detailBtn.classList.toggle("disabled", !current);
    }

    function step(dir) {
        const n = getFiltered().length;
        if (n < 2) return;
        state.index = (state.index + dir + n) % n;
        render();
    }

    $("prevBtn").addEventListener("click", () => step(-1));
    $("nextBtn").addEventListener("click", () => step(1));
    imgLeft.addEventListener("click", () => step(-1));
    imgRight.addEventListener("click", () => step(1));

    // Dashboard published / edited / deleted something in another tab
    window.addEventListener("storage", render);

    updateTimeButton();
    render();
})();
