// 开放数据域（子域）入口文件
//
// 运行在微信「开放数据域」这个独立 JS 作用域中，与主域完全隔离。
// 只能在这里访问关系链数据接口 wx.getFriendCloudStorage 等。
// 职责：接收主域消息 -> 拉取好友托管数据 -> 排序 -> 用 2D Canvas 绘制到 sharedCanvas。
//
// 注意：本文件不能被主域代码 require，也不得 require 主域代码。

var sharedCanvas = wx.getSharedCanvas();
var ctx = sharedCanvas.getContext('2d');

// 榜单类型：'all' 历史最高 / 'week' 本周最高
var currentType = 'all';
var friendsData = null; // 排序后的好友数据
var visible = false;    // 榜单是否显示
var selfOpenId = '';    // 自己的 openid，用于高亮
var images = {};        // 头像缓存：url -> Image（加载失败为 null）

// 与主域约定一致的key
var KEY_ALL = 'score';
var KEY_WEEK = 'week_score';

// 尝试获取自己的 openid（部分基础库支持，失败则不额外高亮）
try {
    if (typeof wx.getOpenId === 'function') {
        var oid = wx.getOpenId();
        if (oid) selfOpenId = oid;
    }
} catch (e) {
    selfOpenId = '';
}

// 监听主域消息
wx.onMessage(function (data) {
    if (!data || data.fromEngine) {
        return; // 忽略引擎自动发送的消息（boot / step / viewport）
    }
    if (data.command === 'show') {
        visible = true;
        currentType = (data.type === 'week') ? 'week' : 'all';
        loadAndRender(currentType);
    } else if (data.command === 'hide') {
        visible = false;
        friendsData = null;
        clearCanvas();
    }
});

// 从好友数据里取某个 key 的值
function getKV(entry, key) {
    var list = entry.KVDataList || [];
    for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].key === key) {
            return list[i].value;
        }
    }
    // 兼容某些返回结构里 data 为对象的情况
    if (entry.data && entry.data[key] !== undefined) {
        return entry.data[key];
    }
    return '0';
}

function toScore(str) {
    var n = parseInt(str, 10);
    return isNaN(n) ? 0 : n;
}

function getNickname(entry) {
    return entry.nickname || entry.nickName || '';
}

function getOpenId(entry) {
    return entry.openid || entry.openId || '';
}

function getAvatarUrl(entry) {
    return entry.avatarUrl || entry.avatar || '';
}

// 拉取好友数据并渲染
function loadAndRender(type) {
    wx.getFriendCloudStorage({
        keyList: [KEY_ALL, KEY_WEEK],
        success: function (res) {
            var list = (res && res.data) ? res.data.slice() : [];
            list.sort(function (a, b) {
                var key = (type === 'week') ? KEY_WEEK : KEY_ALL;
                return toScore(getKV(b, key)) - toScore(getKV(a, key));
            });
            friendsData = list;
            ensureAvatars(list);
            render(type);
        },
        fail: function (err) {
            friendsData = null;
            console.log('[排行榜-子域] getFriendCloudStorage fail',
                'errMsg=', err && err.errMsg,
                'errCode=', err && err.errCode,
                'errno=', err && err.errno);
            renderMessage('获取好友数据失败\n（可能未授权好友关系）');
        }
    });
}

// 预加载头像，加载完成后自动重绘
function ensureAvatars(list) {
    for (var i = 0; i < list.length; i++) {
        var url = getAvatarUrl(list[i]);
        if (!url || images[url] !== undefined) {
            continue;
        }
        images[url] = null; // 占位，避免重复加载
        var img = wx.createImage();
        img.onload = function () {
            images[url] = img;
            if (visible) render(currentType);
        };
        img.onerror = function () {
            images[url] = null;
        };
        img.src = url;
    }
}

function clearCanvas() {
    if (sharedCanvas.width <= 0 || sharedCanvas.height <= 0) return;
    ctx.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height);
}

