// 定义全局变量
window.WETERMELON_TYPE = 0;
window.WETERMELON_ARRAY = [];
window.SCORE = 0;
window.bannerAd = null;
window.s_width = 0;
window.s_height = 0;
 // 定义插屏广告
 window.interstitialAd = null;
 // 定义原生广告
 window.customAd = null;
 // 音效开关（true 开启，false 静音）
 window.SOUND_ON = true;
 // 振动开关（true 开启，false 关闭）
 window.VIBRATE_ON = true;

// 调试日志开关：true 输出调试日志，false 静默（上线建议 false）
window.DEBUG = false;
// 调试日志：仅 DEBUG 开启时输出，避免真机 console 开销与刷屏
window.log = function () {
    if (window.DEBUG) {
        console.log.apply(console, arguments);
    }
};
// 错误日志：无论 DEBUG 与否都输出，便于线上排查
window.logError = function () {
    console.error.apply(console, arguments);
};