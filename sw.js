// GamesOne service worker: shows text notifications even when GamesOne is closed.
// Upload this file next to index.html and never rename it. You only upload it once:
// future GamesOne updates only replace index.html.
const ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAD/ElEQVR4Xu3dUW7TQBSGUUDsg32UtcEDe2MfZSWgoEaKKlpnHJt7Z/5znu1xYt8vaavE/fj07fn3Bwj1KfR5w18CIJoAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJgGgCIJoAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJgGgCIJoAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJgGgCIJoAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIj2eZZn//PHl1keKi++fv/V/lx8fPr2/LvrozT06+gaQ8sADP66uoXQ7ncAw7+2bte3VQDdTg7n6HSd2wTQ6aRwvi7Xu0UAXU4G/1eH614eQIeTQJ3q618eAFQqDaC6fnqonIPSAKCaAIhWFkDl2x79VM1DWQDQgQCIJgCiCYBoAiCaAIgmAKIJgGgCIJoAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKJN8/8BzvDWnYrP/n5q2nE7K7s9+tlD9p57b9F99GNMO+6oe8/PkeJ+BBo5ySPbbhlZa2TbLSNrjWy7iqgA9lzgPfu8tmeNPft0Oe5MYgJ4ZKDsu66IAB4Z4Ks9a+zZp8ur+BGPfQYRAcBblg/gyFeykbVGtt0ystbItluOXKur5QOA9wiAaAIgmgCIJgCiLR/AkZ/nGVlrZNstI2uNbLvlyLW6Wj4AiP8r0BGvZHvW2LPPa3vW2LPPEcedUcw7wCNDYd91xQRwsWeQ9+xzxKvpzMedSVQAoxEcMYRXI2uNbLtlZK2RbVcR+Y2wq7SvJlY933tVfPYoOgB6qQgg7kcguCUAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJgGgCIJoAiCYAogmAaAIgmgCIJgCiCYBoAiBaWQAVX4Cmr6p5KAsAOhAA0UoDqHrbo5fKOSgNAKqVB1BZP/Wqr395ABfVJ4EaHa57iwBEkKfD8F+0CUAEOboMf7sARLC+TsN/UXZ79Hsk/sOGVXUb/KvWAdwSw3y6Dv2taQI4SlVIMwxDola/BK/K8PclgJMZ/t4EcCLD358ATmL45yCAExj+eQjgYIZ/LgI4kOGfjwAOYvjnJIADGP55CeBBhn9uAniA4Z+fAHYy/GsQwA6Gfx0CGGT41yKAAYZ/PQK4k+FfkwDuYPjXJYANhn9tAniH4V+fAN5g+DMI4B8Mfw4BvGL4swjghuHPI4AXhj+TANyePVp8AF75s0UHYPiJDcDwcxEZgOHnKi4Aw8+tuABAAPDCOwDRBEA0ARBNAEQTANEEQDQBEE0ARBMA0QRANAEQTQBEEwDRBEA0ARBNAEQTANEEQDQBEE0ARBMA0QRANAEQTQBEEwDRBEC0P5GgAt3034aLAAAAAElFTkSuQmCC';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'GamesOne', body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // GamesOne is open and in front: let the page show its own pop-up instead
    const front = wins.find(w => w.visibilityState === 'visible' && w.focused);
    if (front) { front.postMessage(Object.assign({}, d, { type: 'push-dm' })); return; }
    await self.registration.showNotification(d.title || 'GamesOne', {
      body: d.body || 'sent you a text',
      tag: 'gamesone-dm-' + (d.from || ''),
      renotify: true,
      icon: ICON,
      badge: ICON,
      data: { from: d.from || null, name: d.name || null }
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const data = e.notification.data || {};
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if ('focus' in w) { await w.focus(); w.postMessage({ type: 'open-dm', from: data.from, name: data.name }); return; }
    }
    const url = new URL(self.registration.scope);
    if (data.from) { url.searchParams.set('dm', data.from); if (data.name) url.searchParams.set('dmname', data.name); }
    await self.clients.openWindow(url.href);
  })());
});
