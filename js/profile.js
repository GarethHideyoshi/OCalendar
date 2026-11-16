/* ===========================================================
   profile.js  -  profile page (full name, department, program)
   Saves into UserStore, so the dashboard's User tab updates too.
   =========================================================== */

(function () {
    const user = Session.require();
    if (!user) return;

    const form = document.getElementById("profileForm");
    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const department = document.getElementById("department");
    const program = document.getElementById("program");
    const formMsg = document.getElementById("formMsg");
    const descText = document.getElementById("descText");

    const isFirstTime = !user.name || !user.department;

    function addOption(select, value, label, placeholder) {
        const o = document.createElement("option");
        o.value = value;
        o.textContent = label;
        if (placeholder) o.disabled = true;
        select.appendChild(o);
    }

    // Placeholders + options (single source: announcement-store.js)
    addOption(department, "", "Dept.", true);
    OC_DEPARTMENTS.forEach(d => addOption(department, d, d));

    addOption(program, "", "Course", true);
    OC_PROGRAMS.forEach(([value, label]) => addOption(program, value, label));


    /* ---------- program only usable when department = COLLEGE ---------- */

    function syncProgram() {
        const isCollege = department.value === "COLLEGE";
        program.disabled = !isCollege;
        program.required = isCollege;
        if (!isCollege) program.value = "";
    }
    department.addEventListener("change", syncProgram);


    /* ---------- helpers ---------- */

    function showMsg(text, kind) {
        formMsg.textContent = text;
        formMsg.className = "form-msg " + kind;
    }

    function programLabel(value) {
        const found = OC_PROGRAMS.find(([v]) => v === value);
        return found ? found[1] : value;
    }

    function refreshDescription(u) {
        if (!u.name || !u.department) {
            descText.textContent = "Complete your profile so announcements can default to your department and course.";
            return;
        }
        const where = u.program ? `${u.department} - ${programLabel(u.program)}` : u.department;
        descText.textContent =
            `Signed in as ${u.email}. Your homepage opens on announcements for ${where}. ` +
            `You can still switch to other departments from the filters.`;
    }

    function load(u) {
        fullName.value = u.name || "";
        email.value = u.email;
        department.value = u.department || "";
        syncProgram();
        program.value = u.program || "";
        refreshDescription(u);
    }

    load(user);

    if (new URLSearchParams(location.search).has("welcome")) {
        showMsg("Welcome! Please complete your profile to continue.", "info");
    }


    /* ---------- save ---------- */

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = fullName.value.trim();
        const isCollege = department.value === "COLLEGE";

        if (!name) return showMsg("Please enter your full name.", "error");
        if (!department.value) return showMsg("Please choose your department.", "error");
        if (isCollege && !program.value) return showMsg("Please choose your program.", "error");

        try {
            const saved = UserStore.update(user.email, {
                name,
                department: department.value,
                program: isCollege ? program.value : ""
            });
            if (!saved) throw new Error("User no longer exists");

            refreshDescription(saved);
            showMsg("Profile updated!", "success");

            // First-time setup: continue to the homepage
            if (isFirstTime) setTimeout(() => { location.href = PAGES.home; }, 900);
        } catch (err) {
            console.error(err);
            showMsg("Could not save. Browser storage may be full or blocked.", "error");
        }
    });


    /* ---------- cancel / sign out ---------- */

    document.getElementById("cancelBtn").addEventListener("click", () => {
        location.href = PAGES.home;
    });

    document.getElementById("signOutBtn").addEventListener("click", () => {
        Session.clear();
        location.href = PAGES.login;
    });
})();
