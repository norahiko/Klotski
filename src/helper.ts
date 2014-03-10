module helper {
    var global: any = window;

    export var emptyCell = ' ';
    export var wallCell = '#';

    export var touchDevice = 'ontouchstart' in window;

    export var dragEvents = touchDevice ? ['touchstart', 'touchmove', 'touchend']
                                        : ['mousedown', 'mousemove', 'mouseup'];

    var _requestAnimationFrame = global.requestAnimationFrame ||
                                 global.webkitRequestAnimationFrame ||
                                 global.mozRequestAnimationFrame ||
                                 global.msRequestAnimationFrame;

    export function requestAnimationFrame(frame: Function) {
        _requestAnimationFrame(frame);
    }

    export function copy(map: string[][]): string[][] {
        return map.map(row => row.slice(0));
    }

    export function isInMap(map: string[][], row: number, col: number): boolean {
        return 0   <= col &&
               0   <= row &&
               row <  map.length &&
               col <  map[0].length;
    }

    export function getElement(id: string): HTMLElement {
        return document.getElementById(id) || document.createElement('div');
    }


    export function removeChildren(elem: HTMLElement) {
        while(elem.childNodes.length !== 0) {
            elem.removeChild(elem.childNodes[0]);
        }
    }

    export function getPointFromEvent(event: Event): Point {
        if(event.type[0] === 't') { // touch event
            return {
                x: (<TouchEvent>event).targetTouches[0].pageX,
                y: (<TouchEvent>event).targetTouches[0].pageY,
            };
        } else {
            return {
                x: (<MouseEvent>event).pageX,
                y: (<MouseEvent>event).pageY,
            };
        }
    }

    export function diff(from: Point, to: Point): Point {
        return { x: to.x - from.x, y: to.y - from.y };
    }

    export function validateMapSize(map: string[][]) {
        var width = map[0].length;
        if(map.some(row => row.length !== width)) {
            var mapStr = map.map(row => '[' + row.join() + ']').join('\n');
            throw new Error('マップの横幅が揃っていない\n' + mapStr);
        }
    }

    export function createCells(cellSize: number, map: string[][], cellImages: CellImages ): Cell[] {
        var cells: Cell[] = [];
        var width = map[0].length;
        var height = map.length;

        for(var row = 0; row < height; row++) {
            for(var col = 0; col < width; col++) {
                var cellType = map[row][col];
                if(cellType !== helper.emptyCell) {
                    var cell = new Cell(cellType, cellSize, row, col);
                    cell.setBorder(map);
                    cell.setImage(cellImages[cellType]);
                    cells.push(cell);
                }
            }
        }
        return cells;
    }

    export function createBoard(wrapper: HTMLElement, cellSize: number, map: string[][], cellImages: CellImages): Board {
        helper.removeChildren(wrapper);
        var cells = helper.createCells(cellSize, map, cellImages);
        var board = new Board(wrapper, cells, cellSize);
        board.setSize(map[0].length, map.length);
        board.setImage(cellImages.background);
        board.resetPosition();
        return board;
    }
}

