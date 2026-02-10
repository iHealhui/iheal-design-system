import { copyToClipboard } from "./utils.js";

export async function renderButtonPage() {
    const view = document.getElementById("content-view");
    if (!view) return;

    const buttonTokens = [
        {
            usage: "Primary · Filled · Bg · Default",
            desc: "主行動按鈕預設背景色",
            token: "--ihealtw-comp-button-primary-filled-bg-default"
        },
        {
            usage: "Primary · Filled · Bg · Hover",
            desc: "主行動按鈕滑過背景色",
            token: "--ihealtw-comp-button-primary-filled-bg-hover"
        },
        {
            usage: "Neutral · Filled · Bg · Default",
            desc: "中性按鈕預設背景色",
            token: "--ihealtw-comp-button-neutral-filled-bg-default"
        },
        {
            usage: "Danger · Filled · Bg · Default",
            desc: "危險操作按鈕預設背景色",
            token: "--ihealtw-comp-button-danger-filled-bg-default"
        }
    ];

    let html = `
        <h1>BUTTON</h1>
        <p>Button 用於觸發操作。以下依語意分為 Primary / Neutral / Danger 三塊，每一塊都可以切換 Shape、Variant、Size 與 State，並提供 HTML 程式碼可直接複製。</p>

        <section class="button-tokens">
            <h2>Component Tokens（背景示意）</h2>
            <p>以下列出部分與按鈕背景相關的 Component tokens，後續可擴充 Border / Text 等。點擊右側按鈕可直接複製 token 名稱。</p>
            <div class="button-token-list">
    `;

    buttonTokens.forEach((t) => {
        html += `
            <div class="button-token-row">
                <div class="button-token-meta">
                    <div class="button-token-usage">${t.usage}</div>
                    <div class="button-token-desc">${t.desc}</div>
                </div>
                <button
                    class="ref-copy-btn"
                    type="button"
                    onclick="window.ihealtwCopy('${t.token}')"
                >
                    <span class="ref-copy-text ref-copy-text--token">${t.token}</span>
                    <img
                        class="ref-copy-icon"
                        src="./assets/icons/copy.svg"
                        alt="Copy token"
                    />
                </button>
            </div>
        `;
    });

    html += `
            </div>
        </section>

        ${createButtonSectionHTML("primary", "Primary buttons", "用於最主要的行動，例如表單送出、流程下一步。")}
        ${createButtonSectionHTML("neutral", "Neutral buttons", "用於次要 / 中性的操作，例如次要動作、工具列。")}
        ${createButtonSectionHTML("danger", "Danger buttons", "用於刪除、取消、不可逆操作。顏色需強烈警示。")}
    `;

    view.innerHTML = html;

    setupButtonSections(view);
}

/* 產生每個 section 的 HTML 結構 */
function createButtonSectionHTML(semantic, title, desc) {
    const variantOptions =
        semantic === "danger"
            ? `<option value="filled">Filled</option>`
            : `
                <option value="filled">Filled</option>
                <option value="outlined">Outlined</option>
                <option value="subtle">Subtle</option>
              `;

    const label =
        semantic === "primary"
            ? "Primary button"
            : semantic === "neutral"
            ? "Neutral button"
            : "Danger button";

    return `
        <section class="button-section" data-semantic="${semantic}">
            <h2>${title}</h2>
            <p>${desc}</p>

            <div class="button-controls">
                <div class="button-control">
                    <label>
                        Shape
                        <select data-control="shape">
                            <option value="pill">Fully-rounded</option>
                            <option value="md">Semi-rounded</option>
                            <option value="none">None-rounded</option>
                        </select>
                    </label>
                </div>

                <div class="button-control">
                    <label>
                        Variant
                        <select data-control="variant">
                            ${variantOptions}
                        </select>
                    </label>
                </div>

                <div class="button-control">
                    <label>
                        Size
                        <select data-control="size">
                            <option value="lg">Large</option>
                            <option value="md" selected>Medium</option>
                            <option value="sm">Small</option>
                        </select>
                    </label>
                </div>

                <div class="button-control">
                    <label>
                        State（視覺預覽用）
                        <select data-control="state">
                            <option value="default">Default</option>
                            <option value="hover">Hover</option>
                            <option value="pressed">Pressed</option>
                            <option value="focus">Focus</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </label>
                </div>
            </div>

            <div class="demo-card" data-demo="${semantic}">
                <div class="demo-preview">
                    <button class="btn">${label}</button>
                </div>
                <div class="demo-toolbar">
                    <button class="demo-icon-btn demo-toggle-code" type="button">&lt;/&gt; code</button>
                    <button class="demo-icon-btn demo-copy-code" type="button">⧉ copy</button>
                </div>
                <pre class="demo-code"><code></code></pre>
            </div>
        </section>
    `;
}

/* 綁定三個 section 的互動行為 */
function setupButtonSections(rootEl) {
    const configs = {
        primary: { label: "Primary button" },
        neutral: { label: "Neutral button" },
        danger: { label: "Danger button" }
    };

    Object.keys(configs).forEach((semantic) => {
        const section = rootEl.querySelector(`.button-section[data-semantic="${semantic}"]`);
        if (!section) return;

        const config = configs[semantic];
        const card = section.querySelector(".demo-card");
        const previewBtn = card.querySelector(".demo-preview .btn");
        const codeBlock = card.querySelector(".demo-code code");
        const shapeSelect = section.querySelector('[data-control="shape"]');
        const variantSelect = section.querySelector('[data-control="variant"]');
        const sizeSelect = section.querySelector('[data-control="size"]');
        const stateSelect = section.querySelector('[data-control="state"]');
        const toggleCodeBtn = card.querySelector(".demo-toggle-code");
        const copyCodeBtn = card.querySelector(".demo-copy-code");

        function update() {
            const shape = shapeSelect.value;
            const variant = variantSelect.value;
            const size = sizeSelect.value;
            const state = stateSelect.value;

            const classes = [
                "btn",
                `btn--${semantic}`,
                `btn--${variant}`,
                `btn--size-${size}`,
                `btn--radius-${shape}`
            ];

            previewBtn.className = classes.join(" ");
            previewBtn.textContent = config.label;

            previewBtn.classList.remove("is-hover", "is-pressed", "is-focus", "is-disabled");
            previewBtn.disabled = false;

            if (state === "hover") {
                previewBtn.classList.add("is-hover");
            } else if (state === "pressed") {
                previewBtn.classList.add("is-pressed");
            } else if (state === "focus") {
                previewBtn.classList.add("is-focus");
            } else if (state === "disabled") {
                previewBtn.classList.add("is-disabled");
                previewBtn.disabled = true;
            }

            const disabledAttr = state === "disabled" ? " disabled" : "";
            const code = `<button class="${classes.join(" ")}"${disabledAttr}>
  ${config.label}
</button>`;
            codeBlock.textContent = code;
        }

        [shapeSelect, variantSelect, sizeSelect, stateSelect].forEach((el) => {
            el.addEventListener("change", update);
        });

        if (toggleCodeBtn) {
            toggleCodeBtn.addEventListener("click", () => {
                card.classList.toggle("show-code");
            });
        }

        if (copyCodeBtn) {
            copyCodeBtn.addEventListener("click", () => {
                copyToClipboard(codeBlock.textContent || "");
            });
        }

        update();
    });
}
