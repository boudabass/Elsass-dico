// Service worker du Dico (Odoo 930, 09/10/2026) : reçoit la notification du
// défi du jour et ouvre l'app quand on appuie dessus. Repris de l'app
// marketing (Odoo 929). Pas de cache hors ligne : le dico a besoin du serveur.
//
// Servi hors du middleware (exclu du matcher) : un téléphone le relit sans
// cookie, et une redirection vers /login le casserait.

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (ev) { ev.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (ev) {
  var m = {};
  try { m = ev.data ? ev.data.json() : {}; } catch (e) { m = { corps: ev.data ? ev.data.text() : '' }; }
  ev.waitUntil(self.registration.showNotification(m.titre || 'Défi du jour', {
    body: m.corps || '',
    icon: '/icones/icone-192.png',
    tag: m.tag || 'defi-du-jour',
    renotify: true,
    data: { url: m.url || '/jeu' },
    lang: 'fr'
  }));
});

// Appui sur la notification : on réutilise une fenêtre du dico déjà ouverte,
// sinon on en ouvre une.
self.addEventListener('notificationclick', function (ev) {
  ev.notification.close();
  var url = new URL((ev.notification.data && ev.notification.data.url) || '/jeu', self.location.origin).href;
  ev.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (fenetres) {
    for (var i = 0; i < fenetres.length; i++) {
      var f = fenetres[i];
      if (new URL(f.url).origin === self.location.origin && 'focus' in f) {
        return f.navigate(url)
          .then(function (g) { return (g || f).focus(); })
          .catch(function () { return self.clients.openWindow(url); });
      }
    }
    return self.clients.openWindow(url);
  }));
});
