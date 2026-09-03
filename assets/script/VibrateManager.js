// 振动反馈（单例模块）
// 提供振动开关控制与 wx.vibrateShort 的兼容性封装。
// 振动开关持久化在 localStorage，key 为 'vibrate_on'，默认开启。
var VibrateManager = {
    // 触发短振动。type: 'light' | 'medium' | 'heavy'
    vibrate: function (type) {
        if (!window.VIBRATE_ON) {
            return;
        }
        var wxApi = window.wx;
        if (!wxApi || !wxApi.vibrateShort) {
            return;
        }
        wxApi.vibrateShort({
            type: type,
            fail: function () {
                // 低版本基础库不支持 type 参数，降级为默认短振动
                wxApi.vibrateShort({
                    fail: function () {
                        // 设备不支持振动（部分 iOS 机型），忽略
                    }
                });
            }
        });
    },

    // 读取振动开关状态（默认开启）
    getOn: function () {
        var saved = cc.sys.localStorage.getItem('vibrate_on');
        if (saved === null || saved === undefined) {
            return true;
        }
        return saved === true || saved === 'true';
    },

    // 设置并持久化振动开关
    setOn: function (on) {
        window.VIBRATE_ON = !!on;
        cc.sys.localStorage.setItem('vibrate_on', window.VIBRATE_ON ? 'true' : 'false');
        return window.VIBRATE_ON;
    },

    // 切换并持久化，返回切换后的状态
    toggle: function () {
        return this.setOn(!window.VIBRATE_ON);
    },
};

module.exports = VibrateManager;
