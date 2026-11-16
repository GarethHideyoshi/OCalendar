/* ===========================================================
   login.js  -  Log In / Sign Up (demo, no password)
   Sign Up creates the user; Log In only accepts existing users.
   Everyone created here appears in the dashboard's User tab.
   =========================================================== */

(function () {
    // Set to "" to accept any email address
    const ALLOWED_EMAIL_DOMAIN = "gmail.com";

    // Already signed in -> straight to the homepage
    if (Session.get()) {
        location.replace(PAGES.home);
        return;
    }

    const $ = id => document.getElementById(id);

    const tabLogin = $("tabLogin");
    const tabSignup = $("tabSignup");
    const loginForm = $("loginForm");
    const signupForm = $("signupForm");
    const loginMsg = $("loginMsg");
    const signupMsg = $("signupMsg");

    const loginEmail = $("loginEmail");
    const suEmail = $("suEmail");
    const suName = $("suName");
    const suDepartment = $("suDepartment");
    const suProgram = $("suProgram");


    /* ---------- helpers ---------- */

    function showMsg(node, text, kind = "error") {
        node.textContent = text;
        node.className = "form-msg " + kind;
    }

    function clearMsgs() {
        showMsg(loginMsg, "", "");
        showMsg(signupMsg, "", "");
    }

    function emailError(email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return "Please enter a valid email address.";
        }
        if (ALLOWED_EMAIL_DOMAIN && !email.endsWith("@" + ALLOWED_EMAIL_DOMAIN)) {
            return `Please use your @${ALLOWED_EMAIL_DOMAIN} address.`;
        }
        return "";
    }

    function addOption(select, value, label, placeholder) {
        const o = document.createElement("option");
        o.value = value;
        o.textContent = label;
        if (placeholder) o.disabled = true;
        select.appendChild(o);
    }


    /* ---------- tabs ---------- */

    function showTab(name) {
        const isLogin = name === "login";

        // carry a typed email over to the other tab
        if (isLogin && !loginEmail.value) loginEmail.value = suEmail.value;
        if (!isLogin && !suEmail.value) suEmail.value = loginEmail.value;

        loginForm.hidden = !isLogin;
        signupForm.hidden = isLogin;

        tabLogin.classList.toggle("active", isLogin);
        tabSignup.classList.toggle("active", !isLogin);
        tabLogin.setAttribute("aria-selected", String(isLogin));
        tabSignup.setAttribute("aria-selected", String(!isLogin));

        clearMsgs();
    }

    tabLogin.addEventListener("click", () => showTab("login"));
    tabSignup.addEventListener("click", () => showTab("signup"));

    // login.html?tab=signup opens the Sign Up tab directly
    if (new URLSearchParams(location.search).get("tab") === "signup") showTab("signup");


    /* ---------- sign up form: dept + program ---------- */

    addOption(suDepartment, "", "Dept.", true);
    OC_DEPARTMENTS.forEach(d => addOption(suDepartment, d, d));
    suDepartment.value = "";

    addOption(suProgram, "", "Course", true);
    OC_PROGRAMS.forEach(([value, label]) => addOption(suProgram, value, label));
    suProgram.value = "";

    // Program only usable when department = COLLEGE (same rule as the rest of the app)
    function syncProgram() {
        const isCollege = suDepartment.value === "COLLEGE";
        suProgram.disabled = !isCollege;
        if (!isCollege) suProgram.value = "";
    }
    suDepartment.addEventListener("change", syncProgram);
    syncProgram();


    /* ---------- log in ---------- */

    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = normalizeEmail(loginEmail.value);
        const problem = emailError(email);
        if (problem) return showMsg(loginMsg, problem);

        const user = UserStore.getByEmail(email);
        if (!user) {
            return showMsg(loginMsg, "No account found for this email. Please sign up first.");
        }

        try {
            UserStore.update(email, { lastLogin: new Date().toISOString() });
        } catch (err) {
            console.error(err);
            return showMsg(loginMsg, "Could not log in. Browser storage may be full or blocked.");
        }

        Session.set(email);
        const profileDone = Boolean(user.name && user.department);
        location.href = profileDone ? PAGES.home : PAGES.profile + "?welcome=1";
    });


    /* ---------- sign up ---------- */

    signupForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = suName.value.trim();
        const email = normalizeEmail(suEmail.value);
        const isCollege = suDepartment.value === "COLLEGE";

        if (!suDepartment.value) return showMsg(signupMsg, "Please choose your department.");
        if (isCollege && !suProgram.value) return showMsg(signupMsg, "Please choose your program.");
        if (!name) return showMsg(signupMsg, "Please enter your full name.");

        const problem = emailError(email);
        if (problem) return showMsg(signupMsg, problem);

        if (UserStore.getByEmail(email)) {
            return showMsg(signupMsg, "This email already has an account. Please log in instead.");
        }

        try {
            UserStore.create(email, {
                name,
                department: suDepartment.value,
                program: isCollege ? suProgram.value : ""
            });
        } catch (err) {
            console.error(err);
            return showMsg(signupMsg, "Could not create the account. Browser storage may be full or blocked.");
        }

        Session.set(email);
        location.href = PAGES.home;
    });
})();
