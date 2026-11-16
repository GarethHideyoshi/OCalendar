/* ===========================================================
   announcement-store.js  -  shared data layer (localStorage)
   Load this FIRST on every page: dashboard, homepage, login, profile.
   Holds: AnnouncementStore, UserStore, Session
   =========================================================== */

const ANNOUNCEMENT_KEY = "announcements";
const USER_KEY = "users";
const SESSION_KEY = "currentUserEmail";

// Page file names - change here if you rename one (e.g. homepage.html -> index.html)
const PAGES = { home: "homepage.html", login: "login.html", profile: "profile.html" };

// Keep these in sync with the <select> options in dashboard.html
const OC_DEPARTMENTS = ["DPRO", "IBED", "COLLEGE", "MANAGEMENT"];
const OC_PROGRAMS = [
    ["Criminology, Arts and Sciences", "Criminology, Arts and Sciences"],
    ["Computer Studies", "College of Computer Studies"],
    ["Health Related Sciences", "College of Health Related Sciences"],
    ["Teacher Education", "College of Teacher Education"],
    ["Corporate and Management Education", "College of Corporate and Management Education"]
];


/* ---------- helpers ---------- */

function readJSON(key, fallback) {
    try {
        const v = JSON.parse(localStorage.getItem(key));
        return v === null || v === undefined ? fallback : v;
    } catch (err) {
        console.error(`Could not read "${key}":`, err);
        return fallback;
    }
}

function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value)); // throws if quota exceeded
}

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}


/* ---------- announcements ---------- */

const AnnouncementStore = {
    getAll() {
        const v = readJSON(ANNOUNCEMENT_KEY, []);
        return Array.isArray(v) ? v : [];
    },

    getByType(type) {
        return this.getAll().filter(a => a.contentType === type);
    },

    getById(id) {
        return this.getAll().find(a => a.id === id) || null;
    },

    add(data) {
        const list = this.getAll();
        const record = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            ...data
        };
        list.push(record);
        writeJSON(ANNOUNCEMENT_KEY, list);
        return record;
    },

    update(id, changes) {
        const list = this.getAll();
        const i = list.findIndex(a => a.id === id);
        if (i === -1) return null;
        list[i] = { ...list[i], ...changes, updatedAt: new Date().toISOString() };
        writeJSON(ANNOUNCEMENT_KEY, list);
        return list[i];
    },

    remove(id) {
        writeJSON(ANNOUNCEMENT_KEY, this.getAll().filter(a => a.id !== id));
    }
};


/* ---------- users (shown in the dashboard's User tab) ---------- */

const UserStore = {
    getAll() {
        const v = readJSON(USER_KEY, []);
        return Array.isArray(v) ? v : [];
    },

    getByEmail(email) {
        const e = normalizeEmail(email);
        return this.getAll().find(u => u.email === e) || null;
    },

    create(email, fields = {}) {
        const now = new Date().toISOString();
        const user = {
            name: "",
            department: "",
            program: "",
            ...fields,                      // name / department / program from the Sign Up form
            email: normalizeEmail(email),
            createdAt: now,
            lastLogin: now
        };
        const list = this.getAll();
        list.push(user);
        writeJSON(USER_KEY, list);
        return user;
    },

    update(email, changes) {
        const e = normalizeEmail(email);
        const list = this.getAll();
        const i = list.findIndex(u => u.email === e);
        if (i === -1) return null;
        list[i] = { ...list[i], ...changes, email: e };
        writeJSON(USER_KEY, list);
        return list[i];
    },

    remove(email) {
        const e = normalizeEmail(email);
        writeJSON(USER_KEY, this.getAll().filter(u => u.email !== e));
    }
};


/* ---------- session (who is signed in on this browser) ---------- */

const Session = {
    get() {
        const email = localStorage.getItem(SESSION_KEY);
        return email ? UserStore.getByEmail(email) : null;
    },

    set(email) {
        localStorage.setItem(SESSION_KEY, normalizeEmail(email));
    },

    clear() {
        localStorage.removeItem(SESSION_KEY);
    },

    // Use at the top of protected pages; sends visitors to the login page
    require() {
        const user = this.get();
        if (!user) {
            location.replace(PAGES.login);
            return null;
        }
        return user;
    }
};

window.AnnouncementStore = AnnouncementStore;
window.UserStore = UserStore;
window.Session = Session;
