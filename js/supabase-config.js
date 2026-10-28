/* ============================================================
   Konfigurasi Supabase
   Ganti dua nilai di bawah dengan milik proyek Anda
   (Supabase Dashboard > Project Settings > API).
   Anon key memang bersifat publik; keamanan data diatur lewat RLS
   (lihat schema.sql).
   ============================================================ */
const SUPABASE_URL = "https://ykxmzlxuvtmsedgvcwri.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_b_A8ibwi4LuYQ2IsVwEExQ_HCSSq_4C";

const supabaseReady =
  !SUPABASE_URL.includes("YOUR-PROJECT-ID") &&
  !SUPABASE_ANON_KEY.includes("YOUR-PUBLIC");

// SDK dimuat via CDN: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
window.sb = supabaseReady
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

window.supabaseReady = supabaseReady;

/* Data contoh dipakai saat Supabase belum dikonfigurasi,
   supaya tampilan situs tetap bisa dilihat. */
window.FALLBACK_DATA = {
  settings: {
    whatsapp_number: "6281234567890",
    vision:
      "Menjadi pengelola wisata gunung yang aman, ramah lingkungan, dan memberi pengalaman tak terlupakan bagi setiap pendaki.",
    mission:
      "Mengutamakan keselamatan pendaki\nMenjaga kelestarian alam gunung\nMemberdayakan masyarakat sekitar\nMemberikan layanan yang jujur dan profesional",
    address: "Kaki Gunung, Jawa Barat, Indonesia",
    phone: "+62 812-3456-7890",
    email: "info@wisatagunung.id",
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    maps_embed:
      "https://www.google.com/maps?q=Gunung+Tangkuban+Perahu&output=embed",
  },
  packages: [
    {
      id: 1,
      title: "Paket Camping Ceria",
      price: 250000,
      description:
        "Tenda, matras, area api unggun, dan sarapan pagi. Cocok untuk keluarga dan pemula.",
      image_url:
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
    },
    {
      id: 2,
      title: "Open Trip Summit",
      price: 450000,
      description:
        "Pendakian sampai puncak bersama guide berpengalaman, makan, dan dokumentasi.",
      image_url:
        "https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=800",
    },
    {
      id: 3,
      title: "Rental Alat Pendakian",
      price: 75000,
      description:
        "Carrier, sleeping bag, headlamp, dan trekking pole. Harga per hari.",
      image_url:
        "https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=800",
    },
    {
      id: 4,
      title: "Jasa Tour Guide",
      price: 200000,
      description:
        "Pemandu lokal bersertifikat yang paham jalur, cuaca, dan prosedur darurat.",
      image_url:
        "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800",
    },
  ],
  gallery: [
    {
      id: 1,
      image_url:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
      caption: "Puncak berkabut",
      category: "foto",
    },
    {
      id: 2,
      image_url:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
      caption: "Langit malam di perkemahan",
      category: "foto",
    },
    {
      id: 3,
      image_url:
        "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800",
      caption: "Jalur pendakian",
      category: "foto",
    },
    {
      id: 4,
      image_url:
        "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800",
      caption: "Sunrise di atas awan",
      category: "foto",
    },
  ],
  team: [
    { id: 1, name: "Budi Santoso", role: "Ketua Pengelola", photo_url: "" },
    { id: 2, name: "Siti Rahmawati", role: "Koordinator Booking", photo_url: "" },
    { id: 3, name: "Agus Prasetyo", role: "Kepala Guide", photo_url: "" },
  ],
};
