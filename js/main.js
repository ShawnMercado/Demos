var draw = SVG('draw');

var validTilePattern = draw.pattern(10, 10, function(add) {
    add.rect(10,10).fill('#FF8866');
    add.rect(5,5);
    add.rect(5,5).move(5,5)
});



var colors = {
    red: "#C63D0F",
    black: "#3B3738",
    tan: "#FDF3E7",
    slate: "#7E8F7C",
    darkSlate: "#2F4F4F",
    darkTan: "#918151",

    tan_king: "src/img/tan_king.svg",
    slate_king: "src/img/slate_king.svg",
    darkSlate_king: "src/img/darkSlate_king.svg",
    darkTan_king: "src/img/darkTan_king.svg"
};

var tiles = draw.set();
var tokensTan = draw.set();
var tokensSlate = draw.set();

var selectedToken;
var turnTracker;
var selectionMade = false;

var playableTiles = {
    pt1: null,
    pt2: null,
    pt3: null,
    pt4: null,
};

var drawGameboard = document.getElementById('drawGameboard');
var addTokens = document.getElementById('addTokens');
var beginGame = document.getElementById('beginGame');

addTokens.disabled = true;
beginGame.disabled = true;

var TurnController = {
    initialize: function() {
        //disable slate tokens
        tokensSlate.each(function () {
            this.toggleDraggable();
        });
        turnTracker = "White";
    },
    changeTurn: function() {
        tokensSlate.each(function() {
            this.toggleDraggable();
        });
        tokensTan.each(function(){
            this.toggleDraggable()
        });
        switch(turnTracker){
            case 'White':
                turnTracker = 'Grey';
                break;
            case 'Grey':
                turnTracker = 'White';
                break;
            default:
                console.log("something went wrong while trying to change turns");
        }
    $('#turnTracker').text(turnTracker + "'s turn!");
    },
    resetTiles: function() {
        console.log('resetting tiles');
        if(playableTiles.pt1 != null && playableTiles.pt1.droppable) playableTiles.pt1.toggleDroppable();
        if(playableTiles.pt2 != null && playableTiles.pt2.droppable) playableTiles.pt2.toggleDroppable();
        if(playableTiles.pt3 != null && playableTiles.pt3.droppable) playableTiles.pt3.toggleDroppable();
        if(playableTiles.pt4 != null && playableTiles.pt4.droppable) playableTiles.pt4.toggleDroppable();
        playableTiles.pt1 = null;
        playableTiles.pt2 = null;
        playableTiles.pt3 = null;
        playableTiles.pt4 = null;
        selectionMade = false;
    }
};

SVG.extend(SVG.Set, {
    getByPosition: function(column, row){
        if (row < 0 || row > 7 || column < 0 || column > 7) {
            return null;
        }
        var index;
        if (row % 2 === 0) {
            index = row * 8 + column;
        } else {
            index = (row + 1) * 8 - column - 1;
        }

        return this.get(index);
    },
    getByCoordinates: function(x, y){
        var column = Math.floor(x / 40);
        var row = Math.floor(y / 40);
        return this.getByPosition(column, row);
    }
});



SVG.Tile = SVG.invent({
    create: 'rect',
    inherit: SVG.Shape,
    extend: {
        toString: function(){
            return 'tile number ' + tiles.index(this) + ' with position (' + this.row + ', ' + this.column +
                ') and height, width of (' +
                this.height() + ', ' + this.width() + '), ' + (this.hasToken() ? 'occupied' : 'unoccupied');
        },
        addToken: function(token){
            if (!this.hasToken()) {
                this.token = token;
                this.token.tile = this;
            }
        },
        removeToken: function(){
            this.token = null;
        },
        toggleDroppable: function() {

            if(this.droppable){
                this.fill(this.color);
                this.droppable = false;
            } else {
                this.fill(validTilePattern);
                this.droppable = true;
            }
        },
        drop: function(token) {
            console.log('drop function firing');
            if(this.droppable) {

                this.token = token;
                console.log(this.toString() + ' receiving tile');
                return true;
            } else {
                console.log(this.toString() + ' kicking tile back');
                return false;
            }
        },
        distance: function(tile){
            lineLength = function(x, y, x0, y0){
                return Math.sqrt((x -= x0) * x + (y -= y0) * y);
            };
            return lineLength(this.x(), this.y(), tile.x(), tile.y());
        }
    },
    construct: {
        tile: function(width, height, x, y, color) {
            var current = new SVG.Tile;

            current.clickable = false;
            current.droppable = false;
            current.row = y / 40;
            current.column = x / 40;
            current.token = null;
            current.color = color;
            current.hasToken = function(){
                return (current.token != null);
            };

            current.on("click", tileClick);

            return this.put(current).size(width, height).fill(color).x(x).y(y);
        }
    }
});

