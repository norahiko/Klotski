class Block {
    // 予約済みのブロックタイプ
    static emptyType = ' ';
    static wallType = '#';
    // ブロックのタイプ。タイプが同じブロックはドラッグされると揃って動く
    type: string;
    // 初期配置の位置
    col: number;
    row: number;
    // ブロックの現在位置(px) Canvas要素からの相対座標
    y: number;
    x: number;
    borderLeft: boolean;
    borderTop: boolean;
    borderRight: boolean;
    borderBottom: boolean;

    constructor(type: string, col: number, row: number, x: number, y: number) {
        this.type = type;
        this.col = col;
        this.row = row;
        this.x = x;
        this.y = y;
        this.borderLeft = false;
        this.borderTop = false;
        this.borderRight = false;
        this.borderBottom = false;
    }
}


class Board {
    // 横のブロックの数
    columns: number;
    // 縦のブロックの数
    rows: number;
    // ブロックの辺の長さ(px)
    blockSize: number;
    // 初期配置
    board: string[][];
    // stopped が trueの時は操作を受け付けない
    stopped: boolean;
    //ブロックを移動した回数
    dragCounter: number;

    view: BoardView;
    // 板上のwallも含む全てのブロックの配列
    blocks: Block[];
    // タイプでグルーピングされたブロックの配列
    pieces: { [type: string]: Block[] };
    // マウスのクリックが押された状態では常にtrue
    dragging: boolean;
    // ドラッグ中のブロックの配列
    draggingBlocks: Block[];
    // ドラッグ中カーソルが移動した距離からブロックが移動した距離を引いた数
    draggedX: number;
    draggedY: number;

    // ドラッグしてもブロックが移動しなかった（元の場所に戻った)かどうか
    // 調べるため、ドラッグ開始時のブロックの座標を記録する
    dragStartX: number;
    dragStartY: number;

    // ブロックが前のフレームで移動していたときはtrue
    moving: boolean;
    // Boardオブジェクトにバインドされた_moveThreadメソッド
    // 非同期でブロック同士の当たり判定や移動を行う
    moveThread: (time: number) => void;
    // ブロックがドラッグされるたびに呼ばれるフックメソッド
    // ドラッグされても移動しなかった場合は呼ばれない
    draggedHook = function() {};


    constructor(blockSize: number, board: string[]) {
        this.blockSize = blockSize;
        this.board = board.map(row => row.split(""));
        this.columns = this.board[0].length;
        this.rows = this.board.length;

        this.stopped = false;
        this.draggedX = 0;
        this.draggedY = 0;
        this.draggingBlocks = null;
        this.dragCounter = 0;
        this.moveThread = (time: number) => this._moveThread(time);

        this.validate();
        this.initBlocks();
    }

    // ブロックの位置を初期配置に戻す
    public reset() {
        this.stopped = false;
        this.dragCounter = 0;
        this.blocks.forEach(block => {
            block.x = block.col * this.blockSize;
            block.y = block.row * this.blockSize;
        });
    }

    // goal上にあるブロックがthis上と同じ位置にあるか
    public checkGoal(goal: Board): boolean {
        return goal.blocks.every(gc => this.blocks.some(c => {
            return gc.type === c.type && gc.x === c.x && gc.y === c.y
        }));
    }

    public isDraggableBlock(x: number, y: number): boolean {
        var type = this.getBlockType(x, y);
        return type !== Block.emptyType && type !== Block.wallType;
    }

    // イベントハンドラ
    public onDragStart(x: number, y: number) {
        if(this.stopped) { return; }
        var type = this.getBlockType(x, y);
        if(this.draggedX !== 0 || this.draggedY !== 0) {
            this.moveBlocks(this.draggedX, this.draggedY)
            this.afterDrag();
        }

        this.draggingBlocks = this.pieces[type];
        this.dragging = true;
        this.moving = false;
        this.draggedX = 0;
        this.draggedY = 0;
        this.dragStartX = this.draggingBlocks[0].x;
        this.dragStartY = this.draggingBlocks[0].y;
    }

    // イベントハンドラ
    public onDrag(x: number, y: number) {
        if(this.stopped) { return; }
        this.draggedX += x;
        this.draggedY += y;
        if(this.moving === false) {
            this.moving = true;
            helper.requestAnimationFrame(this.moveThread);
        }
    }

    // イベントハンドラ
    public onDragEnd() {
        if(this.stopped) { return; }
        this.snap();
        this.dragging = false;
        if(this.moving === false) {
            helper.requestAnimationFrame(this.moveThread);
        }
    }

    private validate() {
        if(this.board.some(row => row.length !== this.columns)) {
            throw new Error('マップの横幅が揃っていない');
        }
        if(this.blockSize % config.blockMovingDistanceUnit !== 0) {
            throw new Error('blockSizeはconfig.blockMovingDistanceUnitの倍数でなければいけない');
        }
    }

