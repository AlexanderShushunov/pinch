import { useCallback, useEffect, useRef, useState } from "react";
import { Pinchable } from "pinchable";
import "./App.css";

const images = [
    "https://picsum.photos/id/1015/400/600",
    "https://picsum.photos/id/1016/400/600",
    "https://picsum.photos/id/1024/400/600",
    "https://picsum.photos/id/1025/400/600",
    "https://picsum.photos/id/1035/400/600",
    "https://picsum.photos/id/1041/400/600",
];

function App() {
    const [active, setActive] = useState<number | null>(null);
    const [closing, setClosing] = useState(false);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const close = useCallback(() => {
        setClosing(true);
    }, []);

    useEffect(() => {
        if (closing) {
            const timer = setTimeout(() => {
                setActive(null);
                setClosing(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [closing]);

    useEffect(() => {
        if (active !== null && imgRef.current) {
            const pinch = new Pinchable(imgRef.current, {
                maxZoom: 3,
                minZoom: 0.5,
                velocity: 0.7,
                applyTime: 400,
                nearZeroZoomThreshold: 0,
            });

            let lastZoom = 1;

            const unsubscribePinch = pinch.subscribe("pinch", (zoom: number) => {
                lastZoom = zoom;
            });

            const unsubscribeEnd = pinch.subscribe("end", () => {
                if (lastZoom < 0.7) {
                    close();
                    return;
                }

                if (lastZoom < 1) {
                    pinch.focus({ zoom: 1, to: { x: 0.5, y: 0.5 } });
                }
            });

            return () => {
                unsubscribePinch();
                unsubscribeEnd();
                pinch.dispose();
            };
        }
    }, [active, close]);

    return (
        <div>
            <h1>Click and pinch</h1>
            <span>
                Example for <a href="https://github.com/AlexanderShushunov/pinch">pinchable</a> lib
            </span>
            <div className="gallery">
                {images.map((src, i) => (
                    <img key={i} src={src} className="thumb" onClick={() => setActive(i)} alt={`Preview ${i + 1}`} />
                ))}
            </div>
            {active !== null && (
                <div className={`overlay${closing ? " closing" : ""}`}>
                    <img ref={imgRef} src={images[active]} alt={`Full ${active + 1}`} />
                    <button className="close-btn" onClick={close}>
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;
