// 撤回上一步：撤销上一次下落操作
var ItemBase = require('./ItemBase');

var UndoItem = cc.Class({
    extends: ItemBase,
    name: 'UndoItem',

    properties: {
        itemId: { default: 'undo' },
        itemName: { default: '撤回' },
        needTarget: { default: false },
        coolDown: { default: 0.5 },
    },

    canUse: function (game) {
        return game.canUndo();
    },

    use: function (game) {
        if (!game.undoLastDrop()) {
            game.showItemTip('没有可撤回的操作');
        }
    },
});

module.exports = UndoItem;