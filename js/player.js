// 播放器控制模块

// 全局变量，由本模块管理或依赖外部模块（如 lyrics.js, gift.js）
// script.js 中定义的全局变量，现在需要在此处重新声明或通过 window 访问
window.wavesurfer = null; // WaveSurfer 实例
window.lyrics = window.lyrics || []; // 歌词数据，期望由 lyrics.js 加载并填充
window.lrcLoaded = window.lrcLoaded || false; // 歌词加载状态，期望由 lyrics.js 更新
window.isPlaying = false; // 播放状态
window.currentLine = -1; // 当前歌词行索引
window.rafId = null; // requestAnimationFrame ID
window.isLooping = false; // 循环播放状态
let userScrolled = false; // 用户是否滚动了歌词区域
let pendingSeekTime = null; // 记录因音频未加载而待处理的歌词跳转时间

// 渲染歌词和播放器控制
function renderLyrics() {
    const container = document.getElementById('music-player');
    if (!container) {
        console.error('Music player container not found.');
        return;
    }
    // lyrics 数组现在只包含非空歌词, 确保 window.lyrics 可访问
    let durationText = '00:00';
    // 优先从DOM中已有的duration获取，因为ready事件应该已经更新了它
    const existingDurationEl = document.getElementById('duration');
    if (existingDurationEl && existingDurationEl.textContent !== '00:00') {
        durationText = existingDurationEl.textContent;
    } else if (window.wavesurfer && audioLoaded && typeof window.wavesurfer.getDuration === 'function') {
        // 如果DOM中没有有效时长，并且音频已加载，则尝试从wavesurfer获取
        const dur = window.wavesurfer.getDuration();
        if (typeof dur === 'number' && isFinite(dur) && dur > 0) {
            durationText = formatTime(dur);
        }
    }

    container.innerHTML = `
        <div class="time-display" style="text-align: center; margin-bottom: 0.5rem;">
            <span id="current-time">00:00</span> / <span id="duration">${durationText}</span>
        </div>
        <div class="lyrics-box">${(window.lyrics || []).map((l, i) => `<p id="lrc-${i}" class="lyric-line" data-time="${l.time}">${highlightBlessing(l.text)}</p>`).join('')}</div>
        <div class="player-controls" style="display: flex; align-items: center; width: 100%;">
            <div class="control-buttons-group" style="display: flex; justify-content: center; align-items: center; flex-grow: 1;">
                <button id="loop-btn" title="循环" style="margin-right: 10px;">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" class="${window.isLooping ? 'active' : ''}">
                        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                    </svg>
                </button>
                <button id="play-btn" title="播放/暂停" style="margin-right: 10px;">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        ${window.isPlaying ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>'}
                    </svg>
                </button>
                <button id="locate-btn" title="定位当前歌词" style="display: none; margin-right: 10px;">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                </button>
                <button id="volume-btn" title="静音/取消静音" style="margin-left: 10px;">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                </button>
                <input type="range" id="volume-slider" min="0" max="1" step="0.01" value="1" title="音量" style="width: 80px; margin-left: 5px; cursor: pointer;">
            </div>
        </div>
    `;
    document.getElementById('play-btn').onclick = togglePlay;
    document.getElementById('loop-btn').onclick = toggleLoop;
    document.getElementById('locate-btn').onclick = locateCurrentLyric;
    // The clear-gift-log-btn is now in index.html, ensure event listener is attached there or globally if needed.
    // For now, we assume it's handled where it's defined or via a global event listener setup elsewhere if it's part of a different module.
    // If clearGiftTriggerLog is part of this player module's responsibility and the button is outside its direct render scope,
    // we might need to attach it in a more global setup function or ensure the gift.js (or other relevant module) handles its own button.
    // Let's assume gift.js or a similar module will handle the event listener for #clear-gift-log-btn as it's related to gift logic.
    // However, if it's intended to be controlled from player.js, this is where it would be re-attached:
    const clearGiftLogBtnHTML = document.getElementById('clear-gift-log-btn');
    if (clearGiftLogBtnHTML && typeof window.clearGiftTriggerLog === 'function') {
        clearGiftLogBtnHTML.addEventListener('click', window.clearGiftTriggerLog);
    } else if (clearGiftLogBtnHTML) {
        console.warn('clearGiftTriggerLog function not found, but clear-gift-log-btn element exists.');
    }

    // 音量控制
    const volumeBtn = document.getElementById('volume-btn');
    const volumeSlider = document.getElementById('volume-slider');

    if (volumeBtn && volumeSlider && window.wavesurfer) {
        volumeBtn.addEventListener('click', () => {
            const isMuted = window.wavesurfer.getMuted();
            window.wavesurfer.setMuted(!isMuted);
            volumeBtn.innerHTML = !isMuted ? 
                '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>' : 
                '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
            volumeSlider.value = isMuted ? (window.wavesurfer.getVolume() > 0 ? window.wavesurfer.getVolume() : 0.5) : 0; // 如果取消静音，恢复之前音量或默认0.5；如果静音，滑块到0
        });

        volumeSlider.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            window.wavesurfer.setVolume(volume);
            window.wavesurfer.setMuted(volume === 0);
            volumeBtn.innerHTML = volume === 0 ?
                '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>' :
                '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        });

        // 初始化音量条和按钮状态
        const initialVolume = window.wavesurfer.getVolume();
        volumeSlider.value = initialVolume;
        window.wavesurfer.setMuted(initialVolume === 0);
        volumeBtn.innerHTML = initialVolume === 0 ?
            '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>' :
            '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
    }

    const lyricLines = document.querySelectorAll('.lyric-line');
    lyricLines.forEach(line => {
        line.addEventListener('click', () => {
            const time = parseFloat(line.getAttribute('data-time'));
            if (window.wavesurfer && !isNaN(time)) {
                const duration = window.wavesurfer.getDuration();
                if (audioLoaded && typeof duration === 'number' && isFinite(duration) && duration > 0) {
                    window.wavesurfer.seekTo(time / duration);
                    if (!window.isPlaying) {
                        togglePlay(); // 如果没在播放，则开始播放
                    } else {
                        syncLyrics(); // 如果已在播放，同步歌词
                    }
                } else {
                    // 音频未加载或时长无效
                    console.log('Audio not ready or duration invalid. Will seek after load.');
                    pendingSeekTime = time; // 记录期望跳转的时间
                    if (!window.isPlaying) {
                        togglePlay(); // 调用togglePlay来加载并播放音频
                    } else {
                        // 如果正在播放但duration无效（不太可能，除非刚开始播放且事件顺序问题），
                        // togglePlay 也会处理（虽然主要是针对未加载的情况）
                        // 或者，如果wavesurfer正在播放但audioLoaded为false，也通过togglePlay处理
                        togglePlay(); 
                    }
                }
            }
        });
    });

    // 歌词区域滚动事件
    const lyricsBox = document.querySelector('.lyrics-box');
    if (lyricsBox) {
        lyricsBox.addEventListener('scroll', () => {
            userScrolled = true;
            const locateBtn = document.getElementById('locate-btn');
            if (locateBtn) locateBtn.style.display = 'inline-block';
        });
    }
}
window.renderLyrics = renderLyrics; // 暴露给 lyrics.js

