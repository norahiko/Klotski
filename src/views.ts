interface BlockImages {
    [blockType: string]: HTMLElement;
}

class BoardView {
    // レンダリングされるキャンバス要素
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    // ブロックの辺の長さ(px)
    blockSize: number;
    // キャンバス要素の横幅
    width: number;
    // キャンバス要素の高さ
    height: number;
    // ブロック画像のマップ型。画像はキャンバス要素より大きい必要がある
    images: BlockImages;
    // ブロックの左。上の境界線に使われるラインのスタイル
    borderLight: string;
    // ブロックの右。下の境界線に使われるラインのスタイル
    borderShadow: string;
    // MouseEvent.layerX
    layerX: number = null;
    // MouseEvent.layerY
    layerY: number = null;
    // mousedownのイベントハンドラ
    onDragStart: (event) => any;
    // mousemoveのイベントハンドラ
    onDrag: (event) => any;
    // mouseupのイベントハンドラ
    onDragEnd: (event) => any;

    constructor(canvas: HTMLCanvasElement, columns: number, rows: number, blockSize: number) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.blockSize = blockSize;

        this.width = columns * blockSize;
        this.height = rows * blockSize;
        canvas.width = this.width;
        canvas.height = this.height;
        this.borderLight = 'rgba(255,255,255,0.3)';
        this.borderShadow = 'rgba(0,0,0,0.3)';
    }

    // MouseEventとTouchEventの差を吸収する
    private setCursor(event) {
        if(event.touches) {
            this.layerX = event.touches[0].pageX + event.layerX - event.pageX;
            this.layerY = event.touches[0].pageY + event.layerY - event.pageY;
        } else {
            this.layerX = event.layerX | 0;
            this.layerY = event.layerY | 0;
        }
    }

    public bind(board: Board) {
        board.view = this;

        this.onDragStart = (event) => {
            event.preventDefault();
            if(this.layerX !== null) { return; }
            this.setCursor(event);

            if(board.isDraggableBlock(this.layerX, this.layerY)) {
                board.onDragStart(this.layerX, this.layerY);
            } else {
                this.layerX = this.layerY = null;
            }
        };

        this.onDrag = (event) => {
            if(this.layerX === null) { return; }
            event.preventDefault();
            var lastX = this.layerX;
            var lastY = this.layerY;
            this.setCursor(event);
            board.onDrag(this.layerX - lastX | 0, this.layerY - lastY | 0);
        };

        this.onDragEnd = (event) => {
            if(this.layerX === null) { return; }
            event.preventDefault();
            this.layerX = this.layerY = null;
            board.onDragEnd();
        }

        this.canvas.addEventListener(helper.dragEvents[0], this.onDragStart);
        document.addEventListener(helper.dragEvents[1], this.onDrag);
        document.addEventListener(helper.dragEvents[2], this.onDragEnd);
    }

    public unbind() {
        this.canvas.removeEventListener(helper.dragEvents[0], this.onDragStart);
        document.removeEventListener(helper.dragEvents[1], this.onDrag);
        document.removeEventListener(helper.dragEvents[2], this.onDragEnd);
        this.onDragStart = this.onDrag = this.onDragEnd = null;
    }

    public initDraw(board: Board) {
        this.preDrawBorders(board);
        this.draw(board);
    }

    public draw(board: Board) {
        this.drawBackground();
        for(var i = 0; i < board.blocks.length; i++) {
            var block = board.blocks[i];
            this.drawBlock(this.images[block.type], block);
        }
    }

    public drawBackground() {
        if(this.images['background']) {
            this.ctx.drawImage(
                this.images['background'], 0, 0);
        }
    }

    public drawBlock(img: HTMLElement, block: Block) {
        var size = this.blockSize;
        this.ctx.drawImage(img, block.col * size, block.row * size, size, size,
                                block.x, block.y, size, size);
    }


    private preDrawBorders(board: Board) {
        for(var type in board.pieces) {
            var blocks = board.pieces[type];
            var img = <HTMLImageElement>this.images[type];
            if(img === undefined) {
                throw new Error('image not found');
            }
            var canvas = document.createElement('canvas');
            this.images[type] = canvas;
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            blocks.forEach(block => this.preDrawBorder(block, ctx));
        }
    }

    public preDrawBorder(block: Block, ctx: CanvasRenderingContext2D) {
        var ax = block.x;
        var ay = block.y;
        var bx = ax + this.blockSize;
        var by = ay + this.blockSize;

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.strokeStyle = this.borderLight;
        if(block.borderLeft) {
            ctx.moveTo(ax+1, by);
            ctx.lineTo(ax+1, ay);
        }
        if(block.borderTop) {
            ctx.moveTo(ax, ay+1);
            ctx.lineTo(bx, ay+1);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = this.borderShadow;
        if(block.borderRight) {
            ctx.moveTo(bx-1, ay);
            ctx.lineTo(bx-1, by);
        }
        if(block.borderBottom) {
            ctx.moveTo(bx, by-1);
            ctx.lineTo(ax, by-1);
        }
        ctx.stroke();
    }
}

