const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'tracking.js'), 'utf8');

function setup() {
  const events = [];
  const handlers = {};
  const frames = [];
  const root = { scrollHeight: 2000, clientHeight: 1000, scrollTop: 0 };
  const period = { value: '30', addEventListener(name, fn) { handlers['period:' + name] = fn; } };
  class Element {
    constructor(kind, href) { this.kind = kind; this.href = href; this.id = kind === 'export' ? 'export' : ''; }
    closest() { return this; }
    matches(selector) { return selector === 'a.logo' && this.kind === 'logo'; }
    getAttribute() { return this.href; }
  }
  const context = {
    Element,
    document: {
      scrollingElement: root,
      getElementById() { return period; },
      addEventListener(name, fn) { handlers[name] = fn; }
    },
    window: {
      location: { pathname: '/analytics-/' },
      gtag(...args) { events.push(args); },
      addEventListener(name, fn) { handlers[name] = fn; },
      requestAnimationFrame(fn) { frames.push(fn); }
    }
  };
  vm.runInNewContext(source, context);
  return { events, handlers, root, period, Element, context,
    scroll(value) { root.scrollTop = value; handlers.scroll(); while (frames.length) frames.shift()(); }
  };
}

test('all navigation controls and export have distinct event names', () => {
  const s = setup();
  for (const control of [new s.Element('export'), new s.Element('logo'),
    ...['overview', 'trend', 'channels', 'pages'].map(id => new s.Element('nav', '#' + id))]) {
    s.handlers.click({ target: control });
  }
  assert.deepEqual(s.events.map(e => e[1]), ['click_export_report', 'click_logo', 'click_nav_overview', 'click_nav_trend', 'click_nav_channels', 'click_nav_pages']);
  assert.ok(s.events.every(e => e[2].send_to === 'G-7DYM9XBY66'));
  assert.equal(s.events[0][2].report_period, '30days');
});

test('period change includes selected period', () => {
  const s = setup();
  s.handlers['period:change']({ target: { value: '7' } });
  assert.equal(s.events[0][1], 'change_report_period');
  assert.equal(s.events[0][2].report_period, '7days');
});

test('depth thresholds are once per page even after repeated scrolling', () => {
  const s = setup();
  s.scroll(0); s.scroll(249);
  assert.equal(s.events.length, 0);
  s.scroll(250); s.scroll(500); s.scroll(1000); s.scroll(0); s.scroll(1000);
  assert.deepEqual(s.events.map(e => e[1]), ['scroll_depth_25', 'scroll_depth_50', 'scroll_depth_75', 'scroll_depth_90', 'scroll_depth_100']);
  assert.equal(s.events[4][2].percent_scrolled, 100);
});

test('non-scrollable pages and duplicate initialization do not emit extra events', () => {
  const s = setup();
  s.root.scrollHeight = s.root.clientHeight;
  s.scroll(1);
  assert.equal(s.events.length, 0);
  const clickHandler = s.handlers.click;
  vm.runInNewContext(source, s.context);
  assert.equal(s.handlers.click, clickHandler);
});

