// 生日祝福网页核心脚本（重构版）

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 初始化播放器
  if (typeof window.setupWaveSurfer === 'function') {
    window.setupWaveSurfer();
  } else {
    console.error('setupWaveSurfer function not found. Make sure player.js is loaded correctly.');
  }
  // 加载歌词
  if (typeof window.loadLRC === 'function') {
    window.loadLRC('../毛不易 - 一程山路.lrc');
  } else {
    console.error('loadLRC function not found. Make sure lyrics.js is loaded correctly.');
  }
  // 注意：showPersistentGiftIcon 的调用已移至 player.js 和 lyrics.js 内部，以确保在依赖加载完成后执行
});