function getSize() {
    var w = sharedCanvas.width;
    var h = sharedCanvas.height;
    // 主域 SubContextView 尚未设置尺寸时的兜底（与主域节点尺寸一致）
    if (!w || w <= 0) w = 540;
    if (!h || h <= 0) h = 580;
    return { w: w, h: h };
}

function render(type) {
    clearCanvas();
    if (!friendsData || friendsData.length === 0) {
        renderMessage('暂无同玩好友');
        return;
    }
    drawList(friendsData, type);
}

function renderMessage(text) {
    var s = getSize();
    ctx.clearRect(0, 0, s.w, s.h);
    ctx.fillStyle = '#8a6a3a';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var lines = String(text).split('\n');
    var lineH = 34;
    var startY = s.h / 2 - (lines.length - 1) * lineH / 2;
    for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], s.w / 2, startY + i * lineH);
    }
}

function drawList(list, type) {
    clearCanvas(); // 每次绘制前先清空，避免逐帧循环里叠加导致重影
    var s = getSize();
    var W = s.w;
    var H = s.h;
    var key = (type === 'week') ? KEY_WEEK : KEY_ALL;

    var rowH = 76;
    var top = 12;
    var maxRows = Math.max(1, Math.floor((H - top) / rowH));

    for (var i = 0; i < list.length && i < maxRows; i++) {
        drawRow(i, list[i], key, W, top + i * rowH, rowH);
    }
}

function drawRow(index, entry, key, W, y, rowH) {
    var isSelf = (selfOpenId && getOpenId(entry) === selfOpenId);

    // 自己的一行高亮底色
    if (isSelf) {
        ctx.fillStyle = 'rgba(255, 200, 90, 0.35)';
        ctx.fillRect(0, y + 4, W, rowH - 8);
    }

    // 排名
    var rank = index + 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 26px sans-serif';
    if (rank === 1) ctx.fillStyle = '#e0a018';
    else if (rank === 2) ctx.fillStyle = '#8f8f9b';
    else if (rank === 3) ctx.fillStyle = '#b57a3a';
    else ctx.fillStyle = '#7a5a30';
    ctx.fillText(String(rank), 38, y + rowH / 2);

    // 头像（圆形裁剪）
    var avatarUrl = getAvatarUrl(entry);
    var img = avatarUrl ? images[avatarUrl] : null;
    var cx = 92;
    var cy = y + rowH / 2;
    var r = 27;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (img) {
        ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    } else {
        ctx.fillStyle = '#ddcfae';
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    ctx.restore();
    // 头像描边
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = isSelf ? '#e0a018' : 'rgba(120, 90, 40, 0.5)';
    ctx.stroke();

    // 昵称（截断）
    var name = getNickname(entry) || '微信用户';
    if (isSelf) name += '（我）';
    if (name.length > 8) name = name.slice(0, 8) + '…';
    ctx.textAlign = 'left';
    ctx.font = (isSelf ? 'bold ' : '') + '24px sans-serif';
    ctx.fillStyle = isSelf ? '#a26206' : '#6b4a22';
    ctx.fillText(name, cx + r + 16, y + rowH / 2);

    // 分数（右对齐）
    ctx.textAlign = 'right';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#4a7a3a';
    ctx.fillText(String(toScore(getKV(entry, key))), W - 30, y + rowH / 2);

    // 分隔线
    if (index > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(120, 90, 40, 0.18)';
        ctx.lineWidth = 1;
        ctx.moveTo(20, y);
        ctx.lineTo(W - 20, y);
        ctx.stroke();
    }
}

// 渲染循环：持续重绘，保证主域设置 sharedCanvas 尺寸后内容能被正确绘制
// （设置宽高会清空画布，这里每帧重绘可以自动恢复）
var raf = (typeof requestAnimationFrame === 'function')
    ? requestAnimationFrame
    : function (cb) { setTimeout(cb, 16); };

function loop() {
    if (visible && friendsData) {
        drawList(friendsData, currentType);
    }
    raf(loop);
}
raf(loop);