    private initBlocks() {
        this.blocks = [];
        this.pieces = {};
        for(var row = 0; row < this.rows; row++) {
            for(var col = 0; col < this.columns; col++) {
                this.addBlock(this.board[row][col], col, row);
            }
        }
    }

    private addBlock(type: string, col: number, row: number) {
        if(type === Block.emptyType) { return; }
        var block = new Block(type, col, row, col * this.blockSize, row * this.blockSize);
        this.blocks.push(block);
        this.setBorder(block, col, row);
        if(this.pieces[type] === undefined) {
            this.pieces[type] = [];
        }
        this.pieces[type].push(block);
    }

    private getBlockType(x: number, y: number): string {
        for(var i = 0; i < this.blocks.length; i++) {
            var block = this.blocks[i];
            if(block.x <= x && x <= block.x + this.blockSize &&
               block.y <= y && y <= block.y + this.blockSize) {
                return block.type;
            }
        }
        return Block.emptyType;
    }

    private isIn(col: number, row: number): boolean {
        return 0   <= col &&
               0   <= row &&
               col <  this.columns &&
               row <  this.rows;
    }

    private setBorder(block: Block, col: number, row: number) {
        if( ! this.isSameType(block, col, row-1)) block.borderTop = true;
        if( ! this.isSameType(block, col, row+1)) block.borderBottom = true;
        if( ! this.isSameType(block, col-1, row)) block.borderLeft = true;
        if( ! this.isSameType(block, col+1, row)) block.borderRight = true;
    }

    private isSameType(block: Block, col: number, row: number): boolean {
        return this.isIn(col, row) && this.board[row][col] === block.type;
    }

    private afterDrag() {
        if(this.dragStartX !== this.draggingBlocks[0].x ||
           this.dragStartY !== this.draggingBlocks[0].y) {
              this.dragCounter++;
              this.draggedHook();
        }
    }

    private moveBlocks(x: number, y: number) {
        for(var i = 0; i < this.draggingBlocks.length; i++) {
            this.draggingBlocks[i].x += x;
            this.draggingBlocks[i].y += y;
        }
    }

    // ブロックをグリッドに沿った位置に配置する
    private snap() {
        var block = this.draggingBlocks[0];
        var half = this.blockSize / 2;
        var diffX = block.x % this.blockSize;
        var diffY = block.y % this.blockSize;
        this.draggedX = diffX < half ? -diffX : this.blockSize - diffX;
        this.draggedY = diffY < half ? -diffY : this.blockSize - diffY;
    }

    private _moveThread(_: number) {
        var moveDist = this.calcMoveDist();
        if(moveDist.x === 0 && moveDist.y === 0) {
            this.moving = false;
            if(this.dragging === false) {
                this.afterDrag();
            }
            return;
        }
        this.draggedX -= moveDist.x;
        this.draggedY -= moveDist.y;
        this.moveBlocks(moveDist.x, moveDist.y);
        this.view.draw(this);
        helper.requestAnimationFrame(this.moveThread);
    }

    private calcMoveDist(): { x: number; y: number; } {
        var unit = config.blockMovingDistanceUnit;
        var signX = this.draggedX < 0 ? -1 : 1;
        var signY = this.draggedY < 0 ? -1 : 1;
        var maxY = Math.min(Math.abs(this.draggedY), config.blockMovingMaxSpeed);
        var maxX = Math.min(Math.abs(this.draggedX), config.blockMovingMaxSpeed);
        var minMax = Math.min(maxX, maxY);

        var xy = 0;
        while(xy + unit <= minMax) {
            if( ! this.isMovable((xy+unit)*signX, (xy+unit)*signY)) { break; }
            xy += unit;
        }

        var x = xy;
        var y = xy;
        while(x + unit <= maxX) {
            if( ! this.isMovable((x+unit)*signX, y*signY)) { break; }
            x += unit;
        }
        while(y + unit <= maxY) {
            if( ! this.isMovable(x*signX, (y+unit)*signY)) { break; }
            y += unit;
        }
        return { x: x * signX, y: y * signY };

    }

    private isMovable(dx: number, dy: number): boolean {
        var size = this.blockSize;
        var width = size * this.columns;
        var height = size * this.rows;

        for(var i = 0; i < this.draggingBlocks.length; i++) {
            var block = this.draggingBlocks[i];
            var x = block.x + dx;
            var y = block.y + dy;

            if(x < 0 || y < 0 || width < x + size || height < y + size) {
                return false;
            }

            for(var k = 0; k < this.blocks.length; k++) {
                var another = this.blocks[k];
                if(block.type === another.type) { continue; }
                if(x < another.x + size &&
                   another.x < x + size &&
                   y < another.y + size &&
                   another.y < y + size) {
                    return false;
                }
            }
        }
        return true;
    }
}

