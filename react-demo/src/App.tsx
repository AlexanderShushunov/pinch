import { useEffect, useRef, useState } from "react";
import { Pinchable } from "pinchable";
import "./App.css";

const images = [
    "https://picsum.photos/id/1015/600/400",
    "https://picsum.photos/id/1016/600/400",
    "https://picsum.photos/id/1024/600/400",
    "https://picsum.photos/id/1025/600/400",
    "https://picsum.photos/id/1035/600/400",
    "https://picsum.photos/id/1041/600/400",
];

function App() {
    const [active, setActive] = useState<number | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        if (active !== null && imgRef.current) {
            const pinch = new Pinchable(imgRef.current, {
                maxZoom: 3,
                velocity: 0.7,
                applyTime: 400,
            });
            return () => pinch.dispose();
        }
    }, [active]);

    return (
        <div>
            <div className="gallery">
                {images.map((src, i) => (
                    <img key={i} src={src} className="thumb" onClick={() => setActive(i)} alt={`Preview ${i + 1}`} />
                ))}
            </div>
            {active !== null && (
                <div className="overlay">
                    <img ref={imgRef} src={images[active]} alt={`Full ${active + 1}`} />
                    <button className="close-btn" onClick={() => setActive(null)}>
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;
