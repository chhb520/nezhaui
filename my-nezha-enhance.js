const SCRIPT_VERSION = 'v20250814';

// == 样式注入模块 ==
function injectCustomCSS() {
  const style = document.createElement('style');
  style.textContent = `
    /* 可自定义隐藏特定元素 */
  `;
  document.head.appendChild(style);
}
injectCustomCSS();

// == 工具函数模块 ==
const utils = (() => {
  function formatFileSize(bytes) {
    if (bytes === 0) return { value: '0', unit: 'B' };
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
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
    return date.toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit' });
  }
  function safeSetTextContent(parent, selector, text) {
    const el = parent.querySelector(selector); if (el) el.textContent = text;
  }
  function getHslGradientColor(percentage) {
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
    const lerp = (start, end, t) => start + (end - start) * t;
    const p = clamp(Number(percentage), 0, 100);
    let h,s,l;
    if(p <= 35){ const t=p/35; h=lerp(142,32,t); s=lerp(69,85,t); l=lerp(45,55,t); }
    else if(p<=85){ const t=(p-35)/50; h=lerp(32,0,t); s=lerp(85,75,t); l=lerp(55,50,t);}
    else{ const t=(p-85)/15; h=0; s=75; l=lerp(50,45,t);}
    return `hsl(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%)`;
  }
  function fadeOutIn(element, newContent, duration = 500) {
    element.style.transition = `opacity ${duration/2}ms`; element.style.opacity='0';
    setTimeout(()=>{ element.innerHTML=newContent; element.style.transition=`opacity ${duration/2}ms`; element.style.opacity='1'; }, duration/2);
  }
  return { formatFileSize, calculatePercentage, formatDate, safeSetTextContent, getHslGradientColor, fadeOutIn };
})();

// == 网络展开模块（原版行为） ==
const netExpand = (() => {
  const selectorButton = '#root > div > main > div.mx-auto.w-full.max-w-5xl.px-0.flex.flex-col.gap-4.server-info > section > div.flex.justify-center.w-full.max-w-\\[200px\\] > div > div > div.relative.cursor-pointer.rounded-3xl.px-2\\.5.py-\\[8px\\].text-\\[13px\\].font-\\[600\\].transition-all.duration-500.text-stone-400.dark\\:text-stone-500';
  const selector3 = '#root > div > main > div.mx-auto.w-full.max-w-5xl.px-0.flex.flex-col.gap-4.server-info > div:nth-child(3)';
  const selector4 = '#root > div > main > div.mx-auto.w-full.max-w-5xl.px-0.flex.flex-col.gap-4.server-info > div:nth-child(4)';
  let hasClicked = false;

  function forceBothVisible() {
    const div3 = document.querySelector(selector3); const div4 = document.querySelector(selector4);
    if(div3) div3.style.display='block';
    if(div4) div4.style.display='block';
  }

  function tryClickButton() {
    const btn = document.querySelector(selectorButton);
    if(btn && !hasClicked){ btn.click(); hasClicked=true; setTimeout(forceBothVisible,500); }
  }

  const observer = new MutationObserver(()=>{ tryClickButton(); forceBothVisible(); });
  const root = document.querySelector('#root'); if(root) observer.observe(root,{ childList:true, attributes:true, subtree:true, attributeFilter:['style','class'] });
})();
  
