// 1. 深度解析路徑
function resolve(val, data) {
    if (typeof val === 'string' && val.startsWith('{')) {
        const path = val.replace(/[{}]/g, '').split('.');
        let target = data;
        for (const part of path) {
            if (!target[part]) return '#eee';
            target = target[part];
        }
        return resolve(target.$value, data);
    }
    return (val && val.hex) ? val.hex : val;
}

// 2. 核心複製函式 (帶有回饋)
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        const toast = document.getElementById('toast');
        toast.innerText = `Copied: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`;
        toast.style.display = 'block';
        setTimeout(() => (toast.style.display = 'none'), 2000);
    } catch (err) {
        console.error('Copy failed', err);
    }
}

// 3. 頁面渲染邏輯
async function renderPage(pageId) {
    const view = document.getElementById('content-view');
    const res = await fetch('./data/tokens.json');
    const data = await res.json();
    const root = data.ihealtw;

    if (pageId === 'color-roles') {
        let cssVars = ':root {\n';
        let roleHtml =
            '<h1>Color Roles (Sys)</h1><p>語義化顏色定義。點擊卡片直接複製變數名稱。</p>';

        // 處理 Sys 下的分類
        for (const [category, themes] of Object.entries(root.Sys.Color)) {
            roleHtml += `<h2 style="margin-top:48px; border-bottom: 2px solid #eee; padding-bottom:8px;">${category}</h2><div class="token-grid">`;

            for (const [theme, states] of Object.entries(themes)) {
                for (const [state, token] of Object.entries(states)) {
                    const hex = resolve(token.$value, data);
                    const varName = `--ihealtw-sys-${category
                        .toLowerCase()
                        .replace(/\s+/g, '-')}-${theme
                        .toLowerCase()
                        .replace(/\s+/g, '-')}-${state.toLowerCase().replace(/\s+/g, '-')}`;
                    cssVars += `  ${varName}: ${hex};\n`;

                    roleHtml += `
                        <div class="swatch" onclick="copyToClipboard('${varName}')">
                            <div class="color-box" style="background:${hex}"></div>
                            <div class="swatch-info">
                                <strong>${theme} ${state}</strong>
                                <code>${varName}</code>
                                <span style="font-size:10px; color:#94a3b8; margin-top:4px; display:block;">Hex: ${hex}</span>
                            </div>
                        </div>`;
                }
            }
            roleHtml += `</div>`;
        }
        cssVars += '}';

        // 生成頂部的 Code Block
        const codeHeader = `
            <h3>Global CSS Variables</h3>
            <div class="code-container">
                <div class="code-header">
                    <span>css-variables.css</span>
                    <button class="btn-copy-all" onclick="copyToClipboard(\`${cssVars}\`)">Copy All Variables</button>
                </div>
                <pre class="code-block">${cssVars}</pre>
            </div>
        `;
        view.innerHTML = codeHeader + roleHtml;
    } else if (pageId === 'color-palette') {
    const view = document.getElementById('content-view');

    let html = `
        <h1>COLOR PALETTE (REF)</h1>
        <p>基礎色票（Ref Color）。左側為實際顏色，中間為原始 Hex Value，右側為對應的 CSS 變數 Token。點擊 Value 或 Token 皆可複製文字。</p>
    `;

    html += `<div class="ref-swatch-list">`;

    // root.Ref.Color 結構：root.Ref.Color.[Group].[Shade] => token
    for (const [group, colors] of Object.entries(root.Ref.Color)) {
        html += `<h2 class="ref-group-title">${group}</h2>`;

        for (const [shade, token] of Object.entries(colors)) {
            const hex = resolve(token.$value, data);

            // 生成 token 名稱：--ihealtw-ref-color-Group-Shade
            const safeGroup = group.replace(/\s+/g, '');
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
                            <span class="ref-copy-text">${hex}</span>
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
                            <span class="ref-copy-text">var(${varName})</span>
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

    } else if (pageId === 'tokens') {
        view.innerHTML = `
            <h1>Tokens</h1>
            <p>命名規則解釋與應用範例（此區之後可以補完整文檔）。</p>
        `;
    } else if (pageId === 'welcome') {
        view.innerHTML = `
            <h1>Welcome</h1>
            <p>這裡是 iHealtw Design System 首頁，你可以在左側選擇 Foundations / Components 來瀏覽。</p>
        `;
    } else {
        view.innerHTML = `<h1>${pageId.replace('-', ' ')}</h1><p>此頁面內容建設中...</p>`;
    }
}

// 4. 搜尋與導航初始化
document.querySelectorAll('.nav-item, .nav-item-flat').forEach((item) => {
    item.addEventListener('click', function () {
        document.querySelectorAll('.active').forEach((a) => a.classList.remove('active'));
        this.classList.add('active');
        renderPage(this.getAttribute('data-target'));
    });
});

document.getElementById('componentSearch').addEventListener('input', function (e) {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.nav-item, .nav-item-flat').forEach((item) => {
        const match = item.innerText.toLowerCase().includes(query);
        item.style.display = match ? 'flex' : 'none';
        if (match && query) {
            let p = item.closest('details');
            while (p) {
                p.open = true;
                p = p.parentElement.closest('details');
            }
        }
    });
});

// 預設載入 welcome 頁
renderPage('welcome');