SVG.Token = SVG.invent({
    create: 'ellipse',
    inherit: SVG.Ellipse,
    extend: {
        toString: function(){
            return 'circle with center (' + (this.x + 20) + ', ' + (this.y + 20) + ')';
        },

        toggleDraggable: function(){
            if(this.isDraggable){
                this.isDraggable = false;
                this.fixed();
            } else {
                this.isDraggable = true;
                this.draggable(function(x, y) {
                    return {
                        x: (x >= 0 && x <= 299),
                        y: (y >= 0 && y <= 299)
                    };
                });
                var dragging = false;
                var startX, startY;
                var tileInfo, jump1, jump2;

                this.dragstart = function() {
                    console.log('dragstart firing');
                    //this.off('click', tokenClick);
                    startX = this.x();
                    startY = this.y();
                };
                this.dragmove = function() {
                    console.log('dragging = ' + dragging);
                    if(!dragging) {
                        this.showDroppableTiles();
                        console.log('NOW we are dragging');
                        resetTokens(this);
                        dragging = true;
                    } else {

                    }
                };
                this.dragend = function() {
                    if (dragging) {
                        console.log('dragend firing');

                        var success = this.moveTo(startX, startY, this.getCenter().x, this.getCenter().y);

                        resetTokens(this);
                        dragging = false;
                        console.log(dragging);
                        if (success){
                            TurnController.changeTurn();
                        }
                        //this.on('click', tokenClick);
                    } else {

                    }
                    TurnController.resetTiles();
                }
            }
        },

        toggleFill: function() {
            var color = this.attr('fill').toUpperCase();
            switch(color) {
                case colors.slate:
                    this.attr({fill: colors.darkSlate});
                    break;
                case colors.darkSlate:
                    this.attr({fill: colors.slate});
                    break;
                case colors.tan:
                    this.attr({fill: colors.darkTan});
                    break;
                case colors.darkTan:
                    this.attr({fill: colors.tan});
                    break;
                default: throw 'Something is wrong:  invalid color';
            }
        },

        getCenter: function() {
            return {
                x: this.x() + 20,
                y: this.y() + 20
            }
        },

        moveTo: function(startX, startY, x, y) {
            var oldTile = tiles.getByCoordinates(startX, startY);

            var tile = tiles.getByCoordinates(x, y);
            var jumpFlag;
            if (oldTile.distance(tile) > 60) jumpFlag = true;
            if (tile == null || tile.hasToken()) {
                this.x(startX);
                this.y(startY);
                return false;
            } else {
                var dropped = tile.drop(this);

                if (dropped) {
                    if(jumpFlag){
                        jumpedX = (tile.x() + oldTile.x())/2;
                        jumpedY = (tile.y() + oldTile.y())/2;
                        var jumpedTile = tiles.getByCoordinates(jumpedX, jumpedY);
                        jumpedTile.token.removeFromBoard();
                    }
                    oldTile.removeToken();
                    this.x(tile.x());
                    this.y(tile.y());
                    tile.token = this;
                    this.tile = tile;
                    TurnController.resetTiles();
                } else {
                    this.x(startX);
                    this.y(startY);
                }
                return dropped;
            }
        }

    },

    construct: {
        token: function(diameter, x, y, color) {
            var current = new SVG.Token;
            current.isDraggable = false;
            current.clickable = false;
            current.tile = null;
            //current.on("click", tokenClick);

            return this.put(current).size(diameter, diameter).fill(color).x(x).y(y);
        }
    }
});

SVG.King = SVG.invent({
    create: 'ellipse',
    inherit: SVG.token,
    extend: {
        toggleFill: function() {
            var color = this.attr('fill')();
            switch(color) {
                case colors.slate_king:
                    this.fill(colors.darkSlate_king);
                    break;
                case colors.darkSlate_king:
                    this.fill(colors.slate_king);
                    break;
                case colors.tan_king:
                    this.fill(colors.darkTan_king);
                    break;
                case colors.darkTan_king:
                    this.fill(colors.tan_king);
                    break;
                default: throw 'Something is wrong:  invalid color';
            }
        }
    },
    construct: function(token){
        var current = new SVG.King;
        current.isDraggable = false;
        current.clickable = false;
        current.tile = token.tile;

        var color = this.token.attr('fill').toUpperCase();
        switch(color){
            case colors.slate:
                color = colors.slate_king;
                break;
            case colors.darkSlate:
                color = colors.darkSlate_king;
                break;
            case colors.tan:
                color = colors.tan_king;
                break;
            case colors.darkTan:
                color = colors.darkTan_king;
                break;
            default: throw 'Something is wrong:  invalid color';
        }
        return this.put(current).size(token.width(), token.height()).fill(color).x(token.x()).y(token.y());
    }
})




