// 載入 tokens.json
export async function loadTokens() {
    const res = await fetch("./data/tokens.json");
    const data = await res.json();
    const root = data.ihealtw || data;
    return { data, root };
}

// 深度解析 Figma token 路徑，例如 "{ihealtw.Ref.Color.DarkTealBlue.10}"
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
    return val && val.hex ? val.hex : val;
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
