/* meta.fikra — Shared header injector (Arabic Brand) */
(function () {
  var s = document.currentScript;
  var project = s.getAttribute('data-project') || 'خريطة الأفكار';
  var version = s ? (s.getAttribute('data-version') || '') : '';
  if (!version && s && s.src) {
    var m = s.src.match(/[?&]v=([^&]+)/);
    if (m) version = (m[1].startsWith('v') ? '' : 'v') + m[1];
  }
  var home = s.getAttribute('data-home') || './';
  var helpTitle = s.getAttribute('data-help') || 'اختصارات لوحة المفاتيح';
  var helpId = s.getAttribute('data-help-id') || 'helpBtn';

  var rightHtml = '';
  rightHtml += '<button class="mf-theme" id="mfThemeBtn" onclick="mfToggleTheme()" title="تغيير المظهر" aria-label="Toggle theme"><i class="fa-solid ' + (mfIsLight() ? 'fa-moon' : 'fa-sun') + '"></i></button>';
  if (helpTitle) {
    rightHtml += '<span class="mf-help" id="' + helpId + '" title="' + helpTitle + '">?</span>';
  }

  var projectHtml = '';
  if (project) {
    projectHtml = '<span class="mf-project' + (version ? ' has-version' : '') + '"' +
      (version ? ' title="إصدار التطبيق: ' + version + '" data-version="' + version + '"' : '') + '>' +
      project +
      (version ? '<span class="mf-version-tag">' + version + '</span>' : '') +
      '</span>';
  }

  var el = document.createElement('div');
  el.className = 'mf-bar';
  el.innerHTML =
    '<a href="' + home + '" class="mf-logo">ميتاـفكرة<span class="mf-dot">.</span></a>' +
    projectHtml +
    '<div class="mf-right">' + rightHtml + '</div>';

  document.body.insertBefore(el, document.body.firstChild);
  if (mfIsLight()) document.body.classList.add('light');
})();

function mfIsLight() {
  try {
    return localStorage.getItem('mf-theme') === 'l';
  } catch (e) {
    return false;
  }
}

function mfToggleTheme() {
  document.body.classList.toggle('light');
  var isL = document.body.classList.contains('light');
  var btn = document.getElementById('mfThemeBtn');
  if (btn) btn.innerHTML = '<i class="fa-solid ' + (isL ? 'fa-moon' : 'fa-sun') + '"></i>';
  try { localStorage.setItem('mf-theme', isL ? 'l' : 'd'); } catch (e) { }
}