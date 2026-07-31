/* meta.fikra — Shared header injector */
(function () {
  var s = document.currentScript;
  var project = s.getAttribute('data-project') || '';
  var home = s.getAttribute('data-home') || './';
  var helpTitle = s.getAttribute('data-help') || '';
  var helpId = s.getAttribute('data-help-id') || '';

  var rightHtml = '';
  rightHtml += '<button class="mf-theme" id="mfThemeBtn" onclick="mfToggleTheme()" aria-label="Toggle theme"><i class="fa-solid ' + (mfIsLight() ? 'fa-moon' : 'fa-sun') + '"></i></button>';
  if (helpTitle) {
    rightHtml += '<span class="mf-help" id="' + helpId + '" title="' + helpTitle + '">?</span>';
  }

  //add some random comment.
  var el = document.createElement('div');
  el.className = 'mf-bar';
  el.innerHTML =
    '<a href="' + home + '" class="mf-logo"><span class="mf-dot"></span>meta.fikra</a>' +
    (project ? '<span class="mf-project">' + project + '</span>' : '') +
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
  document.getElementById('mfThemeBtn').innerHTML = '<i class="fa-solid ' + (isL ? 'fa-moon' : 'fa-sun') + '"></i>';
  try { localStorage.setItem('mf-theme', isL ? 'l' : 'd'); } catch (e) { }
}