function removeFromBoard_tan(){
    tokensTan.remove(this);
    this.tile.removeToken();
    this.remove();
};

function removeFromBoard_slate(){
    tokensSlate.remove(this);
    this.tile.removeToken();
    this.remove();
};

/*
 SETTING UP THE GAME
 */

//draw the tiles
$(drawGameboard).click(function(){
    var color;
    var currentPos = [0, 0];
    var leftToRight = true;

    for(var i = 0; i < 64; i++) {
        if (i % 2 === 0) {
            color = colors.red;
        } else {
            color = colors.black;
        }

        var currentTile = draw.tile(40, 40, currentPos[0], currentPos[1], color);
        tiles.add(currentTile);

        if (i > 0 && (i + 1) % 8 === 0 && leftToRight) {
            leftToRight = false;
            currentPos[1] += 40;
        } else if (i > 0 && (i + 1) % 8 === 0) {
            leftToRight = true;
            currentPos[1] += 40;
        } else if (leftToRight) {
            currentPos[0] +=40;
        } else {
            currentPos[0] -=40;
        }
    }
    this.remove();
    addTokens.disabled = false;
});


//draw the tokens
$(addTokens).click(function() {
    tiles.each(function(i) {
        var currentToken = null;
        if(i < 24 && (i % 2) != 0) {
            currentToken = draw.token(40, tiles.get(i).x(), tiles.get(i).y(), colors.tan);
            currentToken.showDroppableTiles = showDroppableTiles_tan;
            currentToken.getDroppableTiles = getDroppableTiles_tan;
            currentToken.removeFromBoard = removeFromBoard_tan;
            tokensTan.add(currentToken);
        } else if (i > 39 && (i % 2) != 0) {
            currentToken = draw.token(40, tiles.get(i).x(), tiles.get(i).y(), colors.slate);
            currentToken.showDroppableTiles = showDroppableTiles_slate;
            currentToken.getDroppableTiles = getDroppableTiles_slate;
            currentToken.removeFromBoard = removeFromBoard_slate;
            tokensSlate.add(currentToken);
        }
        if(currentToken != null) {
            this.addToken(currentToken);
        }
    });
    this.remove();
    beginGame.disabled = false;
});

//begin the game
$(beginGame).click(function(){
    tiles.each(function(){
    });
    tokensTan.each(function(){
        this.clickable = true;
        this.toggleDraggable();
    });
    tokensSlate.each(function(){
        this.clickable = true;
        this.toggleDraggable();
    });
    $(this).replaceWith(
        "<p id='turnTracker'>White's Turn!</p>"
    );
    TurnController.initialize();
});


//get the tiles that that a tan piece can move to
function getDroppableTiles_tan(){
    var jumpFlag1 = false;
    var jumpFlag2 = false;
    var target1 = tiles.getByPosition(this.tile.column - 1, this.tile.row + 1);
    if(target1 != null && tokensSlate.has(target1.token)){
        target1 = tiles.getByPosition(this.tile.column - 2, this.tile.row + 2);
        jumpFlag1 = true;
    }

    var target2 = tiles.getByPosition(this.tile.column + 1, this.tile.row + 1);
    if(target2 != null && tokensSlate.has(target2.token)){
        target2 = tiles.getByPosition(this.tile.column + 2, this.tile.row + 2);
        jumpFlag2 = true;
    }

    if(target1 == null || target1.hasToken()){
        if(!jumpFlag1) target1 = null;
    }
    if(target2 == null || target2.hasToken()){
        if(!jumpFlag2) target2 = null;
    }

    playableTiles.pt1 = target1;
    playableTiles.pt2 = target2;
};

