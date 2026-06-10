import "./style.css";
import { initAds, maybeShowInterstitial } from "./ads";
import { RedactionEditor, type Mode, type Tool } from "./editor";
import { detectLocale, getStrings, type Locale } from "./strings";

let locale: Locale = detectLocale();
let t = getStrings(locale);

let tool: Tool = "brush";
let mode: Mode = "solid";
let brushSize = 36;

const app = document.querySelector<HTMLDivElement>("#app")!;

function renderShell(): void {
  app.innerHTML = `
    <header class="topbar">
      <div class="brand"><span class="brand-icon">▮</span> ${t.appName}</div>
      <div class="locale-toggle">
        <button data-loc="tr" class="${locale === "tr" ? "active" : ""}">TR</button>
        <button data-loc="en" class="${locale === "en" ? "active" : ""}">EN</button>
      </div>
    </header>

    <p class="tagline">${t.tagline}</p>
    <p class="privacy-note">${t.privacyNote}</p>

    <section id="drop-zone" class="drop-zone">
      <div class="drop-title">${t.dropTitle}</div>
      <p class="drop-sub">${t.dropSub}</p>
      <button id="pick-btn" class="pick-btn">${t.pickBtn}</button>
      <p class="paste-hint">${t.pasteHint}</p>
      <input id="file-input" type="file" accept="image/png,image/jpeg,image/webp" hidden />
    </section>

    <section id="editor" class="editor hidden">
      <div class="toolbar">
        <div class="tool-group" role="group" aria-label="tool">
          <button data-tool="brush" class="chip active">🖌 ${t.toolBrush}</button>
          <button data-tool="rect" class="chip">▭ ${t.toolRect}</button>
        </div>
        <div class="tool-group" role="group" aria-label="mode">
          <button data-mode="solid" class="chip active">⬛ ${t.modeSolid}</button>
          <button data-mode="blur" class="chip">💧 ${t.modeBlur}</button>
          <button data-mode="pixelate" class="chip">🟦 ${t.modePixelate}</button>
        </div>
        <label class="size-control">
          ${t.brushSize}
          <input id="size-range" type="range" min="10" max="120" value="${brushSize}" />
        </label>
        <div class="tool-group">
          <button id="undo-btn" class="chip">↩ ${t.undo}</button>
          <button id="clear-btn" class="chip">🗑 ${t.clearAll}</button>
          <button id="new-btn" class="chip">🔄 ${t.newImage}</button>
        </div>
      </div>

      <div class="canvas-wrap">
        <canvas id="canvas"></canvas>
      </div>

      <div class="action-row">
        <button id="save-btn" class="primary-btn">${t.save}</button>
        <button id="share-btn" class="primary-btn secondary">${t.share}</button>
      </div>
      <p id="toast" class="toast hidden"></p>
    </section>

    <footer class="footer">${t.footer}</footer>
  `;
}

renderShell();
void initAds();

const dropZone = document.getElementById("drop-zone")!;
const editorSection = document.getElementById("editor")!;
const fileInput = document.getElementById("file-input") as HTMLInputElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const toast = document.getElementById("toast")!;

const editor = new RedactionEditor(canvas);

// ── Locale switching re-renders shell; simplest path is full reload of UI state ──
app.querySelectorAll<HTMLButtonElement>("[data-loc]").forEach((btn) => {
  btn.addEventListener("click", () => {
    localStorage.setItem("karala-locale", btn.dataset.loc!);
    window.location.reload();
  });
});

// ── Image intake: picker, drag-drop, paste ──
function acceptFile(file: File | undefined | null): void {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = async () => {
    await editor.loadImage(reader.result as string);
    dropZone.classList.add("hidden");
    editorSection.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

document.getElementById("pick-btn")!.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).id !== "pick-btn") fileInput.click();
});
fileInput.addEventListener("change", () => acceptFile(fileInput.files?.[0]));

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  acceptFile(e.dataTransfer?.files?.[0]);
});

window.addEventListener("paste", (e) => {
  const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
  if (item) acceptFile(item.getAsFile());
});

// ── Toolbar ──
editorSection.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach((btn) => {
  btn.addEventListener("click", () => {
    tool = btn.dataset.tool as Tool;
    editorSection.querySelectorAll("[data-tool]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});
editorSection.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    mode = btn.dataset.mode as Mode;
    editorSection.querySelectorAll("[data-mode]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});
(document.getElementById("size-range") as HTMLInputElement).addEventListener("input", (e) => {
  brushSize = Number((e.target as HTMLInputElement).value);
});

document.getElementById("undo-btn")!.addEventListener("click", () => editor.undo());
document.getElementById("clear-btn")!.addEventListener("click", () => editor.clearStrokes());
document.getElementById("new-btn")!.addEventListener("click", () => {
  editor.reset();
  fileInput.value = "";
  editorSection.classList.add("hidden");
  dropZone.classList.remove("hidden");
});

// ── Pointer drawing (mouse + touch via pointer events) ──
let drawing = false;
let rectStart: { x: number; y: number } | null = null;

function canvasPoint(e: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}

/** Brush size is given in screen px; convert to image px so it feels constant. */
function imageBrushSize(): number {
  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  return brushSize * scale;
}

canvas.addEventListener("pointerdown", (e) => {
  if (!editor.hasImage) return;
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  drawing = true;
  const p = canvasPoint(e);
  if (tool === "brush") {
    editor.addStroke({ tool: "brush", mode, size: imageBrushSize(), points: [p] });
  } else {
    rectStart = p;
    editor.addStroke({ tool: "rect", mode, x: p.x, y: p.y, w: 0, h: 0 });
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  e.preventDefault();
  const p = canvasPoint(e);
  if (tool === "brush") {
    editor.extendBrush(p);
  } else if (rectStart) {
    editor.replaceLastStroke({
      tool: "rect",
      mode,
      x: Math.min(rectStart.x, p.x),
      y: Math.min(rectStart.y, p.y),
      w: Math.abs(p.x - rectStart.x),
      h: Math.abs(p.y - rectStart.y),
    });
  }
});

function endStroke(): void {
  drawing = false;
  rectStart = null;
}
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);

// ── Export ──
function showToast(message: string): void {
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 2200);
}

async function exportImage(): Promise<Blob | null> {
  if (editor.strokeCount === 0) {
    showToast(t.emptyWarn);
    return null;
  }
  return editor.exportBlob();
}

document.getElementById("save-btn")!.addEventListener("click", async () => {
  const blob = await exportImage();
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `karala-${Date.now()}.png`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(t.saved);
  void maybeShowInterstitial();
});

document.getElementById("share-btn")!.addEventListener("click", async () => {
  const blob = await exportImage();
  if (!blob) return;
  const file = new File([blob], `karala-${Date.now()}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      void maybeShowInterstitial();
    } catch {
      // user cancelled the share sheet — not an error
    }
  } else {
    // desktop fallback: behave like save
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t.saved);
  }
});
