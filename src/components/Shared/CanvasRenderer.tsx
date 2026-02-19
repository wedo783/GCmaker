import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import type { TemplateConfig, TextLayer } from '../../types';

interface CanvasRendererProps {
    template: TemplateConfig;
    userInputs?: Record<string, string>;
    interactive?: boolean;
    onLayerUpdate?: (id: string, updates: Partial<TextLayer>) => void;
    scale?: number;
    highlightedLayerId?: string | null;
    onSelectLayer?: (id: string) => void;
}

const CanvasRenderer: React.FC<CanvasRendererProps> = ({
    template,
    userInputs = {},
    interactive = false,
    onLayerUpdate,
    scale = 1,
    highlightedLayerId,
    onSelectLayer,
}) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const lang = template.cardLanguage ?? 'en';

    const { dimensions, orientation, backgroundUrl } = template;
    const longSide = Math.max(dimensions.width, dimensions.height);
    const shortSide = Math.min(dimensions.width, dimensions.height);
    const width = orientation === 'landscape' ? longSide : shortSide;
    const height = orientation === 'landscape' ? shortSide : longSide;

    return (
        <div
            ref={canvasRef}
            style={{
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: backgroundUrl ? 'transparent' : '#f0f0f0',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                width: `${width * scale}px`,
                height: `${height * scale}px`,
                flexShrink: 0,
            }}
        >
            {/* Background Image — rendered as <img> for better export reliability on mobile */}
            {backgroundUrl && (
                <img
                    src={backgroundUrl}
                    alt="card background"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 0,
                        pointerEvents: 'none',
                    }}
                />
            )}
            {template.layers.map((layer) => {
                // Resolve per-language settings
                const cfg = layer[lang] ?? layer.en;
                const textContent = userInputs[layer.id] || cfg.defaultText;

                const style: React.CSSProperties = {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    whiteSpace: 'pre-wrap',
                    textAlign: cfg.align,
                    fontSize: `${cfg.fontSize * scale}px`,
                    color: layer.color,
                    fontFamily: cfg.fontFamily,
                    fontWeight: cfg.fontWeight,
                    opacity: layer.opacity,
                    textShadow: layer.shadow
                        ? `2px 2px ${layer.shadowBlur}px rgba(0,0,0,0.5)`
                        : 'none',
                    cursor: interactive ? 'move' : 'default',
                    outline: interactive && highlightedLayerId === layer.id
                        ? '2px dashed #6366f1'
                        : 'none',
                    outlineOffset: '2px',
                    padding: '4px',
                    transformOrigin: 'top left',
                    userSelect: 'none',
                    zIndex: interactive ? 10 : 1,
                    direction: lang === 'ar' ? 'rtl' : 'ltr',
                };

                if (!interactive) {
                    style.transform = `translate(${layer.x * scale}px, ${layer.y * scale}px)`;
                }

                if (interactive) {
                    return (
                        <Draggable
                            key={layer.id}
                            position={{ x: layer.x * scale, y: layer.y * scale }}
                            onStop={(_e: any, data: { x: number; y: number }) => {
                                if (onLayerUpdate) {
                                    onLayerUpdate(layer.id, {
                                        x: data.x / scale,
                                        y: data.y / scale,
                                    });
                                }
                            }}
                            onStart={() => onSelectLayer && onSelectLayer(layer.id)}
                            bounds="parent"
                        >
                            <div
                                style={style}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSelectLayer) onSelectLayer(layer.id);
                                }}
                            >
                                {textContent}
                            </div>
                        </Draggable>
                    );
                }

                return (
                    <div key={layer.id} style={style}>
                        {textContent}
                    </div>
                );
            })}
        </div>
    );
};

export default CanvasRenderer;
