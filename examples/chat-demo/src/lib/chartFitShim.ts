export const CHART_FIT_SHIM = `
<style>html,body{margin:0!important;padding:0!important;}</style>
<script>(function(){function measure(){var d=document.documentElement,b=document.body;var w=Math.max(d.scrollWidth,b?b.scrollWidth:0,d.offsetWidth);var h=Math.max(d.scrollHeight,b?b.scrollHeight:0,d.offsetHeight);if(w&&h){try{parent.postMessage({__chartFit:true,w:w,h:h},'*');}catch(e){}}}window.addEventListener('load',measure);[60,250,600,1200].forEach(function(t){setTimeout(measure,t);});try{new ResizeObserver(measure).observe(document.documentElement);}catch(e){}})();</script>
`;
