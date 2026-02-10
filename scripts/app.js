// 1. 深度解析 Figma Tokens 路徑，例如 "{ihealtw.Ref.Color.DarkTealBlue.10}"
function resolve(val, data) {
    if (typeof val === "string" && val.startsWith("{")) {
        const path = val.replace(/[{}]/g, "").split(".");
        let target = data;
        for (const part of path) {
            if (!target[part]) return "#eee";
            target = target[part];
        }
        return resolve(target.$value, data);
    }
    return val && val.hex ? val.hex : val;
}

// 2. 核心複製函式：顯示 toast
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        const toast = document.getElementById("toast");
        if (!toast) return;
        toast.innerText = `Copied: ${text.substring(0, 40)}${text.length > 40 ? "..." : ""}`;
        toast.style.display = "block";
        setTimeout(() => (toast.style.display = "none"), 2000);
    } catch (err) {
        console.error("Copy failed", err);
    }
}

// 3. 主渲染函式：依 pageId 決定要顯示的內容
async function renderPage(pageId) {
    const view = document.getElementById("content-view");
    if (!view) return;

    let data, root;
    try {
        const res = await fetch("./data/tokens.json");
        data = await res.json();
        root = data.ihealtw || data; // 保險處理
    } catch (err) {
        console.error("Failed to load tokens.json", err);
        view.innerHTML = `<h1>${pageId.toUpperCase()}</h1><p>無法載入 tokens.json，請稍後再試。</p>`;
        return;
    }

    // ========== COLOR ROLES（Sys.Color.Bg）==========
    if (pageId === "color-roles") {
        const bg = root.Sys && root.Sys.Color && root.Sys.Color.Bg ? root.Sys.Color.Bg : {};
        const roleOrder = ["Primary", "Neutral", "Danger", "Success", "Info"];
        const stateOrder = [
            "Default",
            "Hover",
            "Soft-hover",
            "Pressed",
            "Soft-pressed",
            "Focus",
            "Disabled"
        ];

        // 1) 組出 :root 變數內容
        let cssVars = ":root {\n";
        roleOrder.forEach((role) => {
            const group = bg[role];
            if (!group) return;
            stateOrder.forEach((state) => {
                const token = group[state];
                if (!token) return;
                const hex = resolve(token.$value, data);
                const varName = `--ihealtw-sys-bg-${role
                    .toLowerCase()
                    .replace(/\s+/g, "-")}-${state.toLowerCase().replace(/\s+/g, "-")}`;
                cssVars += `  ${varName}: ${hex};\n`;
            });
        });
        cssVars += "}\n";

        // 2) 頁面標題 + 可收合的 CSS Variables 區塊
        let html = `
            <h1>COLOR ROLES – BACKGROUND</h1>
            <p>以 <code>Sys.Color.Bg.[Role].[State]</code> 為主，對應到底層 Ref Color。左側為實際顏色，中間為該狀態的 Hex Value，右側為對應的 CSS 變數 Token。</p>

            <details class="code-collapsible">
                <summary>
                    <div class="code-header">
                        <div class="code-header-main">
                            <span>css-variables.css</span>
                            <span class="code-header-hint">點擊展開 / 收合全部變數</span>
                        </div>
                        <button class="btn-copy-all" type="button" data-copy-all="color-roles">
                            Copy All Variables
                        </button>
                    </div>
                </summary>
                <pre class="code-block">${cssVars}</pre>
            </details>
        `;

        // 3) 使用與 Color Palette 相同的卡片樣式
        html += `<div class="ref-swatch-list">`;

        roleOrder.forEach((role) => {
            const group = bg[role];
            if (!group) return;

            html += `<h2 class="ref-group-title">${role}</h2>`;

            stateOrder.forEach((state) => {
                const token = group[state];
                if (!token) return;

                const hex = resolve(token.$value, data);
                const varName = `--ihealtw-sys-bg-${role
                    .toLowerCase()
                    .replace(/\s+/g, "-")}-${state.toLowerCase().replace(/\s+/g, "-")}`;

                html += `
                    <div class="ref-swatch">
                        <div class="ref-color-box" style="background:${hex}"></div>

                        <div class="ref-col">
                            <span class="ref-label">Value · ${state}</span>
                            <button
                                class="ref-copy-btn"
                                type="button"
                                onclick="copyToClipboard('${hex}')"
                            >
                                <span class="ref-copy-text ref-copy-text--value">${hex}</span>
                                <img
                                    class="ref-copy-icon"
                                    src="./assets/icons/copy.svg"
                                    alt="Copy value"
                                />
                            </button>
                        </div>

                        <div class="ref-col">
                            <span class="ref-label">Token (Background)</span>
                            <button
                                class="ref-copy-btn"
                                type="button"
                                onclick="copyToClipboard('${varName}')"
                            >
                                <span class="ref-copy-text ref-copy-text--token">${varName}</span>
                                <img
                                    class="ref-copy-icon"
                                    src="./assets/icons/copy.svg"
                                    alt="Copy token"
                                />
                            </button>
                        </div>
                    </div>
                `;
            });
        });

        html += `</div>`;
        view.innerHTML = html;

        // 綁定「Copy All Variables」按鈕
        const copyAllBtn = view.querySelector('[data-copy-all="color-roles"]');
        if (copyAllBtn) {
            copyAllBtn.addEventListener("click", () => copyToClipboard(cssVars));
        }

        return;
    }

    // ========== COLOR PALETTE（Ref.Color）==========
    if (pageId === "color-palette") {
        const refColor = root.Ref && root.Ref.Color ? root.Ref.Color : {};

        let html = `
            <h1>COLOR PALETTE (REF)</h1>
            <p>基礎色票（Ref Color）。左側為實際顏色，中間為原始 Hex Value，右側為對應的 CSS 變數 Token。點擊 Value 或 Token 皆可複製文字。</p>
        `;

        html += `<div class="ref-swatch-list">`;

        // root.Ref.Color.[Group].[Shade] => token
        for (const [group, colors] of Object.entries(refColor)) {
            html += `<h2 class="ref-group-title">${group}</h2>`;

            for (const [shade, token] of Object.entries(colors)) {
                const hex = resolve(token.$value, data);

                // --ihealtw-ref-color-DarkTealBlue-10
                const safeGroup = group.replace(/\s+/g, "");
                const varName = `--ihealtw-ref-color-${safeGroup}-${shade}`;

                html += `
                    <div class="ref-swatch">
                        <div class="ref-color-box" style="background:${hex}"></div>

                        <div class="ref-col">
                            <span class="ref-label">Value</span>
                            <button
                                class="ref-copy-btn"
                                type="button"
                                onclick="copyToClipboard('${hex}')"
                            >
                                <span class="ref-copy-text ref-copy-text--value">${hex}</span>
                                <img
                                    class="ref-copy-icon"
                                    src="./assets/icons/copy.svg"
                                    alt="Copy value"
                                />
                            </button>
                        </div>

                        <div class="ref-col">
                            <span class="ref-label">Token (Variable)</span>
                            <button
                                class="ref-copy-btn"
                                type="button"
                                onclick="copyToClipboard('var(${varName})')"
                            >
                                <span class="ref-copy-text ref-copy-text--token">var(${varName})</span>
                                <img
                                    class="ref-copy-icon"
                                    src="./assets/icons/copy.svg"
                                    alt="Copy token"
                                />
                            </button>
                        </div>
                    </div>
                `;
            }
        }

        html += `</div>`;
        view.innerHTML = html;
        return;
    }

    // ========== TOKENS 頁（暫時簡單文案）==========
    if (pageId === "tokens") {
        view.innerHTML = `
            <h1>TOKENS</h1>
            <p>命名規則解釋與應用範例。此頁將說明 Ref / Sys / Comp 三層 token 如何對應，以及如何在 CSS / Web Components 中實際使用。</p>
        `;
        return;
    }

    // ========== WELCOME 頁 ==========
    if (pageId === "welcome") {
        view.innerHTML = `
            <h1>WELCOME</h1>
            <p>這裡是 iHealtw Design System 首頁。請從左側選擇 Foundations 或 Components，瀏覽顏色、字體、間距與元件規範。</p>
        `;
        return;
    }

    // ========== 其他尚未建置的頁面（預設）==========
    const title = pageId.replace(/-/g, " ").toUpperCase();
    view.innerHTML = `
        <h1>${title}</h1>
        <p>建置中...</p>
    `;
}

// 4. 導航點擊事件：左側側邊欄
document.querySelectorAll(".nav-item, .nav-item-flat").forEach((item) => {
    item.addEventListener("click", function () {
        document.querySelectorAll(".active").forEach((a) => a.classList.remove("active"));
        this.classList.add("active");

        const target = this.getAttribute("data-target");
        if (target) {
            renderPage(target);
        }
    });
});

// 5. 搜尋框：依文字隱藏 / 顯示 nav 項目，並展開 details
const searchInput = document.getElementById("componentSearch");
if (searchInput) {
    searchInput.addEventListener("input", function (e) {
        const query = e.target.value.toLowerCase();

        document.querySelectorAll(".nav-item, .nav-item-flat").forEach((item) => {
            const match = item.innerText.toLowerCase().includes(query);
            item.style.display = match ? "flex" : "none";

            if (match && query) {
                let p = item.closest("details");
                while (p) {
                    p.open = true;
                    p = p.parentElement && p.parentElement.closest
                        ? p.parentElement.closest("details")
                        : null;
                }
            }
        });
    });
}

// 6. 預設載入首頁
renderPage("welcome");
