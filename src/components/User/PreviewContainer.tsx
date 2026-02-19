import React, { useRef, useState, useEffect } from 'react';
import CanvasRenderer from '../Shared/CanvasRenderer';
import type { TemplateConfig } from '../../types';

interface PreviewContainerProps {
    template: TemplateConfig;
    inputs: Record<string, string>;
}

const PreviewContainer: React.FC<PreviewContainerProps> = ({ template, inputs }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.3);

    useEffect(() => {
        const calc = () => {
            if (!containerRef.current) return;
            const { clientWidth, clientHeight } = containerRef.current;

            const { dimensions, orientation } = template;
            const longSide = Math.max(dimensions.width, dimensions.height);
            const shortSide = Math.min(dimensions.width, dimensions.height);
            const cardW = orientation === 'landscape' ? longSide : shortSide;
            const cardH = orientation === 'landscape' ? shortSide : longSide;

            const padding = 32;
            const availW = clientWidth - padding;
            const availH = clientHeight - padding;

            const newScale = Math.min(availW / cardW, availH / cardH);
            setScale(Math.max(newScale, 0.05)); // floor to avoid invisible
        };

        calc();
        const ro = new ResizeObserver(calc);
        if (containerRef.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [template]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                minHeight: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out',
                    flexShrink: 0,
                }}
            >
                <CanvasRenderer
                    template={template}
                    userInputs={inputs}
                    scale={1}
                />
            </div>
            <div style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                background: 'rgba(0,0,0,0.5)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 11,
                fontFamily: 'monospace',
                padding: '3px 8px',
                borderRadius: 99,
                backdropFilter: 'blur(4px)',
            }}>
                {Math.round(scale * 100)}%
            </div>
        </div>
    );
};

export default PreviewContainer;
