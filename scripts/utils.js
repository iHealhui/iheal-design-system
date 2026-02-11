// 載入 tokens.json
export async function loadTokens() {
    const res = await fetch("./data/tokens.json");
    const data = await res.json();
    const root = data.ihealtw || data;
    return { data, root };
}

// 舊版簡單解析（先保留，如果之後其他地方有用到）
export function resolve(val, data) {
    if (typeof val === "string" && val.startsWith("{")) {
        const path = val.replace(/[{}]/g, "").split(".");
        let target = data;
        for (const part of path) {
            if (!target[part]) return "#eee";
            target = target[part];
        }
        return resolve(target.$value, data);
    }
    if (val && val.hex) return val.hex;
    return val;
}

// ✅ 專門給「顏色 token」用的解析（包含 alpha）
export function resolveColorToken(val, data) {
    function inner(v) {
        // 1) 字串：可能是 {path}，也可能是 '#RRGGBB'
        if (typeof v === "string") {
            if (v.startsWith("{")) {
                const path = v.replace(/[{}]/g, "").split(".");
                let target = data;
                for (const part of path) {
                    if (!target[part]) return fallback();
                    target = target[part];
                }
                if (target && target.$value) {
                    return inner(target.$value);
                }
                return inner(target);
            }
            // 一般 hex 或 rgb string
            return {
                cssColor: v,
                hex: v,
                alpha: 1,
                rgba: v
            };
        }

        // 2) 物件：token 或 Figma color 結構
        if (v && typeof v === "object") {
            // token 物件：{ $value: {...} }
            if (v.$value) {
                return inner(v.$value);
            }

            // Figma Color 格式：colorSpace + components + alpha + hex
            if (v.colorSpace && Array.isArray(v.components)) {
                const comps = v.components;
                const r = Math.round((comps[0] ?? 0) * 255);
                const g = Math.round((comps[1] ?? 0) * 255);
                const b = Math.round((comps[2] ?? 0) * 255);
                const alpha = typeof v.alpha === "number" ? v.alpha : 1;
                const rgba = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
                const hex = v.hex || "#000000";

                return {
                    cssColor: rgba, // 給 style="background: ..."
                    hex,
                    alpha,
                    rgba
                };
            }

            // 一般 { hex: "#xxxxxx" }
            if (v.hex) {
                return {
                    cssColor: v.hex,
                    hex: v.hex,
                    alpha: 1,
                    rgba: v.hex
                };
            }
        }

        // 3) 兜不出來就用 fallback
        return fallback();
    }

    function fallback() {
        const rgba = "rgba(238, 238, 238, 1)";
        return {
            cssColor: rgba,
            hex: "#EEEEEE",
            alpha: 1,
            rgba
        };
    }

    return inner(val);
}

// 複製文字 + 顯示 toast
export async function copyToClipboard(text) {
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
