#!/usr/bin/env node
// Browser click/layout smoke checks using only Node.js and Chrome DevTools Protocol.
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const url = process.env.CV_TEST_URL || 'http://127.0.0.1:8765/';
const output = process.env.CV_SCREENSHOT_DIR || 'artifacts/browser-smoke';
const chromePath = process.env.CHROME_BIN || 'google-chrome';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-chrome-'));
const chrome = spawn(chromePath, [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  '--disable-background-networking', '--disable-extensions', '--no-first-run',
  '--no-proxy-server', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });

let socket;
let nextID = 0;
const callbacks = new Map();
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

try {
  let port;
  for (let i = 0; i < 100; i++) {
    if (chrome.exitCode !== null) throw Error(`Chrome exited: ${chrome.exitCode}`);
    try {
      const raw = await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8');
      port = raw.split('\n')[0].trim();
      break;
    } catch { await sleep(100); }
  }
  if (!port) throw Error('Chrome did not expose a DevTools port');

  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const tab = tabs.find(item => item.type === 'page');
  if (!tab) throw Error('Chrome has no page target');
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', event => {
    const reply = JSON.parse(event.data.toString());
    const pending = callbacks.get(reply.id);
    if (!pending) return;
    callbacks.delete(reply.id);
    if (reply.error) pending.reject(Error(reply.error.message));
    else pending.resolve(reply.result);
  });

  const command = async (method, params = {}) => {
    const id = ++nextID;
    const reply = new Promise((resolve, reject) => callbacks.set(id, { resolve, reject }));
    socket.send(JSON.stringify({ id, method, params }));
    return await reply;
  };
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };

  await command('Page.enable');
  await command('Runtime.enable');
  const navigation = await command('Page.navigate', { url });
  if (navigation.errorText) throw Error(`Cannot load test page: ${navigation.errorText}`);
  let ready = false;
  for (let i = 0; i < 100; i++) {
    ready = await evaluate("document.readyState !== 'loading' && !!document.querySelector('.cv-nav')");
    if (ready) break;
    await sleep(100);
  }
  if (!ready) throw Error('CV navigation did not render');

  check(await evaluate("document.title.includes('David Nguyen')"), 'Document title missing');
  check(await evaluate("document.querySelectorAll('script[src*=jquery],script[src*=webflow]').length === 0"), 'Unused libraries loaded');
  check(await evaluate("getComputedStyle(document.documentElement).scrollBehavior !== 'smooth'"), 'Smooth scroll still enabled');
  check(await evaluate(`document.querySelectorAll('a.download-cv-button[href$="DavidNguyen-Resume.pdf"]').length === 2`), 'PDF actions broken');

  for (const device of [
    { name: 'desktop', width: 1440, height: 900, mobile: false },
    { name: 'mobile', width: 390, height: 844, mobile: true },
  ]) {
    await command('Emulation.setDeviceMetricsOverride', {
      width: device.width, height: device.height, deviceScaleFactor: 1, mobile: device.mobile,
    });
    await sleep(250);
    const layout = await evaluate(`({
      viewport: innerWidth,
      width: document.documentElement.scrollWidth,
      navPosition: getComputedStyle(document.querySelector('.cv-nav')).position,
      links: Array.from(document.querySelectorAll('.cv-nav a'), a => ({
        hash: a.hash, height: a.getBoundingClientRect().height
      }))
    })`);
    check(layout.width <= layout.viewport + 2, `${device.name}: horizontal overflow ${layout.width}/${layout.viewport}`);
    check(layout.navPosition === 'static', `${device.name}: navigation is still sticky`);
    check(layout.links.length === 6, `${device.name}: expected six quick links`);
    if (device.mobile) check(layout.links.every(a => a.height >= 40), 'Mobile links need 40px+ tap targets');

    for (const link of layout.links) {
      const jump = await evaluate(`(() => {
        const a = Array.from(document.querySelectorAll('.cv-nav a')).find(x => x.hash === '${link.hash}');
        const target = document.getElementById(a.hash.substring(1));
        const started = performance.now();
        a.click();
        const actualTargetY = scrollY + target.getBoundingClientRect().top - parseFloat(getComputedStyle(target).scrollMarginTop || 0);
        const expected = Math.min(Math.max(0, actualTargetY), document.documentElement.scrollHeight - innerHeight);
        return { hash: location.hash, ms: performance.now() - started, delta: Math.abs(scrollY - expected) };
      })()`);
      check(jump.hash === link.hash, `${device.name}: click did not reach ${link.hash}`);
      check(jump.delta <= 70, `${device.name}: section jump did not complete instantly (${link.hash}, ${jump.delta}px)`);
      console.log(`${device.name} ${link.hash}: ${jump.ms.toFixed(1)}ms`);
    }

    await evaluate('scrollTo(0, 0)');
    await fs.mkdir(output, { recursive: true });
    const screenshot = await command('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile(path.join(output, `${device.name}.png`), Buffer.from(screenshot.data, 'base64'));
  }
  if (failures.length) {
    for (const failure of failures) console.error('FAIL:', failure);
    process.exitCode = 1;
  } else console.log('PASS: desktop/mobile navigation, document overflow, load, and screenshots');
} catch (error) {
  console.error('Browser smoke failed:', error.message);
  process.exitCode = 1;
} finally {
  socket?.close();
  chrome.kill('SIGTERM');
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
