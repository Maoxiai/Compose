// 道具基类
// 各道具继承 ItemBase，重写 canUse / use / onPickTarget 实现具体逻辑。
// - canUse(game): 当前是否可用（如场上是否有水果）
// - use(game): 立即生效类道具的主逻辑（换水果 / 缩小 / 撤回）
// - onPickTarget(game, localPos): 需要二次点选目标的道具（炸弹）在点选目标后执行，
//   返回 true 表示命中并已生效，false 表示未命中（不消耗道具）
var ItemBase = cc.Class({
    name: 'ItemBase',

    properties: {
        // 道具唯一标识，用于本地存储 key（如 'bomb'）
        itemId: { default: '' },
        // 道具显示名称
        itemName: { default: '' },
        // 是否需要二次点选目标
        needTarget: { default: false },
        // 冷却时间（秒）
        coolDown: { default: 0 },
    },

    // 是否可用，子类按需重写
    canUse: function (game) {
        return true;
    },

    // 立即生效类道具逻辑，子类重写
    use: function (game) {
    },

    // 二次点选目标后的逻辑，子类重写
    onPickTarget: function (game, localPos) {
        return false;
    },
});

module.exports = ItemBase;