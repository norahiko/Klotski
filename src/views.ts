interface DomEventHandler {
    (event: Event): any;
}

class Board {
    wrapper: HTMLElement;
    cellSize: number;
    cells: Cell[];
    lastPoint: Point;
    onDrag: DomEventHandler;
    onDragStart: DomEventHandler;
    onDragEnd: DomEventHandler;

    constructor(wrapper: HTMLElement, cells: Cell[], cellSize: number) {
        this.wrapper = wrapper;
        this.cells = cells;
        this.cellSize = cellSize;
        cells.forEach(cell => wrapper.appendChild(cell.elem));
    }

    public bind(game: BoardEventHandler) {
        this.onDragStart = (event: Event) => {
            event.preventDefault();
            if(this.lastPoint) { return; }

            for(var i = 0; i < this.cells.length; i++) {
                if(this.cells[i].elem === <HTMLElement>event.target) {
                    var cellType = this.cells[i].type;
                    if(cellType !== helper.wallCell) {
                        this.lastPoint = helper.getPointFromEvent(event);
                        game.dragStart(cellType);
                        break;
                    }
                }
            }
        };

        this.onDrag = (event: Event) => {
            if( ! this.lastPoint) { return; }
            event.preventDefault();
            var point = helper.getPointFromEvent(event);
            game.drag(helper.diff(this.lastPoint, point));
            this.lastPoint = point;
        };

        this.onDragEnd = (event: Event) => {
            if( ! this.lastPoint) { return; }
            this.lastPoint = null;
            game.dragEnd();
        }

        this.wrapper.addEventListener(helper.dragEvents[0], this.onDragStart);
        document.addEventListener(helper.dragEvents[1], this.onDrag);
        document.addEventListener(helper.dragEvents[2], this.onDragEnd);
    }

    public unbind() {
        this.wrapper.removeEventListener(helper.dragEvents[0], this.onDragStart);
        document.removeEventListener(helper.dragEvents[1], this.onDrag);
        document.removeEventListener(helper.dragEvents[2], this.onDragEnd);
        this.onDragStart = this.onDrag = this.onDragEnd = null;
    }

    public resetPosition() {
        this.cells.forEach(cell => cell.resetPosition());
    }

    public setImage(img: string) {
        this.wrapper.style.background = img;
    }

    public setSize(width: number, height: number) {
        this.wrapper.style.width = width * this.cellSize + 'px';
        this.wrapper.style.height = height * this.cellSize + 'px';
    }

    public moveElements(cellType: string, shift: Point) {
        this.cells.forEach(cell => cell.type === cellType && cell.move(shift));
    }
}


class Cell {
    elem: HTMLElement;
    type: string;
    size: number;
    row: number;
    col: number;
    left: number;
    top: number;

    constructor(type: string, size: number, row: number, col: number) {
        this.type = type;
        this.size = size;
        this.row = row;
        this.col = col;

        this.elem = document.createElement('div');
        this.elem.classList.add('cell');
        this.elem.style.width = size + 'px';
        this.elem.style.height = size + 'px';
        if(type === helper.wallCell) {
            this.elem.classList.add('wall');
        }
    }

    public setImage(cellImage: string) {
        if(cellImage === undefined) {
            throw Error('undefineded cellImage: "' + this.type + '"');
        }
        this.elem.style.background = cellImage;
        var bgleft = this.col * this.size;
        var bgtop = this.row * this.size;
        if(this.elem.classList.contains('edge-left')) {
            bgleft += config.borderWidth;
        }
        if(this.elem.classList.contains('edge-top')) {
            bgtop += config.borderWidth;
        }
        var bgpos = -bgleft + 'px ' + -bgtop + 'px';
        this.elem.style.backgroundPosition = bgpos;
    }

    public setBorder(map: string[][]) {
        if( ! this.isSameType(map, this.row-1, this.col)) this.elem.classList.add('edge-top');
        if( ! this.isSameType(map, this.row+1, this.col)) this.elem.classList.add('edge-bottom');
        if( ! this.isSameType(map, this.row, this.col-1)) this.elem.classList.add('edge-left');
        if( ! this.isSameType(map, this.row, this.col+1)) this.elem.classList.add('edge-right');
    }

    private isSameType(map: string[][], row: number, col: number): boolean {
        return helper.isInMap(map, row, col) && map[row][col] === this.type;
    }

    public resetPosition() {
        this.left = this.col * this.size;
        this.top = this.row * this.size;
        this.setElementPosition();
    }

    public setElementPosition() {
        this.elem.style.left = this.left + 'px';
        this.elem.style.top = this.top + 'px';
    }

    public move(dist: Point) {
        this.left += dist.x;
        this.top += dist.y
        this.setElementPosition();
    }
}
