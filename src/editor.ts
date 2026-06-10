export type Tool = "brush" | "rect";
export type Mode = "solid" | "blur" | "pixelate";

interface BrushStroke {
  tool: "brush";
  mode: Mode;
  size: number;
  points: Array<{ x: number; y: number }>;
}

interface RectStroke {
  tool: "rect";
  mode: Mode;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Stroke = BrushStroke | RectStroke;

const BLUR_RADIUS_FRACTION = 1 / 60; // relative to image size, so blur strength scales
const PIXEL_BLOCK_FRACTION = 1 / 50;

/**
 * Holds the original image plus a redo-able list of redaction strokes and
 * renders the composite onto a target canvas.
 */
export class RedactionEditor {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private image: HTMLImageElement | null = null;
  private strokes: Stroke[] = [];
  private blurLayer: HTMLCanvasElement | null = null;
  private pixelLayer: HTMLCanvasElement | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
  }

  get hasImage(): boolean {
    return this.image !== null;
  }

  get strokeCount(): number {
    return this.strokes.length;
  }

  async loadImage(src: string): Promise<void> {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image load failed"));
      img.src = src;
    });
    this.image = img;
    this.strokes = [];
    this.canvas.width = img.naturalWidth;
    this.canvas.height = img.naturalHeight;
    this.buildEffectLayers();
    this.render();
  }

  reset(): void {
    this.image = null;
    this.strokes = [];
    this.blurLayer = null;
    this.pixelLayer = null;
  }

  addStroke(stroke: Stroke): void {
    this.strokes.push(stroke);
    this.render();
  }

  /** Replace the last stroke (used for live rect preview). */
  replaceLastStroke(stroke: Stroke): void {
    this.strokes[this.strokes.length - 1] = stroke;
    this.render();
  }

  extendBrush(point: { x: number; y: number }): void {
    const last = this.strokes[this.strokes.length - 1];
    if (last && last.tool === "brush") {
      last.points.push(point);
      this.render();
    }
  }

  undo(): void {
    this.strokes.pop();
    this.render();
  }

  clearStrokes(): void {
    this.strokes = [];
    this.render();
  }

  /** Pre-render blurred and pixelated copies once per image for fast clipping. */
  private buildEffectLayers(): void {
    if (!this.image) return;
    const w = this.image.naturalWidth;
    const h = this.image.naturalHeight;

    const blur = document.createElement("canvas");
    blur.width = w;
    blur.height = h;
    const bctx = blur.getContext("2d")!;
    const radius = Math.max(8, Math.round(Math.max(w, h) * BLUR_RADIUS_FRACTION));
    bctx.filter = `blur(${radius}px)`;
    bctx.drawImage(this.image, 0, 0);
    // second pass strengthens the blur so text is unreadable
    bctx.drawImage(blur, 0, 0);
    this.blurLayer = blur;

    const block = Math.max(6, Math.round(Math.max(w, h) * PIXEL_BLOCK_FRACTION));
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.round(w / block));
    small.height = Math.max(1, Math.round(h / block));
    const sctx = small.getContext("2d")!;
    sctx.drawImage(this.image, 0, 0, small.width, small.height);
    const pixel = document.createElement("canvas");
    pixel.width = w;
    pixel.height = h;
    const pctx = pixel.getContext("2d")!;
    pctx.imageSmoothingEnabled = false;
    pctx.drawImage(small, 0, 0, w, h);
    this.pixelLayer = pixel;
  }

  private pathForStroke(stroke: Stroke): Path2D {
    const path = new Path2D();
    if (stroke.tool === "rect") {
      path.rect(stroke.x, stroke.y, stroke.w, stroke.h);
      return path;
    }
    const r = stroke.size / 2;
    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      path.arc(p.x, p.y, r, 0, Math.PI * 2);
      return path;
    }
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const a = stroke.points[i];
      const b = stroke.points[i + 1];
      // capsule between consecutive points
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const dx = Math.cos(angle + Math.PI / 2) * r;
      const dy = Math.sin(angle + Math.PI / 2) * r;
      path.moveTo(a.x + dx, a.y + dy);
      path.lineTo(b.x + dx, b.y + dy);
      path.arc(b.x, b.y, r, angle + Math.PI / 2, angle - Math.PI / 2, true);
      path.lineTo(a.x - dx, a.y - dy);
      path.arc(a.x, a.y, r, angle - Math.PI / 2, angle + Math.PI / 2, true);
    }
    return path;
  }

  render(): void {
    if (!this.image) return;
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.image, 0, 0);

    for (const stroke of this.strokes) {
      const path = this.pathForStroke(stroke);
      ctx.save();
      ctx.clip(path);
      if (stroke.mode === "solid") {
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      } else if (stroke.mode === "blur" && this.blurLayer) {
        ctx.drawImage(this.blurLayer, 0, 0);
      } else if (stroke.mode === "pixelate" && this.pixelLayer) {
        ctx.drawImage(this.pixelLayer, 0, 0);
      }
      ctx.restore();
    }
  }

  /** Re-encode strips all EXIF/location metadata by design. */
  async exportBlob(): Promise<Blob> {
    this.render();
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("export failed"))),
        "image/png"
      );
    });
  }
}
