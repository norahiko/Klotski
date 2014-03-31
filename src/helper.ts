interface Window {
    webkitRequestAnimationFrame: typeof requestAnimationFrame;
    mozRequestAnimationFrame: typeof requestAnimationFrame;
    oRequestAnimationFrame: typeof requestAnimationFrame;
}

module helper {

    export var touchDevice = 'ontouchstart' in window;

    export var dragEvents = touchDevice ? ['touchstart', 'touchmove', 'touchend']
                                        : ['mousedown', 'mousemove', 'mouseup'];

    var _requestAnimationFrame = window.requestAnimationFrame ||
                                 window.msRequestAnimationFrame ||
                                 window.webkitRequestAnimationFrame ||
                                 window.mozRequestAnimationFrame ||
                                 window.oRequestAnimationFrame ||
                                 function(frame: FrameRequestCallback) { setTimeout(frame, 16.667) };

    export function requestAnimationFrame(frame: FrameRequestCallback) {
        _requestAnimationFrame(frame);
    }

    export function getCanvas(id: string): HTMLCanvasElement {
        return <HTMLCanvasElement>document.getElementById(id) || document.createElement('canvas');
    }

    export function loadImages(urls, onLoadAll: Function, onErrorAny?: Function) {
        var images = {};
        var count = 0;
        var errored = false;
        var onload = (evt) => {
            count--;
            if(count === 0) {
                onLoadAll(images);
            }
        }

        var onerror = (evt) => {
            if(errored === false) {
                onErrorAny && onErrorAny(evt);
            }
            errored = true;
        }

        for(var key in urls) {
            count++;
            var img = new Image();
            img.src = urls[key];
            images[key] = img;
            img.onload = onload;
            img.onerror = onerror;
        }
    }
}

