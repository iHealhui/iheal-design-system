import { loadTokens, resolve, copyToClipboard } from "./utils.js";

export async function renderColorRolesPage() {
    const view = document.getElementById("content-view");
    if (!view) return;

    let data, root;
    try {
        ({ data, root } = await loadTokens());
    } catch (err) {
        console.error("Failed to load tokens.json", err);
        view.innerHTML = `<h1>COLOR ROLES</h1><p>無法載入 tokens.json，請稍後再試。</p>`;
        return;
    }

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

    let cssVars = ":root {\n";
    roleOrder.forEach((role) => {
        const group = bg[role];
        if (!group) return;
        stateOrder.forEach((state) => {
            const token = group[state];
            if (!token) return;
            const hex = resolve(token.$value, data);
            const varName = `--ihealtw-sys-bg-${role.toLowerCase().replace(/\s+/g, "-")}-${state
                .toLowerCase()
                .replace(/\s+/g, "-")}`;
            cssVars += `  ${varName}: ${hex};\n`;
        });
    });
    cssVars += "}\n";

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

    html += `<div class="ref-swatch-list">`;

    roleOrder.forEach((role) => {
        const group = bg[role];
        if (!group) return;

        html += `<h2 class="ref-group-title">${role}</h2>`;

        stateOrder.forEach((state) => {
            const token = group[state];
            if (!token) return;

            const hex = resolve(token.$value, data);
            const varName = `--ihealtw-sys-bg-${role.toLowerCase().replace(/\s+/g, "-")}-${state
                .toLowerCase()
                .replace(/\s+/g, "-")}`;

            html += `
                <div class="ref-swatch">
                    <div class="ref-color-box" style="background:${hex}"></div>

                    <div class="ref-col">
                        <span class="ref-label">Value · ${state}</span>
                        <button
                            class="ref-copy-btn"
                            type="button"
                            onclick="window.ihealtwCopy('${hex}')"
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
                            onclick="window.ihealtwCopy('${varName}')"
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

    const copyAllBtn = view.querySelector('[data-copy-all="color-roles"]');
    if (copyAllBtn) {
        copyAllBtn.addEventListener("click", () => copyToClipboard(cssVars));
    }
}

export async function renderColorPalettePage() {
    const view = document.getElementById("content-view");
    if (!view) return;

    let data, root;
    try {
        ({ data, root } = await loadTokens());
    } catch (err) {
        console.error("Failed to load tokens.json", err);
        view.innerHTML = `<h1>COLOR PALETTE</h1><p>無法載入 tokens.json，請稍後再試。</p>`;
        return;
    }

    const refColor = root.Ref && root.Ref.Color ? root.Ref.Color : {};

    let html = `
        <h1>COLOR PALETTE (REF)</h1>
        <p>基礎色票（Ref Color）。左側為實際顏色，中間為原始 Hex Value，右側為對應的 CSS 變數 Token。點擊 Value 或 Token 皆可複製文字。</p>
    `;

    html += `<div class="ref-swatch-list">`;

    for (const [group, colors] of Object.entries(refColor)) {
        html += `<h2 class="ref-group-title">${group}</h2>`;

        for (const [shade, token] of Object.entries(colors)) {
            const hex = resolve(token.$value, data);
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
                            onclick="window.ihealtwCopy('${hex}')"
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
                            onclick="window.ihealtwCopy('var(${varName})')"
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
}
