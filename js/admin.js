/* ============================================================
   Wisata Gunung - Logika dashboard admin (CRUD + auth guard)
   Catatan keamanan: pengecekan login di sisi browser hanya untuk UX.
   Perlindungan data yang sebenarnya dijalankan oleh Row Level Security
   di Supabase (lihat schema.sql): hanya user terautentikasi yang bisa
   menulis data.
   ============================================================ */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (/^(https?:\/\/|\/|assets\/)/i.test(u || "") ? u : "");
const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const isVideo = (u) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(u || "");

/* ---------- Definisi entitas CRUD ---------- */
const ENTITIES = {
  packages: {
    label: "Paket",
    fields: [
      { key: "title", label: "Judul Paket", type: "text", required: true },
      { key: "price", label: "Harga (Rp)", type: "number", required: true, min: 0 },
      { key: "description", label: "Deskripsi / Fasilitas", type: "textarea" },
      { key: "image_url", label: "Link Foto (URL)", type: "url" },
    ],
    row: (r) => `
      <td>${thumb(r.image_url)}</td>
      <td><strong>${esc(r.title)}</strong></td>
      <td>${rupiah(r.price)}</td>
      <td>${esc((r.description || "").slice(0, 70))}${(r.description || "").length > 70 ? "…" : ""}</td>`,
  },
  gallery: {
    label: "Item Galeri",
    fields: [
      { key: "image_url", label: "Link Foto / Video (URL)", type: "url", required: true },
      { key: "caption", label: "Keterangan", type: "text" },
      { key: "category", label: "Kategori", type: "select", options: ["foto", "video"] },
    ],
    row: (r) => `<td>${thumb(r.image_url)}</td><td>${esc(r.caption)}</td><td>${esc(r.category)}</td>`,
  },
  team: {
    label: "Anggota Tim",
    fields: [
      { key: "name", label: "Nama", type: "text", required: true },
      { key: "role", label: "Jabatan", type: "text", required: true },
      { key: "photo_url", label: "Link Foto (URL)", type: "url" },
    ],
    row: (r) => `<td>${thumb(r.photo_url)}</td><td><strong>${esc(r.name)}</strong></td><td>${esc(r.role)}</td>`,
  },
};

function thumb(url) {
  const u = safeUrl(url);
  if (!u) return '<div class="thumb"></div>';
  return isVideo(u) ? `<video class="thumb" src="${esc(u)}" muted></video>` : `<img class="thumb" src="${esc(u)}" alt="" />`;
}

const state = { packages: [], gallery: [], team: [], bookings: [], settings: null };
let editing = null; // { entity, id|null }

/* ---------- Notifikasi ---------- */
function flash(msg, type = "ok", target = "#globalAlert") {
  const el = $(target);
  el.innerHTML = `<div class="alert ${type}" role="alert">${esc(msg)}</div>`;
  if (type === "ok") setTimeout(() => { el.innerHTML = ""; }, 3000);
}

/* ---------- Auth guard ---------- */
async function guard() {
  if (!window.sb) { location.replace("admin-login.html"); return false; }
  const { data } = await sb.auth.getSession();
  if (!data.session) { location.replace("admin-login.html"); return false; }
  $("#userEmail").textContent = data.session.user.email;
  sb.auth.onAuthStateChange((event, session) => {
    if (!session) location.replace("admin-login.html");
  });
  return true;
}

/* ---------- Pemuatan data ---------- */
async function loadEntity(name) {
  const order = name === "gallery" ? { column: "id", ascending: false } : { column: "id", ascending: true };
  const { data, error } = await sb.from(name).select("*").order(order.column, { ascending: order.ascending });
  if (error) { flash("Gagal memuat " + name + ": " + error.message, "error"); return; }
  state[name] = data || [];
  renderTable(name);
  updateStats();
}

