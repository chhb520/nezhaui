/* =======================
   用户统一配置区
   ======================= */
const USER_CONFIG = {
  // ======= 功能开关 =======
  showTrafficStats: true,       // 是否显示流量条
  insertAfter: true,            // 插入位置（true=插在 section 后面）
  interval: 60000,              // 数据刷新间隔(ms)
  toggleInterval: 5000,         // 时间/百分比切换间隔(ms)（0=不切换）
  duration: 500,                // 切换渐隐渐现动画时间(ms)
  enableLog: false,             // 控制台日志输出

  // ======= 视觉控制 =======
  DisableAnimatedMan: true,     // 小人动画（true=隐藏）
  ShowNetTransfer: false,       // 总流量信息（true=显示）
  ForceUseSvgFlag: true,        // 强制使用 SVG 国旗
  hideSelector: '.mt-4.w-full.mx-auto > div', // 页面隐藏元素的 CSS 选择器

  // ======= API 配置 =======
  apiUrl: '/api/v1/service',    // 流量数据 API

  // ======= 颜色区间（HSL）=======
  colorRanges: {
    low:    { from: [142, 69, 45], to: [ 32, 85, 55], max: 35 },  // 低用量（绿→橙）
    medium: { from: [ 32, 85, 55], to: [  0, 75, 50], max: 85 },  // 中用量（橙→红）
    high:   { from: [  0, 75, 50], to: [  0, 75, 45], max: 100 }, // 高用量（红→深红）
  }
};

/* =======================
   样式注入
   ======================= */
(function injectCustomCSS() {
  const style = document.createElement('style');
  style.textContent = `${USER_CONFIG.hideSelector} { display: none; }`;
  document.head.appendChild(style);
})();

/* =======================
   工具函数
   ======================= */
const utils = (() => {
  function formatFileSize(bytes) {
    if (bytes === 0) return { value: '0', unit: 'B' };
    const units = ['B','KB','MB','GB','TB','PB'];
    let size = bytes, unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024; unitIndex++;
    }
    return { value: size.toFixed(unitIndex === 0 ? 0 : 2), unit: units[unitIndex] };
  }
  function calculatePercentage(used, total) {
    used = Number(used); total = Number(total);
    if (used > 1e15 || total > 1e15) { used /= 1e10; total /= 1e10; }
    return total === 0 ? '0.00' : ((used / total) * 100).toFixed(2);
  }
  function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
  function safeSetTextContent(parent, selector, text) {
    const el = parent.querySelector(selector); if (el) el.textContent = text;
  }
  function getHslGradientColor(percentage) {
    const clamp = (val,min,max) => Math.min(Math.max(val,min),max);
    const lerp  = (start,end,t) => start + (end - start) * t;
    const p = clamp(Number(percentage),0,100);
    const { low, medium, high } = USER_CONFIG.colorRanges;
    let h,s,l;
    if (p <= low.max) {
      const t = p / low.max;
      [h,s,l] = [lerp(low.from[0], low.to[0], t), lerp(low.from[1], low.to[1], t), lerp(low.from[2], low.to[2], t)];
    } else if (p <= medium.max) {
      const t = (p - low.max) / (medium.max - low.max);
      [h,s,l] = [lerp(medium.from[0], medium.to[0], t), lerp(medium.from[1], medium.to[1], t), lerp(medium.from[2], medium.to[2], t)];
    } else {
      const t = (p - medium.max) / (high.max - medium.max);
      [h,s,l] = [high.from[0], high.from[1], lerp(high.from[2], high.to[2], t)];
    }
    return `hsl(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%)`;
  }
  function fadeOutIn(element,newContent,duration=500) {
    element.style.transition = `opacity ${duration/2}ms`;
    element.style.opacity = '0';
    setTimeout(() => {
      element.innerHTML = newContent;
      element.style.transition = `opacity ${duration/2}ms`;
      element.style.opacity = '1';
    }, duration / 2);
  }
  return { formatFileSize, calculatePercentage, formatDate, safeSetTextContent, getHslGradientColor, fadeOutIn };
})();

/* =======================
   流量统计模块
   ======================= */
// ...（这里你的原逻辑保持不动，直接用 USER_CONFIG 里的值代替原来的 defaultConfig）