//get the tiles that a slate piece can move to
function getDroppableTiles_slate(){
    var jumpFlag1 = false;
    var jumpFlag2 = false;
    var target1 = tiles.getByPosition(this.tile.column - 1, this.tile.row - 1);
    if(target1 != null && tokensSlate.has(target1.token)){
        target1 = tiles.getByPosition(this.tile.column - 2, this.tile.row - 2);
    }

    var target2 = tiles.getByPosition(this.tile.column + 1, this.tile.row - 1);
    if(target2 != null && tokensSlate.has(target2.token)){
        target2 = tiles.getByPosition(this.tile.column + 2, this.tile.row - 2);
    }

    if(target1 == null || target1.hasToken()){
        if(!jumpFlag1) target1 = null;
    }
    if(target2 == null || target2.hasToken()){
        if(!jumpFlag2) target2 = null;
    }

    playableTiles.pt1 = target1;
    playableTiles.pt2 = target2;
};

function getDroppableTiles_king(){

};


function toggleDroppableTiles() {
    console.log('toggle droppable called');
    console.log('selection made = ' + selectionMade);
    if(selectionMade){
        TurnController.resetTiles();
        selectionMade = false;
    } else {
        this.getDroppableTiles();
        $.each(playableTiles, function(key, value){
            if(value != null) {
                console.log(value.toString());
                value.toggleDroppable();
            }
        });
        selectionMade = true;
    }
};

//show valid destination tiles for a tan token
function showDroppableTiles_tan() {
    var target1 = tiles.getByPosition(this.tile.column - 1, this.tile.row + 1);
    if(target1 != null && tokensSlate.has(target1.token)){
        target1 = tiles.getByPosition(this.tile.column - 2, this.tile.row + 2);
    }

    var target2 = tiles.getByPosition(this.tile.column + 1, this.tile.row + 1);
    if(target2 != null && tokensSlate.has(target2.token)){
        target2 = tiles.getByPosition(this.tile.column + 2, this.tile.row + 2);
    }

    var ret = {target1: null, target2: null};

    //check to see if token clicked is the same as the one already selected
    if (playableTiles.pt1 == target1 && playableTiles.pt2 == target2){
        if(playableTiles.pt1 != null && !playableTiles.pt1.hasToken()) playableTiles.pt1.toggleDroppable();
        if(playableTiles.pt2 != null && !playableTiles.pt2.hasToken()) playableTiles.pt2.toggleDroppable();
        playableTiles.pt1 = null;
        playableTiles.pt2 = null;
        return ret;
    }

    //reset pT1, if necessary, checking for null, whether the tile is occupied,  and for cross-matches between pt1/target2
    if ((playableTiles.pt1 != null && !playableTiles.pt1.hasToken()) || (playableTiles.pt1 != null && playableTiles.pt1 == target2)) {
        playableTiles.pt1.toggleDroppable();
    }
    playableTiles.pt1 = target1;

    //reset pT2, if necessary, checking for null and for cross-matches between pt2/target1
    if ((playableTiles.pt2 != null && !playableTiles.pt2.hasToken()) || (playableTiles.pt2 != null && playableTiles.pt2 == target2)) {
        playableTiles.pt2.toggleDroppable();
    }
    playableTiles.pt2 = target2;

    if (playableTiles.pt1 != null && !playableTiles.pt1.hasToken()){
        playableTiles.pt1.toggleDroppable();
        ret.target1 = playableTiles.pt1;
    }
    if (playableTiles.pt2 != null && !playableTiles.pt2.hasToken()){
        playableTiles.pt2.toggleDroppable();
        ret.target2 = playableTiles.pt2;
    }

    return ret;
}



//get valid destination tiles for a slate token
function showDroppableTiles_slate() {
    var target1 = tiles.getByPosition(this.tile.column - 1, this.tile.row - 1);
    if(target1 != null && tokensTan.has(target1.token)){
        target1 = tiles.getByPosition(this.tile.column - 2, this.tile.row - 2);
    }

    var target2 = tiles.getByPosition(this.tile.column + 1, this.tile.row - 1);
    if(target2 != null && tokensTan.has(target2.token)){
        target2 = tiles.getByPosition(this.tile.column + 2, this.tile.row - 2);
    }

    var ret = {target1: null, target2: null};

    //check to see if token clicked is the same as the one already selected
    if (playableTiles.pt1 == target1 && playableTiles.pt2 == target2){
        if(playableTiles.pt1 != null && !playableTiles.pt1.hasToken()) playableTiles.pt1.toggleDroppable();
        if(playableTiles.pt2 != null && !playableTiles.pt2.hasToken()) playableTiles.pt2.toggleDroppable();
        playableTiles.pt1 = null;
        playableTiles.pt2 = null;
        return ret;
    }

    //reset pT1, if necessary, checking for null, token,  and for cross-matches between pt1/target2
    if ((playableTiles.pt1 != null && !playableTiles.pt1.hasToken()) || (playableTiles.pt1 != null && playableTiles.pt1 == target2)) {
        playableTiles.pt1.toggleDroppable();
    }
    playableTiles.pt1 = target1;

    //reset pT2, if necessary, checking for null and for cross-matches between pt2/target1
    if ((playableTiles.pt2 != null && !playableTiles.pt2.hasToken()) || (playableTiles.pt2 != null && playableTiles.pt2 == target2)) {
        playableTiles.pt2.toggleDroppable();
    }
    playableTiles.pt2 = target2;

    if (playableTiles.pt1 != null && !playableTiles.pt1.hasToken()){
        playableTiles.pt1.toggleDroppable();
        ret.target1 = playableTiles.pt1;
    }
    if (playableTiles.pt2 != null && !playableTiles.pt2.hasToken()){
        playableTiles.pt2.toggleDroppable();
        ret.target2 = playableTiles.pt2;
    }
    return ret;
}

