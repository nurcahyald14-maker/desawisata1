/* ============================================================
   Wisata Gunung - Booking via WhatsApp
   Menyusun pesan otomatis, mencatat klik booking ke Supabase
   (tabel `bookings`), lalu membuka wa.me.
   ============================================================ */
(function () {
  const modal = document.getElementById("bookingModal");
  const form = document.getElementById("bookingForm");
  const select = document.getElementById("bPackage");
  const dateInput = document.getElementById("bDate");

  const waNumber = () => String((App.settings && App.settings.whatsapp_number) || "").replace(/\D/g, "");

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function fillPackages(selectedId) {
    select.innerHTML = App.packages
      .map((p) => `<option value="${esc(p.id)}">${esc(p.title)} — ${rupiah(p.price)}</option>`)
      .join("");
    if (selectedId) select.value = String(selectedId);
  }

  function openModal(packageId) {
    if (!App.packages.length) { toast("Paket belum tersedia."); return; }
    fillPackages(packageId);
    dateInput.min = new Date().toISOString().split("T")[0];
    modal.classList.add("open");
    document.getElementById("bName").focus();
  }
  const closeModal = () => modal.classList.remove("open");

  // Tombol "Booking Sekarang" & "Pesan via WhatsApp" (event delegation)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-book]");
    if (btn) openModal(btn.dataset.package);
  });
  document.getElementById("bookingClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const number = waNumber();
    if (!number) { toast("Nomor WhatsApp admin belum diatur."); return; }

    const pkg = App.packages.find((p) => String(p.id) === select.value);
    const data = {
      name: document.getElementById("bName").value.trim(),
      package_title: pkg ? pkg.title : "-",
      booking_date: dateInput.value,
      people: Number(document.getElementById("bPeople").value) || 1,
    };

    const text =
      `Halo Admin Wisata Gunung, saya ingin pesan:\n` +
      `- Nama: ${data.name}\n` +
      `- Paket: ${data.package_title}\n` +
      `- Tanggal: ${data.booking_date}\n` +
      `- Jumlah Orang: ${data.people}`;

    // Buka tab dulu (sinkron dengan klik) agar tidak diblokir pop-up blocker
    const win = window.open("about:blank", "_blank");

    // Catat ke log booking; kegagalan pencatatan tidak boleh menghalangi pesan
    if (window.sb) {
      try {
        const { error } = await sb.from("bookings").insert(data);
        if (error) console.warn("Log booking gagal:", error.message);
      } catch (err) { console.warn("Log booking gagal:", err); }
    }

    const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
    if (win) win.location.href = url; else window.location.href = url;
    closeModal();
    form.reset();
  });

  // Form kontak ringkas -> WhatsApp
  document.getElementById("contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const number = waNumber();
    if (!number) { toast("Nomor WhatsApp admin belum diatur."); return; }
    const text =
      `Halo Admin Wisata Gunung, saya ${document.getElementById("cName").value.trim()}.\n` +
      document.getElementById("cMsg").value.trim();
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    e.target.reset();
  });
})();