// 高亮祝福歌词 (此函数现在是 player.js 的一部分)
function highlightBlessing(line) {
    return line; // 简化，原高亮逻辑已注释
}

// /暂停
let audioLoaded = false; // 标记音频是否已加载
function togglePlay() {
    if (!window.wavesurfer) return;

    // 对于 MediaElement 后端，不需要显式管理 AudioContext 的 resume
    // 音频播放通常在用户交互（如点击按钮）后由浏览器允许

    if (!audioLoaded) {
        console.log('Audio not loaded. Loading now...');
        window.wavesurfer.load('../毛不易 - 一程山路.mp3');
        audioLoaded = true; // 标记已加载，防止重复加载
        
        window.wavesurfer.once('ready', () => {
            console.log('WaveSurfer is ready.');
            const duration = window.wavesurfer.getDuration();
            const durationEl = document.getElementById('duration');
            if (durationEl && typeof duration === 'number' && isFinite(duration) && duration > 0) {
                durationEl.textContent = formatTime(duration);
            } else if (durationEl) {
                console.warn('Failed to get valid duration on ready, or durationEl not found.');
                durationEl.textContent = '00:00'; // Fallback
            }
            // 音频准备好后，检查是否有待处理的 seek 请求
            if (pendingSeekTime !== null && typeof window.wavesurfer.getDuration === 'function') {
                const newDuration = window.wavesurfer.getDuration();
                if (typeof newDuration === 'number' && isFinite(newDuration) && newDuration > 0) {
                    console.log(`Audio ready, seeking to pending time: ${pendingSeekTime}`);
                    window.wavesurfer.seekTo(pendingSeekTime / newDuration);
                    pendingSeekTime = null; // 重置
                    // 如果此时还未播放，playAudio会处理播放。如果已因其他操作播放，seekTo会生效。
                } else {
                    console.warn('Could not seek to pending time, duration still invalid after ready.');
                    pendingSeekTime = null; // 避免无限循环或错误状态
                }
            }
            playAudio(); // 音频准备好后播放（或继续播放）
        });

        window.wavesurfer.once('loaderror', (error) => {
            console.error('Error loading audio:', error);
            alert('音频加载失败，请检查文件路径或网络连接。');
            audioLoaded = false; // 重置加载状态，以便下次尝试
        });

    } else {
        // 如果音频已加载，则直接切换播放/暂停状态
        playAudio();
    }
}

