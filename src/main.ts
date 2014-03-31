function main() {
    var URL_1 = 'img/wood1.jpg';
    var URL_2 = 'img/wood2.jpg';
    var imageURL = {
        "background": URL_1,
        "#": URL_2,
        "1": URL_2,
        "2": URL_2,
        "3": URL_2,
        "4": URL_2,
        "5": URL_2,
        "6": URL_2,
    };

    var blockSize = 40;
    var board = new Board(blockSize, [
        '########',
        '###  ###',
        '###  ###',
        '#444566#',
        '## 556##',
        '#      #',
        '#222333#',
        '#2 11 3#',
        '#  11  #',
        '########',
    ]);

    var goal = new Board(blockSize, [
        '########',
        '###11###',
        '###11###',
        '#      #',
        '##    ##',
        '#      #',
        '#      #',
        '#      #',
        '#      #',
        '########',
    ]);

    var canvas = helper.getCanvas('view');
    var view = new BoardView(canvas, board.columns, board.rows, board.blockSize);
    view.bind(board);
    helper.loadImages(imageURL, function (images) {
        view.images = images;
        view.initDraw(board);
    })

    var counter = document.querySelector('#drag-counter');
    board.draggedHook = function() {
        counter.textContent = String(board.dragCounter);
        if(board.checkGoal(goal)) {
            alert('Congratulations!');
            board.stopped = true;
        }
    };

    document.querySelector('#reset-button').addEventListener('click', function() {
        board.reset();
        view.draw(board);
        counter.textContent = String(board.dragCounter);
    });
}

if(document.documentElement.hasAttribute('klotski-app')) {
    document.addEventListener('DOMContentLoaded', main);
}

