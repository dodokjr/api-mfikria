function OnclickOpenMenu()
{
  document.getElementById("header-nav").style.display = "block";
  document.getElementById("close-menu").style.display = "block";
  document.getElementById("open-menu").style.display = "none";
}

function OnclickCloseMenu()
{
  document.getElementById("header-nav").style.display = "none";
  document.getElementById("close-menu").style.display = "none";
  document.getElementById("open-menu").style.display = "block";
}

// // window.onscroll = function ()
// // {
// //   scrollFunction();
// // };
// // function scrollFunction()
// // {
// //   window.scrollTo({ bottom: 0, behavior: "smooth" });
// }

(function ()
{
  if (localStorage.getItem("dark-mode") === "On")
  {
    document.documentElement.classList.add("dark");
  }
})();

function darkmode()
{
  localStorage.setItem("dark-mode", "On");
  document.documentElement.classList.add("dark");
}

function lightmode()
{
  localStorage.setItem("dark-mode", "Off");
  document.documentElement.classList.remove("dark");
}

function OnclickOpenMenu() {
  const nav = document.getElementById('header-nav');
  const openBtn = document.getElementById('open-menu');
  const closeBtn = document.getElementById('close-menu');

  nav.classList.remove('hidden');
  nav.classList.add('flex');
  openBtn.classList.add('hidden');
  closeBtn.classList.remove('hidden');
}

function OnclickCloseMenu() {
  const nav = document.getElementById('header-nav');
  const openBtn = document.getElementById('open-menu');
  const closeBtn = document.getElementById('close-menu');

  nav.classList.add('hidden');
  nav.classList.remove('flex');
  openBtn.classList.remove('hidden');
  closeBtn.classList.add('hidden');
}

// Otomatis reset menu mobile jika layar di-resize ke ukuran desktop (sm: 640px ke atas)
window.addEventListener('resize', () => {
  if (window.innerWidth >= 640) {
    const nav = document.getElementById('header-nav');
    const openBtn = document.getElementById('open-menu');
    const closeBtn = document.getElementById('close-menu');

    nav.classList.remove('flex');
    nav.classList.add('hidden');
    openBtn.classList.remove('hidden');
    closeBtn.classList.add('hidden');
  }
});

(function () {
  var tabs = document.querySelectorAll('[data-tab]');
  var panels = document.querySelectorAll('[data-panel]');
  function show(name) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.classList.toggle('border-red-600', on);
      t.classList.toggle('text-red-600', on);
      t.classList.toggle('border-transparent', !on);
      t.classList.toggle('text-slate-500', !on);
    });
    panels.forEach(function (p) {
      p.classList.toggle('hidden', p.getAttribute('data-panel') !== name);
    });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      show(t.getAttribute('data-tab'));
    });
  });
})();

