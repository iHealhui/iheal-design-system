import { loadTokens, resolveColorToken, copyToClipboard } from "./utils.js";

function kebab(str) {
    return String(str)
        .trim()
        .replace(/[.\s/]+/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
}

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

    const colorSys = (root.Sys && root.Sys.Color) ? root.Sys.Color : {};

    const sections = [
        {
            sysKey: "Bg",
            cssCategory: "bg",
            label: "Background",
            description: "背景相關語意顏色，用於頁面底色、卡片、按鈕等。",
            rolesOrder: [
                "Surface",
                "Surface container",
                "Primary",
                "Neutral",
                "Danger",
                "Success",
                "Warning",
                "Info"
            ]
        },
        {
            sysKey: "Text",
            cssCategory: "text",
            label: "Text",
            description: "文字與 On-* 類顏色，確保在不同底色上有足夠對比。",
            rolesOrder: [
                "Surface",
                "Primary",
                "Neutral",
                "Danger",
                "Success"
            ]
        },
        {
            sysKey: "Border",
            cssCategory: "border",
            label: "Border",
            description: "邊框顏色，用於分隔、輪廓、可點擊元素邊界。",
            rolesOrder: [
                "Surface",
                "Surface container",
                "Primary",
                "Neutral",
                "Danger",
                "Success",
                "Info"
            ]
        },
        {
            sysKey: "State layers",
            cssCategory: "state-layer",
            label: "State layers",
            description: "狀態疊加層，通常搭配 Alpha 顏色，用於 hover / pressed 等互動疊色。",
            rolesOrder: [
                "Surface",
                "on-surface"
            ]
        }
    ];

    // 先組合 :root 裡的 CSS 變數（全部類別一起）
    let cssVars = ":root {\n";

    sections.forEach((section) => {
        const sysObj = colorSys[section.sysKey];
        if (!sysObj) return;

        const roles = section.rolesOrder || Object.keys(sysObj);
        roles.forEach((role) => {
            const group = sysObj[role];
            if (!group) return;

            const states = Object.keys(group);
            states.forEach((state) => {
                const token = group[state];
                if (!token) return;

                const colorInfo = resolveColorToken(token.$value, data);
                const roleK = kebab(role);
                const stateK = kebab(state);
                const varName = `--ihealtw-sys-${section.cssCategory}-${roleK}-${stateK}`;

                cssVars += `  ${varName}: ${colorInfo.cssColor};\n`;
            });
        });
    });

    cssVars += "}\n";

    // 組 HTML
    let html = `
        <h1>COLOR ROLES</h1>
        <p>Sys Color 將顏色依 <code>Bg / Text / Border / State layers</code> 與語意角色分組。左側為實際顏色（含透明度棋盤格），中間為色值，右側為對應的 CSS 變數 Token。</p>

        <details class="code-collapsible">
            <summary>
                <div class="code-header">
                    <div class="code-header-main">
                        <span>css-variables.css</span>
                        <span class="code-header-hint">點擊展開 / 收合全部 Sys Color 變數</span>
                    </div>
                    <button class="btn-copy-all" type="button" data-copy-all="color-roles">
                        Copy All Variables
                    </button>
                </div>
            </summary>
            <pre class="code-block">${cssVars}</pre>
        </details>

        <div class="ref-swatch-list">
    `;

    sections.forEach((section) => {
        const sysObj = colorSys[section.sysKey];
        if (!sysObj) return;

        html += `
            <h2 class="ref-group-title">${section.label}</h2>
            <p class="ref-group-desc">${section.description}</p>
        `;

        const roles = section.rolesOrder || Object.keys(sysObj);

        roles.forEach((role) => {
            const group = sysObj[role];
            if (!group) return;

            html += `<h3 class="ref-role-title">${role}</h3>`;

            const states = Object.keys(group);
            states.forEach((state) => {
                const token = group[state];
                if (!token) return;

                const colorInfo = resolveColorToken(token.$value, data);
                const roleK = kebab(role);
                const stateK = kebab(state);
                const varName = `--ihealtw-sys-${section.cssCategory}-${roleK}-${stateK}`;

                const displayValue =
                    colorInfo.alpha < 1
                        ? `${colorInfo.rgba} · α=${(colorInfo.alpha * 100).toFixed(0)}%`
                        : (colorInfo.hex || colorInfo.cssColor);

                const copyValue =
                    colorInfo.alpha < 1
                        ? colorInfo.rgba
                        : (colorInfo.hex || colorInfo.cssColor);

                html += `
                    <div class="ref-swatch">
                        <div class="ref-color-box">
                            <div class="ref-color-fill" style="background:${colorInfo.cssColor}"></div>
                        </div>

                        <div class="ref-col">
                            <span class="ref-label">Value · ${state}</span>
                            <button
                                class="ref-copy-btn"
                                type="button"
                                onclick="window.ihealtwCopy('${copyValue}')"
                            >
                                <span class="ref-copy-text ref-copy-text--value">${displayValue}</span>
                                <img
                                    class="ref-copy-icon"
                                    src="./assets/icons/copy.svg"
                                    alt="Copy value"
                                />
                            </button>
                        </div>

                        <div class="ref-col">
                            <span class="ref-label">Token</span>
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
        <p>基礎色票（Ref Color）。左側為實際顏色，中間為原始色值（含 alpha），右側為對應的 CSS 變數 Token。點擊 Value 或 Token 皆可複製文字。</p>
    `;

    html += `<div class="ref-swatch-list">`;

    for (const [group, colors] of Object.entries(refColor)) {
        html += `<h2 class="ref-group-title">${group}</h2>`;

        for (const [shade, token] of Object.entries(colors)) {
            const colorInfo = resolveColorToken(token.$value, data);
            const safeGroup = group.replace(/\s+/g, "");
            const varName = `--ihealtw-ref-color-${safeGroup}-${shade}`;

            const displayValue =
                colorInfo.alpha < 1
                    ? `${colorInfo.rgba} · α=${(colorInfo.alpha * 100).toFixed(0)}%`
                    : (colorInfo.hex || colorInfo.cssColor);

            const copyValue =
                colorInfo.alpha < 1
                    ? colorInfo.rgba
                    : (colorInfo.hex || colorInfo.cssColor);

            html += `
                <div class="ref-swatch">
                    <div class="ref-color-box">
                        <div class="ref-color-fill" style="background:${colorInfo.cssColor}"></div>
                    </div>

                    <div class="ref-col">
                        <span class="ref-label">Value</span>
                        <button
                            class="ref-copy-btn"
                            type="button"
                            onclick="window.ihealtwCopy('${copyValue}')"
                        >
                            <span class="ref-copy-text ref-copy-text--value">${displayValue}</span>
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
