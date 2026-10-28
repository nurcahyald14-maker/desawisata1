/* ============================================================
   Wisata Gunung - Logika halaman user
   Memuat data dari Supabase (atau data contoh bila belum diatur),
   merender halaman, dan memperbarui otomatis secara real-time.
   ============================================================ */
const App = { settings: null, packages: [], gallery: [], team: [] };
window.App = App;

/* ---------- Util ---------- */
const $ = (sel) => document.querySelector(sel);
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Hanya izinkan URL http(s) / path relatif agar tidak ada javascript: URL
const safeUrl = (u) => (/^(https?:\/\/|\/|assets\/)/i.test(u || "") ? u : "");
const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const isVideo = (u) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(u || "");

/* ---------- Pemuatan data ---------- */
async function loadAll() {
  if (!window.sb) {
    const f = window.FALLBACK_DATA;
    Object.assign(App, { settings: f.settings, packages: f.packages, gallery: f.gallery, team: f.team });
    console.info("Supabase belum dikonfigurasi — memakai data contoh. Edit js/supabase-config.js.");
    return;
  }
  const [s, p, g, t] = await Promise.all([
    sb.from("settings").select("*").limit(1).maybeSingle(),
    sb.from("packages").select("*").order("id"),
    sb.from("gallery").select("*").order("id", { ascending: false }),
    sb.from("team").select("*").order("id"),
  ]);
  const fb = window.FALLBACK_DATA;
  App.settings = { ...fb.settings, ...(s.data || {}) };
  App.packages = p.data || [];
  App.gallery = g.data || [];
  App.team = t.data || [];
  const err = s.error || p.error || g.error || t.error;
  if (err) console.error("Gagal memuat data Supabase:", err.message);
}

/* ---------- Render ---------- */
function renderSettings() {
  const s = App.settings;
  $("#visionText").textContent = s.vision || "";
  const items = String(s.mission || "").split("\n").map((x) => x.trim()).filter(Boolean);
  $("#missionList").innerHTML = items.map((m) => `<li>${esc(m)}</li>`).join("");
  $("#contactAddress").textContent = s.address || "—";
  $("#contactPhone").textContent = s.phone || "—";
  $("#contactEmail").textContent = s.email || "—";
  if (s.instagram) $("#igLink").href = safeUrl(s.instagram) || "#";
  if (s.facebook) $("#fbLink").href = safeUrl(s.facebook) || "#";
  if (s.maps_embed && safeUrl(s.maps_embed)) $("#mapFrame").src = s.maps_embed;
}

function renderPackages() {
  const el = $("#packageList");
  if (!App.packages.length) { el.innerHTML = '<p class="empty">Belum ada paket.</p>'; return; }
  el.innerHTML = App.packages.map((p) => `
    <article class="pkg-card" data-aos="fade-up">
      <div class="pkg-img" style="background-image:url('${esc(safeUrl(p.image_url))}')"></div>
      <div class="pkg-body">
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <div class="pkg-price">${rupiah(p.price)}</div>
        <button class="btn btn-wa btn-block" data-book data-package="${esc(p.id)}">Pesan via WhatsApp</button>
      </div>
    </article>`).join("");
}

function renderTeam() {
  const el = $("#teamList");
  if (!App.team.length) { el.innerHTML = '<p class="empty">Data tim belum tersedia.</p>'; return; }
  el.innerHTML = App.team.map((m) => {
    const url = safeUrl(m.photo_url);
    const avatar = url
      ? `<div class="avatar" style="background-image:url('${esc(url)}')"></div>`
      : `<div class="avatar">${esc((m.name || "?").charAt(0).toUpperCase())}</div>`;
    return `<article class="team-card" data-aos="zoom-in">${avatar}<h3>${esc(m.name)}</h3><span>${esc(m.role)}</span></article>`;
  }).join("");
}

function renderGallery() {
  const el = $("#galleryList");
  if (!App.gallery.length) { el.innerHTML = '<p class="empty">Galeri masih kosong.</p>'; return; }
  el.innerHTML = App.gallery.map((g, i) => {
    const url = esc(safeUrl(g.image_url));
    const media = isVideo(g.image_url)
      ? `<video src="${url}" muted playsinline preload="metadata"></video>`
      : `<img src="${url}" alt="${esc(g.caption)}" loading="lazy" />`;
    return `<div class="gallery-item" data-idx="${i}">${media}<div class="cap">${esc(g.caption)}</div></div>`;
  }).join("");
}

function renderAll() {
  renderSettings();
  renderPackages();
  renderTeam();
  renderGallery();
  if (window.AOS) AOS.refreshHard();
  document.dispatchEvent(new CustomEvent("app:updated"));
}

/* ---------- Lightbox ---------- */
function setupLightbox() {
  const box = $("#lightbox");
  $("#galleryList").addEventListener("click", (e) => {
    const item = e.target.closest(".gallery-item");
    if (!item) return;
    const g = App.gallery[Number(item.dataset.idx)];
    if (!g) return;
    const url = esc(safeUrl(g.image_url));
    $("#lbContent").innerHTML = isVideo(g.image_url)
      ? `<video src="${url}" controls autoplay playsinline></video>`
      : `<img src="${url}" alt="${esc(g.caption)}" />`;
    $("#lbCap").textContent = g.caption || "";
    box.classList.add("open");
  });
  const close = () => { box.classList.remove("open"); $("#lbContent").innerHTML = ""; };
  $("#lbClose").addEventListener("click", close);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

/* ---------- Header & nav ---------- */
function setupNav() {
  const header = $("#header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 60);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  const links = $("#navLinks");
  $("#navToggle").addEventListener("click", () => links.classList.toggle("open"));
  links.addEventListener("click", (e) => { if (e.target.tagName === "A") links.classList.remove("open"); });
}

/* ---------- Real-time ---------- */
function setupRealtime() {
  if (!window.sb) return;
  let timer;
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => { await loadAll(); renderAll(); }, 300);
  };
  ["packages", "gallery", "team", "settings"].forEach((table) => {
    sb.channel("public:" + table)
      .on("postgres_changes", { event: "*", schema: "public", table }, refresh)
      .subscribe();
  });
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  $("#year").textContent = new Date().getFullYear();
  if (window.AOS) AOS.init({ duration: 700, once: true, offset: 60 });
  setupNav();
  setupLightbox();
  await loadAll();
  renderAll();
  setupRealtime();
});
