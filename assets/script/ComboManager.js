// 连击系统（单例模块）
// 短时间内连续触发合成时给予分数倍率加成。
// 倍率 = 1 + comboCount × 0.1（上限 3x），超过时间窗口未合成则连击清零。
var ComboManager = {
    // 连击判定时间窗口（秒）
    timeWindow: 3.0,

    // 倍率上限
    maxMultiplier: 3.0,

    // 当前连击数
    comboCount: 0,

    // 上次合成时间（秒）
    lastComboTime: 0,

    // 合成时调用：窗口内连击数 +1，超时则从 1 重新计数，返回本次合成倍率
    onMerge: function () {
        var now = Date.now() / 1000;
        if (now - this.lastComboTime <= this.timeWindow) {
            this.comboCount++;
        } else {
            this.comboCount = 1;
        }
        this.lastComboTime = now;
        return this.getMultiplier();
    },

    // 当前连击对应的分数倍率：1 + comboCount × 0.1，封顶 3x
    getMultiplier: function () {
        var m = 1 + this.comboCount * 0.1;
        return m > this.maxMultiplier ? this.maxMultiplier : m;
    },

    // 重置连击（新开局时调用）
    reset: function () {
        this.comboCount = 0;
        this.lastComboTime = 0;
    },
};

module.exports = ComboManager;
