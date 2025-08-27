
(
function () {
        console.log("unsplash.js loaded and executed");
        // Ваш Unsplash Access Key
        const UNSPLASH_KEY = 'tESmJQNjjp1CLrWyrdg5hx9xsnwO7ZMXv7HG3nMYIhU';

        const RENDERED_ATTR = 'data-unsplash-rendered';

        function renderUnsplashCollection(collectionId, container) {
          if (!collectionId || !container) return;
          container.setAttribute(RENDERED_ATTR, '1');
          console.debug('[Unsplash] renderUnsplashCollection', collectionId);

          var url =
            'https://api.unsplash.com/collections/' +
            encodeURIComponent(collectionId) +
            '/photos?per_page=24';
          console.debug('[Unsplash] fetch url', url);

          var fetchOptions = {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Authorization': 'Client-ID ' + UNSPLASH_KEY,
              'Accept-Version': 'v1'
            }
          };

          fetch(url, fetchOptions)
            .then(function (r) {
              console.debug('[Unsplash] response status', r.status, r.statusText);
              if (!r.ok) {
                return r.text().then(function (t) {
                  console.warn('[Unsplash] non-OK response', r.status, t);
                  throw new Error('HTTP ' + r.status + (t ? ' - ' + t.substr(0,200) : ''));
                });
              }
              return r.json();
            })
            .then(function (photos) {
              console.debug('[Unsplash] photos.length', photos && photos.length);
              if (!Array.isArray(photos) || !photos.length) {
                container.innerHTML = '<div style="color:#666;font-size:14px;padding:8px;">No photos returned</div>';
                return;
              }
              container.innerHTML = photos
                .map(function (photo) {
                  var alt = photo.alt_description || '';
                  var href =
                    (photo.links && photo.links.html) ||
                    (photo.urls && photo.urls.small) ||
                    '#';
                  var src =
                    (photo.urls && (photo.urls.small || photo.urls.thumb)) || '';
                  return (
                    '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' +
                    '<img src="' + src + '" alt="' + escapeHtml(alt) + '" style="max-width:200px;margin:4px;">' +
                    '</a>'
                  );
                })
                .join('');
            })
            .catch(function (err) {
              console.error('[Unsplash] load failed', err);
              try { container.innerHTML = '<div style="color:#c00;font-size:14px;padding:8px;'>Ошибка загрузки изображений Unsplash: ' + escapeHtml(err.message || String(err)) + '</div>'; } catch(e) { }
            });
        }

        function escapeHtml(s) {
          return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
          });
        }

        function processStaticPlaceholders(root) {
          var nodes = root.querySelectorAll(
            '.unsplash-collection[data-collection]:not([' + RENDERED_ATTR + '])'
          );
          nodes.forEach(function (div) {
            var id = (div.getAttribute('data-collection') || '').trim();
            if (id) renderUnsplashCollection(id, div);
          });
        }

        function processTextMarkers(root) {
          var nodes = root.querySelectorAll('p, span, div');
          nodes.forEach(function (el) {
            if (el.hasAttribute(RENDERED_ATTR)) return;
            var text = el.textContent || '';
            var m = text.match(/\[unsplash:([\w-]+)\]/i);
            if (m) {
              var gallery = document.createElement('div');
              gallery.style.margin = '16px 0';
              el.setAttribute(RENDERED_ATTR, '1');
              el.parentNode.insertBefore(gallery, el.nextSibling);
              renderUnsplashCollection(m[1], gallery);
            }
          });
        }

        function scan(root) {
          var container = root || document;
          processStaticPlaceholders(container);
          processTextMarkers(container);
        }

        function init() {
          scan(document);

          // Наблюдаем за динамически подгружаемым контентом (Notion/SPA)
          var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
              m.addedNodes.forEach(function (node) {
                if (node && node.nodeType === 1) scan(node);
              });
            });
          });
          observer.observe(document.body, { childList: true, subtree: true });

          // Подстрахуемся на смену роутов
          window.addEventListener('popstate', function () { setTimeout(function () { scan(document); }, 0); });
          window.addEventListener('hashchange', function () { setTimeout(function () { scan(document); }, 0); });
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init);
        } else {
          init();
        }
      })();
