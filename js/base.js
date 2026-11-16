/* ===========================================================
   base.js  -  "Details" expand / collapse (same idea as before)
   =========================================================== */

const getRoot = document.documentElement;
const moreDetails = document.getElementById("ID-btn-detail");

let boolExpand = false;

const LAYOUT = {
    expanded: {
        "--image-height": "70px",
        "--description-height": "150px",
        "--display-3rd-row-height": "150px",
        "--display-1st-row-height": "0px",
        "--department-Yscale": "0"
    },
    collapsed: {
        "--image-height": "170px",
        "--description-height": "0px",
        "--display-3rd-row-height": "0px",
        "--display-1st-row-height": "30px",
        "--department-Yscale": "1"
    }
};

function applyLayout(vars) {
    Object.entries(vars).forEach(([name, value]) => getRoot.style.setProperty(name, value));
}

moreDetails.addEventListener("click", function () {
    // Nothing selected -> nothing to expand
    if (moreDetails.classList.contains("disabled")) return;

    boolExpand = !boolExpand;
    applyLayout(boolExpand ? LAYOUT.expanded : LAYOUT.collapsed);
    moreDetails.textContent = boolExpand ? "Less" : "Details";
});
