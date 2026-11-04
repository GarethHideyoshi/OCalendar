/* ===========================================================
   users-view.js  -  dashboard "User" tab
   Read-only list of everyone who has signed in on the login page.
   Load AFTER announcements-view.js (reuses its el() helper).
   =========================================================== */

const userList = document.getElementById("userList");
const userCount = document.querySelector(".content-user .header-middle");

function buildUserRow(u) {
    const row = el("article", "user-row");
    row.appendChild(el("div", "user-avatar", (u.name || u.email).charAt(0)));

    const main = el("div", "user-main");
    main.appendChild(el("p", "user-name" + (u.name ? "" : " pending"), u.name || "Profile not completed"));
    main.appendChild(el("p", "user-email", u.email));

    const where = u.department
        ? (u.program ? `${u.department} - ${u.program}` : u.department)
        : "No department yet";
    main.appendChild(el("p", "user-meta", where));
    row.appendChild(main);

    const joined = u.createdAt
        ? new Date(u.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        : "";
    row.appendChild(el("span", "user-joined", joined ? `Joined ${joined}` : ""));

    return row;
}

function renderUsers() {
    if (!userList) return;

    const users = UserStore.getAll()
        .slice()
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    userList.replaceChildren();

    if (userCount) {
        userCount.textContent = `${users.length} user${users.length === 1 ? "" : "s"}`;
    }

    if (users.length === 0) {
        userList.appendChild(el("p", "announcement-empty", "No users have signed in yet."));
        return;
    }

    users.forEach(u => userList.appendChild(buildUserRow(u)));
}

renderUsers();
// Another tab (login / profile page) changed the users
window.addEventListener("storage", renderUsers);
