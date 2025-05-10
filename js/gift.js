// 礼物功能模块

// 确保在 DOMContentLoaded 后执行，或者将此文件在 HTML 尾部引入

document.addEventListener('DOMContentLoaded', () => {
    // 礼物功能相关变量和常量
    const giftModal = document.getElementById('gift-modal');
    const closeGiftModalBtn = document.getElementById('close-gift-modal');
    const giftConfirmBtn = document.getElementById('gift-confirm-btn');
    const giftCancelBtn = document.getElementById('gift-cancel-btn');
    // const giftIconContainer = document.getElementById('gift-icon-container'); // 这个可能在主模块中处理或动态创建
    // const persistentGiftIcon = document.getElementById('persistent-gift-icon'); // 这个也可能在主模块中处理或动态创建
    let giftTriggered = false; // 默认值
    const giftTriggeredKey = 'gift_triggered_status'; // localStorage key
    const giftLink = ''; // 弹窗中“接受礼物”按钮的链接
    const persistentGiftIconLink = ''; // 用户指定的常驻礼物图标的独立链接
    const targetLyricForGift = "潺潺流水终于穿过了群山一座座"; // 这个可能需要从主模块传入或共享

    // 页面加载时初始化 giftTriggered 状态
    const initialStoredGiftStatus = localStorage.getItem(giftTriggeredKey);
    console.log('Gift Module: Initial gift_triggered_status from localStorage:', initialStoredGiftStatus);
    if (initialStoredGiftStatus === 'true') {
        giftTriggered = true;
    } else if (initialStoredGiftStatus === 'false') { // 明确处理 'false'
        giftTriggered = false;
    } else { // 其他情况 (null, undefined, 或其他非 'true'/'false' 的值)
        giftTriggered = false; // 默认为未触发
    }
    console.log('Gift Module: giftTriggered variable initialized to:', giftTriggered);

    // 显示礼物弹窗
    function showGiftModal() {
        if (!giftTriggered && giftModal) {
            giftModal.style.display = 'block';
        }
    }
    window.showGiftModal = showGiftModal; // 暴露给全局，以便 script.js 调用

    // 关闭礼物弹窗的处理函数
    function closeGiftModalHandler() {
        console.log('Gift Module: closeGiftModalHandler called. Current giftTriggered (before logic):', giftTriggered);
        if (giftModal) {
            giftModal.style.display = 'none';
        }
        if (!giftTriggered) {
            giftTriggered = true;
            localStorage.setItem(giftTriggeredKey, 'true');
            console.log('Gift Module: gift_triggered_status set to true in localStorage.');
            // 确保 showPersistentGiftIcon 在 gift.js 中定义或可访问
            if (typeof showPersistentGiftIcon === 'function') {
                 showPersistentGiftIcon(); // 调用本模块的 showPersistentGiftIcon
            } else if (window.showPersistentGiftIconFromMain) {
                 window.showPersistentGiftIconFromMain(); // 或者调用主模块暴露的函数
            }
        } else {
            console.log('Gift Module: Gift already triggered, no change to localStorage or giftTriggered variable.');
        }
    }

    // 显示常驻的礼物图标
    function showPersistentGiftIcon() {
        const giftIconContainer = document.getElementById('gift-icon-container');
        const persistentGiftIcon = document.getElementById('persistent-gift-icon');

        if (persistentGiftIcon && giftIconContainer) {
            if (giftTriggered) {
                // persistentGiftIcon.src = 'css/svg/gift.svg'; // 图标现在是 <i> 标签，不需要 src
                giftIconContainer.style.display = 'inline-flex'; // 保持与标题内联且内容居中
                // 添加点击事件监听器，确保只添加一次
                if (!persistentGiftIcon.hasAttribute('data-click-listener-added')) {
                    persistentGiftIcon.addEventListener('click', () => {
                        window.open(persistentGiftIconLink, '_blank'); // 使用常驻图标的独立链接
                    });
                    persistentGiftIcon.setAttribute('data-click-listener-added', 'true');
                }
            } else {
                // persistentGiftIcon.src = '';
                giftIconContainer.style.display = 'none';
            }
        } else {
            console.warn('Gift Module: Persistent gift icon or its container not found. Ensure IDs "gift-icon-container" and "persistent-gift-icon" are correct.');
        }
    }
    window.showPersistentGiftIcon = showPersistentGiftIcon; // 暴露给全局
    window.isGiftTriggered = () => giftTriggered; // 暴露 giftTriggered 状态
    window.getTargetLyricForGift = () => targetLyricForGift; // 暴露 targetLyricForGift


    // 清除礼物触发记录
    function clearGiftTriggerLog() {
        if (confirm('您确定要清除礼物缓存记录吗？此操作将重置礼物的触发状态。')) {
            localStorage.setItem(giftTriggeredKey, 'false');
            giftTriggered = false; 
            console.log('Gift Module: gift_triggered_status set to false in localStorage.');

            if (giftModal && giftModal.style.display === 'block') {
                giftModal.style.display = 'none';
            }
            showPersistentGiftIcon(); 
            alert('礼物缓存记录已清除。');
        } else {
            console.log('Gift Module: User cancelled clearing gift trigger log.');
        }
    }
    // 将 clearGiftTriggerLog 暴露到全局，以便 script.js 中的 renderLyrics 可以绑定它
    window.clearGiftTriggerLog = clearGiftTriggerLog;

    // 初始化礼物弹窗的关闭按钮事件
    if (closeGiftModalBtn) {
        closeGiftModalBtn.onclick = closeGiftModalHandler;
    }
    // 初始化礼物弹窗的确认按钮事件
    if (giftConfirmBtn) {
        giftConfirmBtn.onclick = function() {
            window.open(giftLink, '_blank');
            closeGiftModalHandler(); 
        };
    }
    // 初始化礼物弹窗的取消按钮事件
    if (giftCancelBtn) {
        giftCancelBtn.onclick = closeGiftModalHandler;
    }

    // 页面加载完成后，根据初始状态显示或隐藏常驻礼物图标
    // 这个调用需要确保 .player-controls 已经渲染完毕
    // 更好的做法是在 script.js 的 renderLyrics 完成后调用 window.showPersistentGiftIcon()
    // showPersistentGiftIcon(); // 初始调用，但可能太早

    // 暴露一个初始化函数，让 script.js 在合适的时候调用
    function initGiftModule() {
        // 可以在这里再次检查并设置 giftTriggered 状态，以防 script.js 中有覆盖
        const currentStatus = localStorage.getItem(giftTriggeredKey);
        if (currentStatus === 'true') giftTriggered = true;
        else if (currentStatus === 'false') giftTriggered = false;
        else giftTriggered = false; 
        // 初始显示/隐藏图标，此时 player-controls 应该已经由 script.js 渲染
        showPersistentGiftIcon();
    }
    window.initGiftModule = initGiftModule;

});