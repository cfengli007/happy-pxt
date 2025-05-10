// 歌词处理模块

document.addEventListener('DOMContentLoaded', () => {
    // 外部依赖：lyrics, lrcLoaded (在 script.js 中定义并由本模块修改)
    // 外部依赖：renderLyrics (在 script.js 中定义并由本模块调用)
    // 外部依赖：window.showPersistentGiftIcon (在 gift.js 中定义并由本模块调用)

    // 解析 LRC 歌词
    function parseLRC(text) {
        const lines = text.split('\n');
        const result = [];
        const timeExp = /^\[(\d{2}):(\d{2}\.\d{2})\](.*)/;
        for (const line of lines) {
            const match = timeExp.exec(line);
            if (match) {
                const min = parseInt(match[1]);
                const sec = parseFloat(match[2]);
                const time = min * 60 + sec;
                const lyricText = match[3].trim(); // Trim whitespace
                if (lyricText) {
                    result.push({ time, text: lyricText });
                }
            }
        }
        return result;
    }

    // 加载歌词文件
    async function loadLRC() {
        try {
            const cached = localStorage.getItem('lrc_cache_non_empty');
            if (cached) {
                window.lyrics = JSON.parse(cached); // 修改 script.js 中的全局变量
                window.lrcLoaded = true;          // 修改 script.js 中的全局变量
                if (typeof window.renderLyrics === 'function') {
                    window.renderLyrics();
                }
                if (typeof window.showPersistentGiftIcon === 'function') {
                    window.showPersistentGiftIcon();
                }
                return;
            }
            const resp = await fetch('../毛不易 - 一程山路.lrc.txt');
            const text = await resp.text();
            window.lyrics = parseLRC(text);    // 修改 script.js 中的全局变量
            localStorage.setItem('lrc_cache_non_empty', JSON.stringify(window.lyrics));
            window.lrcLoaded = true;             // 修改 script.js 中的全局变量
            if (typeof window.renderLyrics === 'function') {
                window.renderLyrics();
            }
            if (typeof window.showPersistentGiftIcon === 'function') {
                window.showPersistentGiftIcon();
            }
        } catch (e) {
            const musicPlayerElement = document.getElementById('music-player');
            if (musicPlayerElement) {
                 musicPlayerElement.innerHTML = '<p>歌词加载失败</p>';
            } else {
                console.error('Music player element not found for error message.');
            }
            console.error('Error loading LRC:', e);
        }
    }

    // 将需要从外部调用的函数挂载到 window 对象
    window.loadLRC = loadLRC;
    // parseLRC 是内部函数，不需要挂载到 window
});