/* Behavioral measurement for GA4 property G-7DYM9XBY66. */
(() => {
  'use strict';
  if (window.analyticsInteractionsInstalled) return;
  window.analyticsInteractionsInstalled = true;

  const measurementId = 'G-7DYM9XBY66';
  const navigation = {
    '#overview': ['click_nav_overview', '대시보드'],
    '#trend': ['click_nav_trend', '트래픽 분석'],
    '#channels': ['click_nav_channels', '유입 채널'],
    '#pages': ['click_nav_pages', '페이지 리포트']
  };

  function send(eventName, parameters) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, {
      send_to: measurementId,
      page_path: window.location.pathname,
      ...parameters
    });
  }

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const control = event.target.closest('#export, nav a, a.logo');
    if (!control) return;
    let eventName;
    let buttonName;
    let buttonId;
    if (control.id === 'export') {
      eventName = 'click_export_report';
      buttonName = '리포트 내보내기';
      buttonId = 'export';
    } else if (control.matches('a.logo')) {
      eventName = 'click_logo';
      buttonName = 'Analytics 홈';
      buttonId = 'logo';
    } else {
      const item = navigation[control.getAttribute('href')];
      if (!item) return;
      [eventName, buttonName] = item;
      buttonId = control.getAttribute('href').slice(1);
    }
    send(eventName, {
      button_name: buttonName,
      button_id: buttonId,
      report_period: document.getElementById('period').value + 'days'
    });
  });

  document.getElementById('period').addEventListener('change', (event) => {
    send('change_report_period', {
      button_name: '조회 기간',
      button_id: 'period',
      report_period: event.target.value + 'days'
    });
  });

  // Progress through the scrollable distance: top = 0%, bottom = 100%.
  // Each threshold is sent once per page load, including anchor navigation.
  const thresholds = [25, 50, 75, 90, 100];
  const reached = new Set();
  let scheduled = false;
  function measureScroll() {
    scheduled = false;
    const root = document.scrollingElement || document.documentElement;
    const scrollable = root.scrollHeight - root.clientHeight;
    if (scrollable <= 1 || root.scrollTop <= 0) return;
    const percent = scrollable - root.scrollTop <= 1
      ? 100 : Math.min(100, root.scrollTop / scrollable * 100);
    for (const threshold of thresholds) {
      if (percent < threshold || reached.has(threshold)) continue;
      reached.add(threshold);
      send('scroll_depth_' + threshold, {
        scroll_depth: threshold + '%',
        percent_scrolled: threshold,
        scroll_distance_px: Math.round(root.scrollTop),
        scrollable_distance_px: Math.round(scrollable)
      });
    }
  }
  window.addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(measureScroll);
  }, { passive: true });
})();