// 辅助函数，用于实际控制播放和UI更新
function playAudio() {
    const playBtn = document.getElementById('play-btn');
    if (window.wavesurfer.isPlaying()) {
        window.wavesurfer.pause();
        window.isPlaying = false;
        cancelAnimationFrame(window.rafId);
        if (playBtn) playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    } else {
        window.wavesurfer.play();
        window.isPlaying = true;
        syncLyrics();
        if (playBtn) playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    }
}

// 切换循环播放状态
function toggleLoop() {
    window.isLooping = !window.isLooping;
    const loopBtn = document.getElementById('loop-btn');
    if (loopBtn) {
        const svgElement = loopBtn.querySelector('svg');
        if (svgElement) {
            svgElement.classList.toggle('active', window.isLooping);
        }
    }
}

// 定位到当前歌词行
function locateCurrentLyric() {
    if (window.currentLine !== -1 && window.currentLine < (window.lyrics || []).length) {
        const lyricsBox = document.querySelector('.lyrics-box');
        const lineElem = document.getElementById(`lrc-${window.currentLine}`);
        if (lyricsBox && lineElem) {
            const boxRect = lyricsBox.getBoundingClientRect();
            const lineRect = lineElem.getBoundingClientRect();
            const lineCenterInBox = (lineRect.top - boxRect.top) + (lineRect.height / 2);
            const scrollTopTarget = lyricsBox.scrollTop + lineCenterInBox - (boxRect.height / 2);
            lyricsBox.scrollTo({
                top: scrollTopTarget,
                behavior: 'smooth'
            });
            const locateBtn = document.getElementById('locate-btn');
            if (locateBtn) locateBtn.style.display = 'none';
            userScrolled = false; // 点击定位后，重置用户滚动状态
        }
    }
}

// 初始化 WaveSurfer.js 播放器
function setupWaveSurfer() {
    if (window.wavesurfer) {
        try { window.wavesurfer.destroy(); } catch (e) { console.warn('Error destroying previous wavesurfer instance:', e); }
    }
    window.wavesurfer = WaveSurfer.create({
        container: '#music-player',
        waveColor: '#ffd200',
        progressColor: '#f7971e',
        height: 0,
        barWidth: 0,
        barGap: 0,
        responsive: true,
        cursorColor: '#f7971e',
        backend: 'MediaElement',
    });
    // window.wavesurfer.load('../毛不易 - 一程山路.mp3'); // 移动到 togglePlay 中
    window.wavesurfer.on('ready', () => {
        // 首先确保音频已加载，然后获取准确时长
        const duration = window.wavesurfer.getDuration();
        const durationEl = document.getElementById('duration');
        if (durationEl && typeof duration === 'number' && isFinite(duration) && duration > 0) {
            durationEl.textContent = formatTime(duration);
        } else if (durationEl) {
            durationEl.textContent = '00:00'; // Fallback
        }

        renderLyrics(); // 重新渲染控件，此时 duration 应该已经更新
        if (typeof window.showPersistentGiftIcon === 'function') {
            window.showPersistentGiftIcon(); // 更新礼物图标状态
        }
        // 再次确保 duration 在 renderLyrics 后如果需要可以被更新（虽然renderLyrics内部也会尝试更新）
        const currentDurationText = document.getElementById('duration')?.textContent;
        const actualDuration = window.wavesurfer.getDuration();
        if (durationEl && formatTime(actualDuration) !== currentDurationText && typeof actualDuration === 'number' && isFinite(actualDuration) && actualDuration > 0) {
             durationEl.textContent = formatTime(actualDuration);
        }
    });
    window.wavesurfer.on('finish', () => {
        const currentTimeEl = document.getElementById('current-time');
        if (currentTimeEl) currentTimeEl.textContent = formatTime(0);
        window.isPlaying = false;
        cancelAnimationFrame(window.rafId);
        const playBtn = document.getElementById('play-btn');
        if (playBtn) playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        if (window.currentLine !== -1) {
            const activeLine = document.getElementById(`lrc-${window.currentLine}`);
            if (activeLine) activeLine.classList.remove('active');
        }
        window.currentLine = -1;
        const lyricsBox = document.querySelector('.lyrics-box');
        if (lyricsBox) lyricsBox.scrollTo({ top: 0, behavior: 'smooth' });
        if (window.isLooping) {
            window.wavesurfer.play();
            window.isPlaying = true;
            syncLyrics();
            if (playBtn) playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        }
    });
    window.wavesurfer.on('error', (e) => {
        alert('播放器发生错误：' + (e && e.toString ? e.toString() : e));
    });
}
window.setupWaveSurfer = setupWaveSurfer; // 暴露给 script.js (main module)

