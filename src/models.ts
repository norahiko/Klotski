interface Point {
    y: number;
    x: number;
}

interface CellImages {
    background: string;
    '#': string;
}

interface BoardEventHandler {
    dragStart(cellType: string): void;
    drag(diff: Point): void;
    dragEnd(): void;
}

class Klotski implements BoardEventHandler {
    board: Board;
    map: string[][];
    originalMap: string[][];
    goal: string[][];
    dragCounter: number;
    running: boolean;

    cellSize: number;
    width: number;
    height: number;
    dragging: boolean;
    piece: Piece;
    moveThread: (time: number) => void;

    hooks = {
        dragged: function() {},
        goaled: function() {},
    };


    constructor(board: Board, map: string[][], goal: string[][]) {
        this.board = board;
        this.originalMap = map;
        this.goal = goal;
        this.dragCounter = 0;
        this.running = true;

        this.cellSize = board.cellSize;
        this.width = map[0].length;
        this.height = map.length;
        this.dragging = false;
        this.piece = new Piece(this.cellSize, this.width, this.height);
        this.resetMap();
        this.moveThread = (time: number) => this._moveThread(time);

        if(this.cellSize % config.cellMovingDistanceUnit !== 0) {
            throw new Error('cellSizeはconfig.cellMovingDistanceUnitの倍数でなければいけない');
        }
        helper.validateMapSize(map);
        helper.validateMapSize(goal);
        if(map.length !== goal.length || map[0].length !== goal[0].length) {
            throw new Error('開始マップとゴールマップのサイズが等しくない');
        }
    }

    public resetMap() {
        this.map = helper.copy(this.originalMap);
    }

    public dragStart(cellType: string) {
        if(this.dragging || ! this.running) { return; }
        if(this.piece.isMoving()) {
            this.board.moveElements(this.piece.type, this.piece.dragged);
            this.piece.fixCellPoints();
        }
        this.dragging = true;
        this.takePiece(cellType);
        helper.requestAnimationFrame(this.moveThread);
    }

    public drag(diff: Point) {
        if(this.dragging === false) { return; }
        this.piece.changeDraggedDistance(diff);
    }

    public dragEnd() {
        if(this.dragging === false) { return; }
        this.dragging = false;
        this.putPiece();
        if(this.piece.hasMoved()) {
            this.dragCounter += 1;
            this.hooks.dragged();
            if(this.checkGoal()) {
                this.hooks.goaled();
            }
        }
    }

    public checkGoal(): boolean {
        for(var row = 0; row < this.height; row++) {
            for(var col = 0; col < this.width; col++) {
                var cell = this.map[row][col];
                var gcell = this.goal[row][col];
                if(cell !== gcell && gcell !== helper.emptyCell) {
                    return false;
                }
            }
        }
        return true;
    }

    public takePiece(cellType: string) {
        var cellPoints = [];
        for(var row = 0; row < this.height; row++) {
            for(var col = 0; col < this.width; col++) {
                if(this.map[row][col] === cellType) {
                    this.map[row][col] = helper.emptyCell;
                    cellPoints.push({ y: row * this.cellSize, x: col * this.cellSize });
                }
            }
        }
        this.piece.dragStart(this.map, cellType, cellPoints);
    }

    public putPiece() {
        this.piece.snap(this.map);
    }

    public _moveThread(_: number) {
        if(this.dragging || this.piece.isMoving()) {
            var moved = this.piece.move();
            if(moved.y || moved.x) {
                this.board.moveElements(this.piece.type, moved);
            }
            helper.requestAnimationFrame(this.moveThread);
        }
    }
}


class Piece {
    cells: Point[];
    size: number;
    map: string[][];
    type: string;
    mapHeight: number;
    mapWidth: number;
    dragged: Point;
    dragStartPoint: Point;

    constructor(size: number, width: number, height: number) {
        this.size = size;
        this.dragged = { y: 0, x: 0 };
        this.mapHeight = width;
        this.mapWidth = height;
    }

    public dragStart(srcMap: string[][], type: string, cells: Point[]) {
        this.map = helper.copy(srcMap);
        this.type = type;
        this.cells = cells;
        this.dragged.y = 0;
        this.dragged.x = 0;
        this.dragStartPoint = { y: cells[0].y, x: cells[0].x };
    }

    public isMoving(): boolean {
        return this.dragged.x !== 0 || this.dragged.y !== 0;
    }

    public snap(srcMap: string[][]) {
        var p = this.cells[0];
        var half = this.size / 2;
        var modY = p.y % this.size;
        var modX = p.x % this.size;
        var snapY = modY < half ? -modY : this.size - modY;
        var snapX = modX < half ? -modX : this.size - modX;
        this.dragged.y = snapY;
        this.dragged.x = snapX;

        this.cells.forEach(cell => {
            var row = (cell.y + snapY) / this.size;
            var col = (cell.x + snapX) / this.size;
            srcMap[row][col] = this.type;
        });
    }

    public fixCellPoints() {
        this.cells.forEach(cell => {
            cell.y = this.dragged.y;
            cell.x = this.dragged.x;
        });
        this.dragged.y = 0;
        this.dragged.x = 0;
    }

    public hasMoved(): boolean {
        return this.dragStartPoint.y !== this.cells[0].y + this.dragged.y ||
               this.dragStartPoint.x !== this.cells[0].x + this.dragged.x;
    }

    public changeDraggedDistance(diff: Point) {
        this.dragged.y += diff.y;
        this.dragged.x += diff.x;
    }

    public move(): Point {
        var moved = this.calcMoveSize();
        this.cells.forEach(cell => {
            cell.x += moved.x;
            cell.y += moved.y;
        });
        this.dragged.y -= moved.y;
        this.dragged.x -= moved.x;
        return { y: moved.y, x: moved.x };
    }

    public calcMoveSize(): Point {
        var dragged = this.dragged;
        var unit = config.cellMovingDistanceUnit;
        var signY = dragged.y < 0 ? -1 : 1;
        var signX = dragged.x < 0 ? -1 : 1;
        var maxY = Math.min(Math.abs(dragged.y), this.size);
        var maxX = Math.min(Math.abs(dragged.x), this.size);
        var lessMax = Math.min(maxY, maxX);

        var y = 0;
        while(y + unit <= maxY) {
            if( ! this.isMovable((y + unit) * signY, 0)) { break; }
            y += unit;
        }
        var x = 0;
        while(x + unit <= maxX) {
            if( ! this.isMovable(y * signY, (x + unit) * signX)) { break; }
            x += unit;
        }
        return { y: y * signY, x: x * signX };
    }

    public isMovable(dy: number, dx: number): boolean {
        var size = this.size;
        var mapWidth = this.mapWidth;
        var mapHeight = this.mapHeight;
        var map = this.map;

        for(var i = 0; i < this.cells.length; i++) {
            var cell = this.cells[i];
            var ay = cell.y + dy;
            var ax = cell.x + dx;
            var by = ay + size;
            var bx = ax + size;

            if(ax < 0 || ay < 0 || mapWidth * size < bx || mapHeight * size < by) {
                return false;
            }

            for(var row = 0; row < mapHeight; row++) {
                for(var col = 0; col < mapWidth; col++) {
                    if(map[row][col] === helper.emptyCell) { continue; }
                    var my = row * size;
                    var mx = col * size;
                    var ny = my + size;
                    var nx = mx + size;
                    if(ax < nx && mx < bx && ay < ny && my < by) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}