// == 流量统计模块 ==
const trafficRenderer = (() => {
  const toggleElements=[];
  function renderTrafficStats(trafficData, config){
    const serverMap = new Map();
    for(const cycleId in trafficData){
      const cycle=trafficData[cycleId];
      if(!cycle.server_name || !cycle.transfer) continue;
      for(const serverId in cycle.server_name){
        const serverName=cycle.server_name[serverId]; const transfer=cycle.transfer[serverId];
        if(serverName && transfer!==undefined){
          serverMap.set(serverName,{id:serverId,transfer,max:cycle.max,from:cycle.from,to:cycle.to,next_update:cycle.next_update[serverId]});
        }
      }
    }

    serverMap.forEach((serverData, serverName)=>{
      const targetElement = Array.from(document.querySelectorAll('section.grid.items-center.gap-2'))
        .find(section => section.querySelector('p')?.textContent.trim()===serverName.trim());
      if(!targetElement) return;

      const usedFormatted=utils.formatFileSize(serverData.transfer);
      const totalFormatted=utils.formatFileSize(serverData.max);
      const percentage=utils.calculatePercentage(serverData.transfer, serverData.max);
      const fromFormatted=utils.formatDate(serverData.from);
      const toFormatted=utils.formatDate(serverData.to);
      const nextUpdateFormatted = new Date(serverData.next_update).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
      const uniqueClassName='traffic-stats-for-server-'+serverData.id;
      const progressColor = utils.getHslGradientColor(percentage);
      const containerDiv = targetElement.closest('div'); if(!containerDiv) return;

      let existing = Array.from(containerDiv.querySelectorAll('.new-inserted-element')).find(el => el.classList.contains(uniqueClassName));
      if(!config.showTrafficStats){ if(existing) existing.remove(); return; }

      if(existing){
        utils.safeSetTextContent(existing,'.used-traffic',usedFormatted.value);
        utils.safeSetTextContent(existing,'.used-unit',usedFormatted.unit);
        utils.safeSetTextContent(existing,'.total-traffic',totalFormatted.value);
        utils.safeSetTextContent(existing,'.total-unit',totalFormatted.unit);
        utils.safeSetTextContent(existing,'.percentage-value',percentage+'%');
        const progressBar = existing.querySelector('.progress-bar');
        if(progressBar){ progressBar.style.width=percentage+'%'; progressBar.style.backgroundColor=progressColor; }
      }else{
        const oldSection = containerDiv.querySelector('section.flex.items-center.w-full.justify-between.gap-1') || containerDiv.querySelector('section.grid.items-center.gap-3');
        if(!oldSection) return;

        const defaultTimeInfoHTML = `<span class="from-date">${fromFormatted}</span><span class="text-neutral-500 dark:text-neutral-400">-</span><span class="to-date">${toFormatted}</span>`;
        const contents=[defaultTimeInfoHTML, `<span class="text-[10px] font-medium text-neutral-800 dark:text-neutral-200 percentage-value">${percentage}%</span>`, `<span class="text-[10px] font-medium text-neutral-600 dark:text-neutral-300">${nextUpdateFormatted}</span>`];

        const newElement=document.createElement('div'); newElement.classList.add('space-y-1.5','new-inserted-element',uniqueClassName); newElement.style.width='100%';
        newElement.innerHTML = `<div class="flex items-center justify-between"><div class="flex items-baseline gap-1"><span class="text-[10px] font-medium text-neutral-800 dark:text-neutral-200 used-traffic">${usedFormatted.value}</span><span class="text-[10px] font-medium text-neutral-800 dark:text-neutral-200 used-unit">${usedFormatted.unit}</span><span class="text-[10px] text-neutral-500 dark:text-neutral-400">/ </span><span class="text-[10px] text-neutral-500 dark:text-neutral-400 total-traffic">${totalFormatted.value}</span><span class="text-[10px] text-neutral-500 dark:text-neutral-400 total-unit">${totalFormatted.unit}</span></div><div class="text-[10px] font-medium text-neutral-600 dark:text-neutral-300 time-info" style="opacity:1; transition: opacity 0.3s;">${defaultTimeInfoHTML}</div></div><div class="relative h-1.5"><div class="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-full"></div><div class="absolute inset-0 bg-emerald-500 rounded-full transition-all duration-300 progress-bar" style="width: ${percentage}%; max-width: 100%; background-color: ${progressColor};"></div></div>`;
        oldSection.after(newElement);

        const timeInfoElement = newElement.querySelector('.time-info');
        if(timeInfoElement) toggleElements.push({el:timeInfoElement,contents});
      }
    });
  }

  function startToggleCycle(toggleInterval,duration){
    if(toggleInterval<=0) return;
    let toggleIndex=0;
    setInterval(()=>{
      toggleIndex++;
      toggleElements.forEach(({el,contents})=>{
        if(!document.body.contains(el)) return;
        const index=toggleIndex % contents.length;
        utils.fadeOutIn(el,contents[index],duration);
      });
    },toggleInterval);
  }

  return { renderTrafficStats, startToggleCycle };
})();

// == 数据请求模块 ==
const trafficDataManager = (() => {
  let trafficCache = null;
  function fetchTrafficData(apiUrl, config, callback){
    const now = Date.now();
    if(trafficCache && (now-trafficCache.timestamp < config.interval)){
      callback(trafficCache.data);
      return;
    }
    fetch(apiUrl).then(res=>res.json()).then(data=>{
      if(!data.success) return;
      const trafficData = data.data.cycle_transfer_stats;
      trafficCache={timestamp: now, data: trafficData};
      callback(trafficData);
    });
  }
  return { fetchTrafficData };
})();

// == 主程序入口 ==
(function main(){
  const defaultConfig = { showTrafficStats:true, insertAfter:true, interval:60000, toggleInterval:5000, duration:500, apiUrl:'/api/v1/service', enableLog:false };
  let config = Object.assign({}, defaultConfig, window.TrafficScriptConfig || {});
  
  function updateTrafficStats(){
    trafficDataManager.fetchTrafficData(config.apiUrl, config, trafficData=>{
      trafficRenderer.renderTrafficStats(trafficData, config);
    });
  }

  function onDomChange(){ updateTrafficStats(); if(!trafficTimer) startPeriodicRefresh(); }
  let trafficTimer = null;
  function startPeriodicRefresh(){ if(!trafficTimer) trafficTimer=setInterval(updateTrafficStats,config.interval); }

  trafficRenderer.startToggleCycle(config.toggleInterval, config.duration);

  const sectionDetector = (()=>{
    const TARGET_SELECTOR='section.server-card-list, section.server-inline-list';
    let currentSection=null,childObserver=null;
    const observer=new MutationObserver(()=>{
      const section=document.querySelector(TARGET_SELECTOR);
      if(section && section!==currentSection){
        if(childObserver) childObserver.disconnect();
        currentSection=section;
        childObserver=new MutationObserver(()=>{ onDomChange(); });
        childObserver.observe(currentSection,{childList:true,subtree:false});
        onDomChange();
      }
    });
    observer.observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
    return observer;
  })();

  onDomChange();
  window.addEventListener('beforeunload',()=>{ sectionDetector.disconnect(); if(trafficTimer) clearInterval(trafficTimer); });
})();