//show valid destination tiles for a crowned token
function showDroppableTiles_king() {

    var target1 = tiles.getByPosition(this.tile.column - 1, this.tile.row - 1);
    if(target1 != null && tokensTan.has(target1.token)){
        target1 = tiles.getByPosition(this.tile.column - 2, this.tile.row - 2);
    }

    var target2 = tiles.getByPosition(this.tile.column + 1, this.tile.row - 1);
    if(target2 != null && tokensTan.has(target2.token)){
        target2 = tiles.getByPosition(this.tile.column + 2, this.tile.row - 2);
    }

    var target3 = tiles.getByPosition(this.tile.column - 1, this.tile.row + 1);
    if(target3 != null && tokensTan.has(target3.token)){
        target3 = tiles.getByPosition(this.tile.column - 2, this.tile.row + 2);
    }

    var target4 = tiles.getByPosition(this.tile.column + 1, this.tile.row + 1);
    if(target4 != null && tokensTan.has(target4.token)){
        target4 = tiles.getByPosition(this.tile.column + 2, this.tile.row + 2);
    }

    var ret = {target1: null, target2: null, target3: null, target4: null};

    //check to see if token clicked is the same as the one already selected
    if (playableTiles.pt1 == target1 && playableTiles.pt2 == target2){
        if(playableTiles.pt1 != null && !playableTiles.pt1.hasToken()) playableTiles.pt1.toggleDroppable();
        if(playableTiles.pt2 != null && !playableTiles.pt2.hasToken()) playableTiles.pt2.toggleDroppable();
        if(playableTiles.pt3 != null && !playableTiles.pt3.hasToken()) playableTiles.pt3.toggleDroppable();
        if(playableTiles.pt4 != null && !playableTiles.pt4.hasToken()) playableTiles.pt4.toggleDroppable();
        playableTiles.pt1 = null;
        playableTiles.pt2 = null;
        playableTiles.pt3 = null;
        playableTiles.pt4 = null;
        return ret;
    }

    //reset pT1, if necessary, checking for null, token,  and for cross-matches between pt1/target2
    if ((playableTiles.pt1 != null && !playableTiles.pt1.hasToken()) || (playableTiles.pt1 != null && playableTiles.pt1 == target2)) {
        playableTiles.pt1.toggleDroppable();
    }
    playableTiles.pt1 = target1;

    //reset pT2, if necessary, checking for null and for cross-matches between pt2/target1
    if ((playableTiles.pt2 != null && !playableTiles.pt2.hasToken()) || (playableTiles.pt2 != null && playableTiles.pt2 == target2)) {
        playableTiles.pt2.toggleDroppable();
    }
    playableTiles.pt2 = target2;

    if (playableTiles.pt1 != null && !playableTiles.pt1.hasToken()){
        playableTiles.pt1.toggleDroppable();
        ret.target1 = playableTiles.pt1;
    }
    if (playableTiles.pt2 != null && !playableTiles.pt2.hasToken()){
        playableTiles.pt2.toggleDroppable();
        ret.target2 = playableTiles.pt2;
    }
    return ret;
}


function resetTokens(token){
    if(selectedToken === token) {
        selectedToken = null;
        token.toggleFill();
    } else if (selectedToken != null) {
        selectedToken.toggleFill();
        selectedToken = token;
        token.toggleFill();
    } else {
        selectedToken = token;
        selectedToken.toggleFill();
    }
}


//TODO: on selecting (clicking) a valid tile
function tileClick(){

}



function equalsIgnoreCase(str1, str2) {
    return (str1.toLowerCase() === str2.toLowerCase());
}



