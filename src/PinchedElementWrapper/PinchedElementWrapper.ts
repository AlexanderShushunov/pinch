type TransformData = {
    zoom: number;
    translate: { x: number; y: number };
    withTransition: boolean;
};

export class PinchedElementWrapper {
    private readonly _startSize: { width: number; height: number };
    private readonly element: HTMLElement;
    private readonly moveTime: number;
    private isTransformRequested = false;
    private transformData: TransformData = {
        zoom: 1,
        translate: { x: 0, y: 0 },
        withTransition: false,
    };

    public constructor(element: HTMLElement, moveTime: number) {
        this.moveTime = moveTime;
        this.element = element;
        // we do not remove this styles, but it is ok
        element.style.position = "relative";
        element.style.transformOrigin = "top left";
        const rect = element.getBoundingClientRect();
        this._startSize = { width: rect.width, height: rect.height };
    }

    public get startSize(): { width: number; height: number } {
        return this._startSize;
    }

    public transform(data: TransformData): void {
        this.transformData = data;
        if (this.isTransformRequested) {
            return;
        }
        this.isTransformRequested = true;
        window.requestAnimationFrame(() => {
            const { zoom, translate, withTransition } = this.transformData;
            this.element.style.transform = `matrix(${zoom}, 0, 0, ${zoom}, ${translate.x}, ${translate.y})`;
            if (withTransition) {
                this.element.style.transition = `transform ${this.moveTime / 1000}s ease`;
            } else {
                this.element.style.transition = "";
            }
            this.isTransformRequested = false;
        });
    }
}
