import type { TemplateConfig } from '../types';

/**
 * Renders a greeting card to a JPEG data URL using Canvas 2D API.
 * Reliable on both desktop and mobile — no html-to-image dependency.
 */
export async function renderCardToCanvas(
    template: TemplateConfig,
    userInputs: Record<string, string>,
    pixelRatio = 2,
    quality = 0.85,
): Promise<string> {
    const { dimensions, orientation, backgroundUrl, cardLanguage } = template;
    const lang = cardLanguage ?? 'en';

    const longSide = Math.max(dimensions.width, dimensions.height);
    const shortSide = Math.min(dimensions.width, dimensions.height);
    const w = orientation === 'landscape' ? longSide : shortSide;
    const h = orientation === 'landscape' ? shortSide : longSide;

    const canvas = document.createElement('canvas');
    canvas.width = w * pixelRatio;
    canvas.height = h * pixelRatio;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    ctx.scale(pixelRatio, pixelRatio);

    // ── 1. White background ─────────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // ── 2. Draw background image ────────────────────────────────────────
    if (backgroundUrl) {
        try {
            const img = await loadImage(backgroundUrl);

            // object-fit: cover
            const imgRatio = img.width / img.height;
            const canvasRatio = w / h;
            let sx = 0, sy = 0, sw = img.width, sh = img.height;

            if (imgRatio > canvasRatio) {
                sw = img.height * canvasRatio;
                sx = (img.width - sw) / 2;
            } else {
                sh = img.width / canvasRatio;
                sy = (img.height - sh) / 2;
            }

            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        } catch (e) {
            console.warn('Background image failed to load, using white background:', e);
        }
    }

    // ── 3. Preload fonts ────────────────────────────────────────────────
    //    Canvas 2D needs fonts loaded before fillText() can use them.
    try {
        const fontLoadPromises: Promise<FontFace[]>[] = [];
        const preloadSpans: HTMLSpanElement[] = [];

        for (const layer of template.layers) {
            const cfg = layer[lang] ?? layer.en;
            const primaryFont = cfg.fontFamily.split(',')[0].trim();
            const safePrimaryFont = primaryFont.replace(/['"]/g, '');
            const fontSpec = `${cfg.fontWeight} ${cfg.fontSize}px "${safePrimaryFont}"`;

            fontLoadPromises.push(document.fonts.load(fontSpec));

            // iOS Safari workaround: force font load by adding to DOM
            const span = document.createElement('span');
            span.style.fontFamily = `"${safePrimaryFont}", ${cfg.fontFamily}`;
            span.style.fontWeight = cfg.fontWeight.toString();
            span.style.position = 'absolute';
            span.style.opacity = '0';
            span.style.pointerEvents = 'none';
            span.innerText = 'اختبار test';
            document.body.appendChild(span);
            preloadSpans.push(span);
        }
        await Promise.all(fontLoadPromises);
        await document.fonts.ready;

        // Clean up DOM preloads after a short delay to ensure rendering
        setTimeout(() => preloadSpans.forEach(span => span.remove()), 150);
    } catch (e) {
        // Font loading failed — continue anyway, browser will use fallback
        console.warn('Font preloading failed, using fallback fonts:', e);
    }

    // ── 4. Draw text layers ─────────────────────────────────────────────
    for (const layer of template.layers) {
        const cfg = layer[lang] ?? layer.en;
        const text = userInputs[layer.id] || cfg.defaultText;

        ctx.save();

        // Font — use full family string so canvas can try fallbacks, but explicitly quote the primary font
        const primaryFont = cfg.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
        const fallbacks = cfg.fontFamily.split(',').slice(1).join(',');
        ctx.font = `${cfg.fontWeight} ${cfg.fontSize}px "${primaryFont}"${fallbacks ? `, ${fallbacks}` : ''}`;

        ctx.fillStyle = layer.color;
        ctx.globalAlpha = layer.opacity;
        ctx.textBaseline = 'top';

        // Shadow
        if (layer.shadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = layer.shadowBlur || 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        // Text alignment offset
        const padding = 4;
        const textX = layer.x + padding;
        const textY = layer.y + padding;

        // Set text direction for Arabic
        try {
            if (lang === 'ar') {
                ctx.direction = 'rtl';
                ctx.canvas.dir = 'rtl';
            } else {
                ctx.direction = 'ltr';
                ctx.canvas.dir = 'ltr';
            }
        } catch {
            // ctx.direction not supported
        }

        // Text alignment
        ctx.textAlign = cfg.align as CanvasTextAlign;
        let alignX = textX;
        if (cfg.align === 'center') {
            alignX = layer.x + (w - layer.x) / 2;
        } else if (cfg.align === 'right') {
            alignX = w - padding;
        }

        // Draw each line
        const lines = text.split('\n');
        const lineHeight = cfg.fontSize * 1.3;
        for (let i = 0; i < lines.length; i++) {
            // iOS Canvas Arabic shaping bypass logic:
            // Sometimes ctx.fillText needs a zero-width joiner or just simple mapping.
            // Modern iOS Safari handles it if the font is loaded via DOM, which we did above.
            ctx.fillText(lines[i], alignX, textY + i * lineHeight);
        }

        ctx.restore();
    }

    return canvas.toDataURL('image/jpeg', quality);
}

/** Load an image (works with base64 data URIs and external URLs) */
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Only set crossOrigin for external URLs, NOT for data URIs
        if (!src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image failed to load'));
        img.src = src;
    });
}
