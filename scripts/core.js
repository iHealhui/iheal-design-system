import { copyToClipboard } from "./utils.js";
import { renderColorRolesPage, renderColorPalettePage } from "./page.color.js";
import { renderButtonPage } from "./page.button.js";

// 讓 HTML 上 onclick="window.ihealtwCopy(...)" 可以用
window.ihealtwCopy = (text) => copyToClipboard(text);

// 主路由函式：依 pageId 呼叫不同頁面
async function renderPage(pageId) {
    const view = document.getElementById("content-view");
    if (!view) return;

    if (pageId === "color-roles") {
        await renderColorRolesPage();
        return;
    }

    if (pageId === "color-palette") {
        await renderColorPalettePage();
        return;
    }

    if (pageId === "button") {
        await renderButtonPage();
        return;
    }

    if (pageId === "tokens") {
        view.innerHTML = `
            <h1>TOKENS</h1>
            <p>命名規則解釋與應用範例。此頁將說明 Ref / Sys / Comp 三層 token 如何對應，以及如何在 CSS / Web Components 中實際使用。</p>
        `;
        return;
    }

    if (pageId === "welcome") {
        view.innerHTML = `
            <h1>WELCOME</h1>
            <p>這裡是 iHealtw Design System 首頁。請從左側選擇 Foundations 或 Components，瀏覽顏色、字體、間距與元件規範。</p>
        `;
        return;
    }

    // 其他尚未建置的頁面
    const title = pageId.replace(/-/g, " ").toUpperCase();
    view.innerHTML = `
        <h1>${title}</h1>
        <p>建置中...</p>
    `;
}

// Nav 點擊：加 active + 換頁
document
    .querySelectorAll(".nav-item[data-target], .nav-item-flat[data-target]")
    .forEach((item) => {
        item.addEventListener("click", function () {
            document.querySelectorAll(".active").forEach((a) => a.classList.remove("active"));
            this.classList.add("active");

            const target = this.getAttribute("data-target");
            if (target) {
                renderPage(target);
            }
        });
    });

// Color 收合控制
(function setupColorCollapse() {
    const toggle = document.querySelector(".nav-collapser[data-submenu-id]");
    if (!toggle) return;

    const submenuId = toggle.getAttribute("data-submenu-id");
    const submenu = document.getElementById(submenuId);
    const chevron = toggle.querySelector(".nav-chevron");

    if (!submenu) return;

    toggle.addEventListener("click", () => {
        const collapsed = submenu.classList.toggle("nav-sublist--collapsed");
        toggle.classList.toggle("is-open", !collapsed);
        if (chevron) {
            // transform 由 CSS 控制 .is-open 狀態
        }
    });
})();

// 搜尋：依文字隱藏 / 顯示 nav 項目
const searchInput = document.getElementById("componentSearch");
if (searchInput) {
    searchInput.addEventListener("input", function (e) {
        const query = e.target.value.toLowerCase();

        document.querySelectorAll(".nav-item, .nav-item-flat").forEach((item) => {
            const match = item.innerText.toLowerCase().includes(query);
            item.style.display = match || !query ? "flex" : "none";
        });
    });
}

// 初始載入 welcome
renderPage("welcome");