// 歌词同步
function syncLyrics() {
    if (!window.lrcLoaded || !window.wavesurfer || (window.lyrics || []).length === 0) return;
    const cur = window.wavesurfer.getCurrentTime();
    const currentTimeEl = document.getElementById('current-time');
    if (currentTimeEl) currentTimeEl.textContent = formatTime(cur);
    
    let targetIdx = binarySearchLyric(cur);
    const lineJustChanged = window.currentLine !== targetIdx; // 标记歌词行是否在本次同步中刚刚改变

    if (lineJustChanged) {
        const prevLineEl = document.getElementById(`lrc-${window.currentLine}`);
        if (prevLineEl) prevLineEl.classList.remove('active');
        
        const currentLineEl = document.getElementById(`lrc-${targetIdx}`);
        if (targetIdx >= 0 && targetIdx < (window.lyrics || []).length && currentLineEl) {
            currentLineEl.classList.add('active');
            const lyricText = (window.lyrics || [])[targetIdx].text;
            // 检查是否是目标歌词，并调用 gift.js 的函数
            if (lyricText.includes(window.getTargetLyricForGift ? window.getTargetLyricForGift() : "") && 
                (typeof window.isGiftTriggered === 'function' && !window.isGiftTriggered()) &&
                typeof window.showGiftModal === 'function') {
                window.showGiftModal();
            }
        }
        window.currentLine = targetIdx;
    }

    // 条件：1. 歌词行刚刚发生了变化 (lineJustChanged)
    //       OR 2. 歌词行未变化，但用户没有手动滚动 (!userScrolled)
    // 并且当前行有效
    if ((lineJustChanged || !userScrolled) && window.currentLine !== -1 && window.currentLine < (window.lyrics || []).length) {
        const lyricsBoxElem = document.querySelector('.lyrics-box');
        const lineElem = document.getElementById(`lrc-${window.currentLine}`);
        const locateBtn = document.getElementById('locate-btn');

        if (lyricsBoxElem && lineElem) {
            const boxRect = lyricsBoxElem.getBoundingClientRect();
            const lineRect = lineElem.getBoundingClientRect();
            
            // 计算当前行在歌词框中的中心位置
            const lineCenterInBox = (lineRect.top - boxRect.top) + (lineRect.height / 2);
            // 计算滚动目标，使当前行位于歌词框的垂直中心
            const scrollTopTarget = lyricsBoxElem.scrollTop + lineCenterInBox - (boxRect.height / 2);
            
            lyricsBoxElem.scrollTo({
                top: scrollTopTarget,
                behavior: 'smooth'
            });

            // 如果定位按钮存在，则隐藏它，因为我们已经自动定位了
            if (locateBtn) {
                locateBtn.style.display = 'none';
            }
            // 如果是因为歌词行变化而滚动，或者是因为用户未滚动而保持居中，都重置 userScrolled
            userScrolled = false; 
        }
    }
    if (window.isPlaying) window.rafId = requestAnimationFrame(syncLyrics);
}

// 二分查找当前歌词行
function binarySearchLyric(time) {
    if ((window.lyrics || []).length === 0) return -1;
    let left = 0, right = (window.lyrics || []).length - 1, ans = 0;
    if (time < (window.lyrics || [])[0].time) return 0;
    if (time > (window.lyrics || [])[(window.lyrics || []).length - 1].time) return (window.lyrics || []).length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if ((window.lyrics || [])[mid].time <= time) {
            ans = mid;
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return ans;
}

// 时间格式化
function formatTime(sec) {
    sec = Math.floor(sec);
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
}