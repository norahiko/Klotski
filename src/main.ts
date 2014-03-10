var klotski: Klotski;
var board: Board;
var defaultCellSize = 45;

var startMap = [
    '######'.split(''),
    '#1133#'.split(''),
    '#1   #'.split(''),
    '#   2#'.split(''),
    '##  2#'.split(''),
    '######'.split(''),
];

var goalMap = [
    '######'.split(''),
    '#    #'.split(''),
    '#    #'.split(''),
    '#  11#'.split(''),
    '#  1 #'.split(''),
    '######'.split(''),
];

var defaultCellImages: CellImages = {
    "background": 'url(img/wood2.jpg)',
    "#": 'url(img/wood3.jpg)',
    "1": 'url(img/wood3.jpg)',
    "2": 'url(img/wood3.jpg)',
    "3": 'url(img/wood3.jpg)',
};


function main() {
    var v = helper.getElement('view');
    board = helper.createBoard(v, defaultCellSize, startMap, defaultCellImages);
    klotski = new Klotski(board, startMap, goalMap);
    klotski.hooks.dragged = function() {
        console.log(klotski.dragCounter);
    };
    klotski.hooks.goaled = function() {
        alert('goal!!!');
        klotski.running = false;
    }
    board.bind(klotski);
}

if(document.documentElement.hasAttribute('klotski-app')) {
    document.addEventListener('DOMContentLoaded', main);
}