function renderTable(name) {
  const ent = ENTITIES[name];
  const body = $("#tbody-" + name);
  const cols = body.closest("table").querySelectorAll("th").length;
  if (!state[name].length) { body.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;color:#5d6b62">Belum ada data.</td></tr>`; return; }
  body.innerHTML = state[name].map((r) => `
    <tr>${ent.row(r)}
      <td><div class="actions">
        <button class="btn btn-sm btn-light" data-edit="${name}" data-id="${esc(r.id)}">Edit</button>
        <button class="btn btn-sm btn-danger" data-del="${name}" data-id="${esc(r.id)}">Hapus</button>
      </div></td>
    </tr>`).join("");
}

async function loadBookings() {
  const { data, error } = await sb.from("bookings").select("*").order("created_at", { ascending: false }).limit(300);
  if (error) { flash("Gagal memuat log booking: " + error.message, "error"); return; }
  state.bookings = data || [];
  const body = $("#tbody-bookings");
  if (!state.bookings.length) { body.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#5d6b62">Belum ada booking.</td></tr>'; }
  else {
    body.innerHTML = state.bookings.map((b) => `
      <tr>
        <td>${esc(new Date(b.created_at).toLocaleString("id-ID"))}</td>
        <td>${esc(b.name)}</td><td>${esc(b.package_title)}</td>
        <td>${esc(b.booking_date)}</td><td>${esc(b.people)}</td>
        <td><button class="btn btn-sm btn-danger" data-del="bookings" data-id="${esc(b.id)}">Hapus</button></td>
      </tr>`).join("");
  }
  updateStats();
}

async function loadSettings() {
  const { data, error } = await sb.from("settings").select("*").order("id").limit(1).maybeSingle();
  if (error) { flash("Gagal memuat pengaturan: " + error.message, "error"); return; }
  state.settings = data;
  const keys = ["whatsapp_number", "vision", "mission", "address", "phone", "email", "instagram", "facebook", "maps_embed"];
  keys.forEach((k) => { $("#s_" + k).value = (data && data[k]) || ""; });
}

function updateStats() {
  $("#statPackages").textContent = state.packages.length;
  $("#statGallery").textContent = state.gallery.length;
  $("#statTeam").textContent = state.team.length;
  $("#statBookings").textContent = state.bookings.length;
}

/* ---------- Modal CRUD ---------- */
function openModal(entity, id = null) {
  const ent = ENTITIES[entity];
  const row = id != null ? state[entity].find((r) => String(r.id) === String(id)) : null;
  editing = { entity, id: row ? row.id : null };
  $("#crudTitle").textContent = (row ? "Edit " : "Tambah ") + ent.label;
  $("#crudAlert").innerHTML = "";
  $("#crudFields").innerHTML = ent.fields.map((f) => {
    const val = row ? row[f.key] ?? "" : f.type === "select" ? f.options[0] : "";
    let input;
    if (f.type === "textarea") input = `<textarea id="f_${f.key}" rows="4">${esc(val)}</textarea>`;
    else if (f.type === "select") input = `<select id="f_${f.key}">${f.options.map((o) => `<option ${o === val ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    else input = `<input id="f_${f.key}" type="${f.type}" value="${esc(val)}" ${f.required ? "required" : ""} ${f.min != null ? `min="${f.min}"` : ""} />`;
    return `<div class="form-group"><label for="f_${f.key}">${esc(f.label)}</label>${input}</div>`;
  }).join("");
  $("#crudModal").classList.add("open");
}
const closeModal = () => { $("#crudModal").classList.remove("open"); editing = null; };

async function saveModal(e) {
  e.preventDefault();
  if (!editing) return;
  const ent = ENTITIES[editing.entity];
  const payload = {};
  ent.fields.forEach((f) => {
    let v = $("#f_" + f.key).value.trim();
    if (f.type === "number") v = Number(v) || 0;
    payload[f.key] = v;
  });
  // Tolak URL berbahaya (mis. javascript:)
  for (const f of ent.fields) {
    if (f.type === "url" && payload[f.key] && !safeUrl(payload[f.key])) {
      flash("URL harus diawali http:// atau https://", "error", "#crudAlert");
      return;
    }
  }
  const btn = $("#crudSave");
  btn.disabled = true;
  const q = editing.id == null
    ? sb.from(editing.entity).insert(payload)
    : sb.from(editing.entity).update(payload).eq("id", editing.id);
  const { error } = await q;
  btn.disabled = false;
  if (error) { flash("Gagal menyimpan: " + error.message, "error", "#crudAlert"); return; }
  const name = editing.entity;
  closeModal();
  flash("Data berhasil disimpan.");
  loadEntity(name);
}

async function deleteRow(table, id) {
  if (!confirm("Hapus data ini? Tindakan tidak dapat dibatalkan.")) return;
  const { error } = await sb.from(table).delete().eq("id", id);
  if (error) { flash("Gagal menghapus: " + error.message, "error"); return; }
  flash("Data dihapus.");
  table === "bookings" ? loadBookings() : loadEntity(table);
}

/* ---------- Pengaturan ---------- */
async function saveSettings(e) {
  e.preventDefault();
  const keys = ["whatsapp_number", "vision", "mission", "address", "phone", "email", "instagram", "facebook", "maps_embed"];
  const payload = {};
  keys.forEach((k) => { payload[k] = $("#s_" + k).value.trim(); });
  payload.whatsapp_number = payload.whatsapp_number.replace(/\D/g, "");
  if (!payload.whatsapp_number) { flash("Nomor WhatsApp wajib diisi.", "error"); return; }
  for (const k of ["instagram", "facebook", "maps_embed"]) {
    if (payload[k] && !safeUrl(payload[k])) { flash("Link " + k + " harus diawali http:// atau https://", "error"); return; }
  }
  const q = state.settings
    ? sb.from("settings").update(payload).eq("id", state.settings.id)
    : sb.from("settings").insert(payload);
  const { error } = await q;
  if (error) { flash("Gagal menyimpan: " + error.message, "error"); return; }
  flash("Pengaturan disimpan. Website langsung terbarui.");
  loadSettings();
}

/* ---------- Tab & event ---------- */
function showTab(tab) {
  $$(".tab-btn[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $$(".panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + tab));
  $("#sidebar").classList.remove("open");
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!(await guard())) return;

  $$(".tab-btn[data-tab]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
  $("#menuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#logoutBtn").addEventListener("click", async () => { await sb.auth.signOut(); location.replace("admin-login.html"); });
  $("#crudForm").addEventListener("submit", saveModal);
  $("#crudCancel").addEventListener("click", closeModal);
  $("#crudModal").addEventListener("click", (e) => { if (e.target.id === "crudModal") closeModal(); });
  $("#settingsForm").addEventListener("submit", saveSettings);
  $("#refreshBookings").addEventListener("click", loadBookings);

  // Delegasi klik: tambah / edit / hapus
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    const edit = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-del]");
    if (add) openModal(add.dataset.add);
    else if (edit) openModal(edit.dataset.edit, edit.dataset.id);
    else if (del) deleteRow(del.dataset.del, del.dataset.id);
  });

  await Promise.all([loadEntity("packages"), loadEntity("gallery"), loadEntity("team"), loadBookings(), loadSettings()]);
});
