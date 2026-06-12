// =========================================================================================
// SCRIPT.JS - KODE UTAMA JAVASCRIPT (VERSI PREMIUM + MEDIA WEBSITE + PENGUMUMAN)
// =========================================================================================
const API_URL = "api.php";

let myChart = null;
let absensiPieChart = null;

let allJemaatData = [];
let filteredJemaat = [];
let currentPage = 1;
const rowsPerPage = 20;
let currentAbsensiMode = 'harian';
let html5QrcodeScanner = null;
let myQrCode = null;
let mediaWebsiteData = [];

const DASHBOARD_TITLES = {
    dashboard: "Dashboard Overview",
    absensi: "Data Absensi",
    keuangan: "Keuangan Gereja",
    media: "Media Website",
    pengumuman: "Kelola Pengumuman",
    komsel: "Data Rayon",
    jemaat: "Data Jemaat",
    jadwal: "Jadwal Ibadah",
    talenta: "Data Talenta",
    pelayanan: "Daftar Pelayanan",
    penyerahan: "Penyerahan Anak",
    baptisan: "Baptisan Air",
    pernikahan: "Pernikahan",
    kedukaan: "Kedukaan",
    tentang: "Profil & Tentang"
};

const DASHBOARD_ICONS = {
    dashboard: "fa-th-large",
    absensi: "fa-calendar-check",
    keuangan: "fa-coins",
    media: "fa-photo-film",
    pengumuman: "fa-bullhorn",
    komsel: "fa-home",
    jemaat: "fa-users",
    jadwal: "fa-clock",
    talenta: "fa-guitar",
    pelayanan: "fa-hands-helping",
    penyerahan: "fa-child",
    baptisan: "fa-water",
    pernikahan: "fa-ring",
    kedukaan: "fa-dove",
    tentang: "fa-user-cog"
};

const DEFAULT_MEDIA_CODES = [
    { kode_media: 'logo_utama', judul_media: 'Logo Utama Website', keterangan: 'Logo utama yang tampil di navbar dan footer website.' },
    { kode_media: 'hero_bg', judul_media: 'Background Hero', keterangan: 'Gambar latar utama pada halaman depan website.' },
    { kode_media: 'pastor_photo', judul_media: 'Foto Gembala Sidang', keterangan: 'Foto utama pada section gembala sidang.' },
    { kode_media: 'highlight_1', judul_media: 'Highlight Galeri 1', keterangan: 'Foto galeri utama ke-1 pada halaman depan.' },
    { kode_media: 'highlight_2', judul_media: 'Highlight Galeri 2', keterangan: 'Foto galeri utama ke-2 pada halaman depan.' },
    { kode_media: 'highlight_3', judul_media: 'Highlight Galeri 3', keterangan: 'Foto galeri utama ke-3 pada halaman depan.' },
    { kode_media: 'highlight_4', judul_media: 'Highlight Galeri 4', keterangan: 'Foto galeri utama ke-4 pada halaman depan.' },
    { kode_media: 'highlight_5', judul_media: 'Highlight Galeri 5', keterangan: 'Foto galeri utama ke-5 pada halaman depan.' }
];

let dataTentangSistem = {};

function safeEl(id) { return document.getElementById(id); }
function setText(id, value) { const el = safeEl(id); if (el) el.innerText = value; }
function setHTML(id, value) { const el = safeEl(id); if (el) el.innerHTML = value; }
function formatRupiah(num) { return 'Rp ' + new Intl.NumberFormat('id-ID').format(parseFloat(num || 0)); }

function animateCSS(element, animationName = "fadeInUp") {
    if (!element) return;
    element.classList.remove("animate__animated", "animate__" + animationName);
    void element.offsetWidth;
    element.classList.add("animate__animated", "animate__" + animationName);
}

function fireToast(icon, title) {
    Swal.fire({ toast: true, position: 'top-end', icon, title, showConfirmButton: false, timer: 2200, timerProgressBar: true });
}

function fireLoading(title = 'Memproses...') {
    Swal.fire({ title: title, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
}

function fireError(text = 'Terjadi kesalahan sistem.') {
    Swal.fire({ icon: 'error', title: 'Error', text: text, confirmButtonColor: '#0d6efd', borderRadius: 18 });
}

function fireSuccess(title = 'Berhasil', text = '') {
    Swal.fire({ icon: 'success', title, text, confirmButtonColor: '#0d6efd', borderRadius: 18 });
}

function fireWarning(text = 'Periksa kembali input Anda.') {
    Swal.fire({ icon: 'warning', title: 'Perhatian', text, confirmButtonColor: '#0d6efd', borderRadius: 18 });
}

function resetStatistik(jenis) {
    let titleMsg = '', htmlMsg = '';
    if (jenis === 'baru') {
        titleMsg = 'Reset Statistik Jemaat Baru?';
        htmlMsg = 'Semua tanggal daftar jemaat akan direset, sehingga grafik <b>Jemaat Baru</b> dimulai dari nol lagi.';
    } else if (jenis === 'meninggal') {
        titleMsg = 'Reset Statistik Meninggal?';
        htmlMsg = 'Tanggal kematian pada data jemaat yang meninggal akan direset, sehingga grafik <b>Meninggal</b> dimulai dari nol lagi.';
    } else if (jenis === 'pindah') {
        titleMsg = 'Reset Statistik Pindah/Keluar?';
        htmlMsg = 'Tanggal keluar pada data jemaat yang pindah/keluar akan direset, sehingga grafik <b>Pindah/Keluar</b> dimulai dari nol lagi.';
    } else return;

    Swal.fire({
        title: titleMsg, html: htmlMsg, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', cancelButtonColor: '#6c757d', confirmButtonText: 'Ya, Reset Sekarang', cancelButtonText: 'Batal', borderRadius: 18
    }).then((result) => {
        if (result.isConfirmed) {
            fireLoading('Mereset statistik...');
            fetch(`${API_URL}?action=reset_statistik&jenis=${jenis}`, { method: 'POST' })
            .then(r => r.json())
            .then(res => {
                if (res.status === 'success') {
                    fireSuccess('Berhasil', 'Statistik grafik berhasil direset.');
                    updateStatistik();
                } else fireError(res.message || 'Gagal mereset statistik.');
            }).catch(() => fireError('Gagal terhubung ke server.'));
        }
    });
}

function closeMobileSidebar() {
    const wrapper = safeEl("wrapper");
    if (!wrapper) return;
    if (window.innerWidth <= 768) wrapper.classList.remove("toggled");
}

function setPageTitle(pid) {
    const titleEl = safeEl("page-title-text");
    if (!titleEl) return;
    const title = DASHBOARD_TITLES[pid] || "Dashboard";
    const icon = DASHBOARD_ICONS[pid] || "fa-circle";
    titleEl.innerHTML = `<i class="fas ${icon} me-2 text-warning"></i>${title}`;
    animateCSS(titleEl, "fadeIn");
}

document.addEventListener("DOMContentLoaded", function() {
    if (!localStorage.getItem("isLoggedIn")) {
        if (window.location.pathname.indexOf('index.php') === -1 && window.location.pathname !== '/') {
             window.location.href = "login";
        }
        return;
    }

    const role = localStorage.getItem("role");
    const myId = localStorage.getItem("id_user");

    fetch(`${API_URL}?action=get_custom_name&role=${role}&id_user=${myId}`)
        .then(r => r.json())
        .then(data => {
            if (data && data.nama_tampilan) {
                localStorage.setItem("customName", data.nama_tampilan);
                setText("display-nama-custom", data.nama_tampilan);
                setText("qr-nama-pelayan", data.nama_tampilan);
                const inputCustom = safeEl("input-custom-nama");
                if (inputCustom) inputCustom.value = data.nama_tampilan;
            } else {
                const fallbackName = role === 'admin' ? 'Admin' : 'Pelayan';
                setText("display-nama-custom", fallbackName);
                setText("qr-nama-pelayan", fallbackName);
            }
        })
        .catch(() => console.log("Gagal memuat profil."));

    initSidebarUI();
    cekAksesUser();
    initDefaultDateTime();
    initViewObserver();
    initPremiumEnhancements();
    setPageTitle('dashboard');
    loadPengumumanDashboard();

    setInterval(() => {
        if ($('#view-absensi').is(':visible')) {
            if (role === 'admin' && currentAbsensiMode === 'harian') loadTableAbsensi(true);
            loadChatAbsensi(true);
            if (role === 'admin') cekKodeAktif();
        }
        if ($('#view-dashboard').is(':visible')) {
            updateStatistik();
            loadRequestAkun();
            loadPengumumanDashboard();
        }
    }, 5000);

    const modalScanEl = safeEl('modalScanQR');
    if (modalScanEl) {
        modalScanEl.addEventListener('hidden.bs.modal', function () { tutupScanner(); });
    }

    if (role === "admin") {
        cekKodeAktif();
        loadRequestAkun();
    }
});

function loadPengumumanDashboard() {
    fetch(`${API_URL}?action=read&table=pengumuman&t=${new Date().getTime()}`)
    .then(r => r.json())
    .then(data => {
        const card = safeEl('dashboard-pengumuman-card');
        const isiContainer = safeEl('isi-pengumuman-dashboard');
        if (!card || !isiContainer) return;
        
        if (data && data.length > 0) {
            const aktif = data.find(d => d.status === 'Aktif');
            if (aktif) {
                isiContainer.innerHTML = aktif.isi.replace(/\n/g, '<br>');
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        } else {
            card.style.display = 'none';
        }
    })
    .catch(() => console.log('Gagal memuat pengumuman'));
}

function initSidebarUI() {
    const wrapper = safeEl("wrapper");
    const menuToggle = safeEl("menu-toggle");
    const overlay = safeEl("sidebar-overlay");

    if (menuToggle && wrapper) {
        menuToggle.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            wrapper.classList.toggle("toggled");
        });
    }

    if (overlay && wrapper) {
        overlay.addEventListener("click", function() {
            wrapper.classList.remove("toggled");
        });
    }

    const menuItems = document.querySelectorAll('.list-group-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768 && !item.hasAttribute('data-bs-toggle')) {
                wrapper.classList.remove("toggled");
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && wrapper) wrapper.classList.remove("toggled");
    });
}

function initDefaultDateTime() {
    const tglInput = safeEl("input-tgl-generate");
    const jamInput = safeEl("input-jam-generate");
    if (tglInput && jamInput) {
        const future = new Date();
        future.setHours(future.getHours() + 2);
        const year = future.getFullYear();
        const month = String(future.getMonth() + 1).padStart(2, '0');
        const day = String(future.getDate()).padStart(2, '0');
        tglInput.value = `${year}-${month}-${day}`;
        jamInput.value = future.toTimeString().slice(0, 5);
    }
}

function initViewObserver() {
    const sections = document.querySelectorAll(".view-section");
    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            if (m.attributeName === "style") {
                const target = m.target;
                if (target && target.classList.contains("view-section") && target.style.display !== "none") {
                    animateCSS(target, "fadeInUp");
                }
            }
        });
    });
    sections.forEach(section => observer.observe(section, { attributes: true }));
}

function initPremiumEnhancements() {
    document.querySelectorAll(".stat-card").forEach(card => {
        card.addEventListener("mousemove", function (e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,.72), rgba(255,255,255,.92) 45%)`;
        });
        card.addEventListener("mouseleave", function () {
            card.style.background = "rgba(255,255,255,.9)";
        });
    });
}

function simpanNamaCustom() {
    const inputEl = safeEl("input-custom-nama");
    const inputVal = inputEl ? inputEl.value.trim() : "";
    const role = localStorage.getItem("role");
    const myId = localStorage.getItem("id_user");

    if (!inputVal) { fireWarning('Nama tampilan tidak boleh kosong!'); return; }

    fireLoading('Menyimpan...');
    fetch(`${API_URL}?action=save_custom_name`, {
        method: 'POST',
        body: JSON.stringify({ role: role, id_user: myId, nama: inputVal })
    })
    .then(r => r.json())
    .then(res => {
        if (res.status === 'success') {
            localStorage.setItem("customName", inputVal);
            setText("display-nama-custom", inputVal);
            setText("qr-nama-pelayan", inputVal);
            fireSuccess('Berhasil', 'Nama tampilan Anda telah diperbarui.');
        } else fireError(res.message || 'Gagal menyimpan nama tampilan.');
    })
    .catch(() => fireError('Gagal terhubung ke server.'));
}

function cekAksesUser() {
    const role = localStorage.getItem("role");
    if (role !== 'admin') {
        $('#menu-keuangan').hide(); $('#view-keuangan').remove();
        $('#menu-media').hide(); $('#view-media').remove();
        $('#menu-pengumuman').hide(); $('#view-pengumuman').remove();
    }
    if (role === 'jemaat') {
        $('#menu-absensi').hide(); $('#view-absensi').remove();
        showPage('dashboard');
    } else if (role === 'pelayan' || role === 'user_peltar') {
        $('#btn-rekap').hide();
        showPage('dashboard');
    } else showPage('dashboard');
}

function showPage(pid, el) {
    const role = localStorage.getItem("role");
    if (role !== 'admin' && (pid === 'keuangan' || pid === 'media' || pid === 'pengumuman')) return;

    $('.view-section').hide();
    $('#view-' + pid).fadeIn(180);
    setPageTitle(pid);

    if (el) {
        $('.list-group-item').removeClass('active');
        if (!el.getAttribute('id') || el.getAttribute('id') !== 'menu-absensi') $(el).addClass('active');
        if (el.closest('.sidebar-submenu')) {
            const parentCollapse = el.closest('.collapse');
            if (parentCollapse) {
                const trigger = document.querySelector(`[href="#${parentCollapse.id}"]`);
                if (trigger) {
                    document.querySelectorAll('#sidebar-menu-items > a.list-group-item').forEach(item => item.classList.remove('active'));
                    trigger.classList.add('active');
                }
            }
        }
    }

    closeMobileSidebar();

    if (pid === 'komsel') loadTableRayon();
    else if (pid === 'keuangan') loadTableKeuangan();
    else if (pid === 'pengumuman') loadTable('pengumuman');
    else if (pid === 'media') loadMediaWebsite();
    else if (pid === 'jemaat') initJemaatPage();
    else if (pid === 'dashboard') { updateStatistik(); loadRequestAkun(); loadPengumumanDashboard(); }
    else if (pid === 'absensi') {
        if (role === 'admin') { loadTableAbsensi(false); cekKodeAktif(); } 
        else loadRiwayatSaya();
        loadChatAbsensi(false);
    }
    else if (pid === 'tentang') loadTentangSistem();
    else loadTable(pid);
}

// =========================================================================================
// MEDIA WEBSITE
// =========================================================================================
function loadMediaWebsite() {
    const container = safeEl('media-website-container');
    if (!container) return;

    container.innerHTML = `<div class="col-12"><div class="text-center py-5"><div class="spinner-border text-primary"></div><div class="mt-3 text-muted fw-semibold">Memuat data media website...</div></div></div>`;

    fetch(`${API_URL}?action=get_media_website&t=${new Date().getTime()}`)
        .then(r => r.json())
        .then(data => {
            mediaWebsiteData = (data && Array.isArray(data)) ? data : [];
            renderMediaWebsite();
        })
        .catch(() => {
            mediaWebsiteData = [];
            renderMediaWebsite(true);
        });
}

function renderMediaWebsite(isFallback = false) {
    const container = safeEl('media-website-container');
    if (!container) return;

    let mergedData = DEFAULT_MEDIA_CODES.map(def => {
        const existing = mediaWebsiteData.find(item => item.kode_media === def.kode_media);
        return existing ? { ...def, ...existing } : def;
    });

    if (mergedData.length === 0) {
        container.innerHTML = `<div class="col-12"><div class="media-empty-box"><i class="fas fa-image"></i><strong>Belum ada media website</strong><span class="text-muted">Tambahkan media baru untuk mengelola foto halaman depan website.</span></div></div>`;
        return;
    }

    container.innerHTML = '';
    mergedData.forEach(item => {
        const fotoPath = item.file_path ? `uploads/${item.file_path}` : 'uploads/default.jpg';
        const idMedia = item.id ? item.id : '';
        const dataEncoded = encodeURIComponent(JSON.stringify(item));

        container.innerHTML += `
            <div class="col-xl-3 col-lg-4 col-md-6">
                <div class="media-card">
                    <img src="${fotoPath}" class="media-preview mb-3" onerror="this.src='uploads/default.jpg'">
                    <div class="media-code">${item.kode_media || '-'}</div>
                    <div class="media-title mt-2">${item.judul_media || '-'}</div>
                    <div class="media-desc">${item.keterangan || 'Belum ada deskripsi media.'}</div>
                    <div class="d-grid gap-2 mt-3">
                        <button class="btn btn-primary btn-sm" onclick="editMediaWebsite('${dataEncoded}')"><i class="fas fa-pen me-1"></i> Edit Media</button>
                        ${idMedia ? `<button class="btn btn-outline-danger btn-sm" onclick="hapusMediaWebsite('${idMedia}', '${item.judul_media || item.kode_media}')"><i class="fas fa-trash me-1"></i> Hapus</button>` : `<button class="btn btn-outline-primary btn-sm" onclick="editMediaWebsite('${dataEncoded}')"><i class="fas fa-plus me-1"></i> Lengkapi Media</button>`}
                    </div>
                </div>
            </div>`;
    });

    if (isFallback) {
        container.insertAdjacentHTML('beforeend', `<div class="col-12"><div class="alert alert-warning rounded-4 border-0 shadow-sm mt-2"><i class="fas fa-triangle-exclamation me-2"></i>API media website belum aktif. Tampilan ini masih preview UI.</div></div>`);
    }
}

function tambahMediaWebsite() {
    const opsi = DEFAULT_MEDIA_CODES.map(item => `<option value="${item.kode_media}">${item.judul_media}</option>`).join('');
    Swal.fire({
        title: 'Tambah Media Website',
        html: `<div class="text-start"><div class="form-floating mb-3"><select id="mw-kode" class="form-select">${opsi}</select><label>Pilih Slot Media</label></div><div class="form-floating mb-3"><input type="text" id="mw-judul" class="form-control" placeholder="Judul Media"><label>Judul Media</label></div><div class="mb-3"><label class="small text-muted d-block mb-2">Upload Foto</label><input type="file" id="mw-foto" class="form-control" accept="image/*"></div><div class="form-floating"><textarea id="mw-keterangan" class="form-control" placeholder="Keterangan" style="height:100px;"></textarea><label>Keterangan</label></div></div>`,
        width: 620, showCancelButton: true, confirmButtonText: 'Simpan', confirmButtonColor: '#0d6efd', cancelButtonText: 'Batal', borderRadius: 20,
        preConfirm: () => {
            const kode = safeEl('mw-kode') ? safeEl('mw-kode').value : '';
            const judul = safeEl('mw-judul') ? safeEl('mw-judul').value.trim() : '';
            const ket = safeEl('mw-keterangan') ? safeEl('mw-keterangan').value.trim() : '';
            const fotoInput = safeEl('mw-foto');
            if (!kode) { Swal.showValidationMessage('Pilih slot media.'); return false; }
            if (!judul) { Swal.showValidationMessage('Judul media wajib diisi.'); return false; }
            if (!fotoInput || !fotoInput.files || fotoInput.files.length === 0) { Swal.showValidationMessage('Foto wajib dipilih.'); return false; }
            const formData = new FormData();
            formData.append('kode_media', kode); formData.append('judul_media', judul); formData.append('keterangan', ket); formData.append('foto', fotoInput.files[0]);
            return formData;
        }
    }).then(result => {
        if (result.isConfirmed) {
            fireLoading('Menyimpan media...');
            fetch(`${API_URL}?action=save_media_website`, { method: 'POST', body: result.value })
            .then(r => r.json())
            .then(res => {
                if (res.status === 'success') { fireSuccess('Berhasil', 'Media website berhasil disimpan.'); loadMediaWebsite(); } 
                else fireError(res.message || 'Gagal menyimpan media website.');
            }).catch(() => fireError('API media website belum tersedia.'));
        }
    });
}

function editMediaWebsite(encodedData) {
    const data = JSON.parse(decodeURIComponent(encodedData));
    const fotoPath = data.file_path ? `uploads/${data.file_path}` : 'uploads/default.jpg';
    Swal.fire({
        title: 'Edit Media Website',
        html: `<div class="text-start"><div class="text-center mb-3"><img src="${fotoPath}" id="mw-preview-edit" class="img-fluid rounded-4 border shadow-sm" style="width:100%;max-height:220px;object-fit:cover;" onerror="this.src='uploads/default.jpg'"></div><div class="form-floating mb-3"><input type="text" id="mw-edit-kode" class="form-control" placeholder="Kode Media" value="${data.kode_media || ''}" ${data.id ? 'readonly' : ''}><label>Kode Media</label></div><div class="form-floating mb-3"><input type="text" id="mw-edit-judul" class="form-control" placeholder="Judul Media" value="${data.judul_media || ''}"><label>Judul Media</label></div><div class="mb-3"><label class="small text-muted d-block mb-2">Ganti Foto (Opsional)</label><input type="file" id="mw-edit-foto" class="form-control" accept="image/*" onchange="document.getElementById('mw-preview-edit').src = window.URL.createObjectURL(this.files[0])"></div><div class="form-floating"><textarea id="mw-edit-keterangan" class="form-control" placeholder="Keterangan" style="height:100px;">${data.keterangan || ''}</textarea><label>Keterangan</label></div></div>`,
        width: 620, showCancelButton: true, confirmButtonText: 'Update', confirmButtonColor: '#0d6efd', cancelButtonText: 'Batal', borderRadius: 20,
        preConfirm: () => {
            const kode = safeEl('mw-edit-kode') ? safeEl('mw-edit-kode').value.trim() : '';
            const judul = safeEl('mw-edit-judul') ? safeEl('mw-edit-judul').value.trim() : '';
            const ket = safeEl('mw-edit-keterangan') ? safeEl('mw-edit-keterangan').value.trim() : '';
            const fotoInput = safeEl('mw-edit-foto');
            if (!kode) { Swal.showValidationMessage('Kode media wajib diisi.'); return false; }
            if (!judul) { Swal.showValidationMessage('Judul media wajib diisi.'); return false; }
            const formData = new FormData();
            formData.append('id', data.id || ''); formData.append('kode_media', kode); formData.append('judul_media', judul); formData.append('keterangan', ket);
            if (fotoInput && fotoInput.files && fotoInput.files.length > 0) formData.append('foto', fotoInput.files[0]);
            return formData;
        }
    }).then(result => {
        if (result.isConfirmed) {
            fireLoading('Memperbarui media...');
            fetch(`${API_URL}?action=update_media_website`, { method: 'POST', body: result.value })
            .then(r => r.json())
            .then(res => {
                if (res.status === 'success') { fireSuccess('Berhasil', 'Media website berhasil diperbarui.'); loadMediaWebsite(); } 
                else fireError(res.message || 'Gagal memperbarui media website.');
            }).catch(() => fireError('API media website belum tersedia.'));
        }
    });
}

function hapusMediaWebsite(id, nama) {
    Swal.fire({
        title: 'Hapus Media?', text: `Media "${nama}" akan dihapus.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal', borderRadius: 18
    }).then(result => {
        if (result.isConfirmed) {
            fireLoading('Menghapus media...');
            fetch(`${API_URL}?action=delete_media_website&id=${id}`)
                .then(r => r.json())
                .then(res => {
                    if (res.status === 'success') { fireSuccess('Berhasil', 'Media berhasil dihapus.'); loadMediaWebsite(); } 
                    else fireError(res.message || 'Gagal menghapus media.');
                }).catch(() => fireError('API media website belum tersedia.'));
        }
    });
}

function updateStatistik() {
    fetch(`${API_URL}?action=statistik`)
        .then(r => r.json())
        .then(d => {
            setText('val-jemaat', d.jemaat || 0); setText('val-hut', d.hut || 0);
            setText('total-masuk', formatRupiah(d.masuk || 0)); setText('total-keluar', formatRupiah(d.keluar || 0)); setText('total-saldo', formatRupiah(d.saldo || 0));
            renderGrowthChart(d.chart_labels || [], d.chart_baru || [], d.chart_meninggal || [], d.chart_pindah || []);
            if (d.pie_hadir !== undefined) renderAbsensiChart(d.pie_hadir || 0, d.pie_sakit || 0, d.pie_izin || 0, d.pie_alpa || 0);
        }).catch(() => console.log('Gagal memuat statistik.'));
}

function renderGrowthChart(labels, dataBaru, dataMeninggal, dataPindah) {
    const chartContainer = document.querySelector('.chart-area');
    if (!chartContainer) return;
    chartContainer.innerHTML = '<canvas id="growthChart"></canvas>';
    const canvas = safeEl('growthChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Jemaat Baru', data: dataBaru, borderColor: '#1cc88a', backgroundColor: 'rgba(28, 200, 138, 0.10)', borderWidth: 3, tension: 0.4, fill: true },
                { label: 'Meninggal', data: dataMeninggal, borderColor: '#e74a3b', backgroundColor: 'rgba(231, 74, 59, 0.10)', borderWidth: 3, tension: 0.4, fill: true },
                { label: 'Pindah/Keluar', data: dataPindah, borderColor: '#f6c23e', backgroundColor: 'rgba(246, 194, 62, 0.10)', borderWidth: 3, tension: 0.4, fill: true }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false, interaction: { mode: 'nearest', axis: 'x', intersect: false },
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, color: '#475569', padding: 18, font: { family: 'Poppins', size: 12, weight: '600' } } },
                tooltip: { backgroundColor: 'rgba(8,16,31,.92)', titleFont: { family: 'Poppins', weight: '700' }, bodyFont: { family: 'Poppins' }, padding: 12, cornerRadius: 12 }
            },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
        }
    });
}

function renderAbsensiChart(hadir, sakit, izin, alpa) {
    const ctx = safeEl('absensiChart');
    if (!ctx) return;
    if (absensiPieChart) absensiPieChart.destroy();
    absensiPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hadir', 'Sakit', 'Izin', 'Tidak Hadir'],
            datasets: [{ data: [hadir, sakit, izin, alpa], backgroundColor: ['#198754', '#0dcaf0', '#ffc107', '#dc3545'], borderWidth: 0, hoverOffset: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '68%',
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, color: '#475569', padding: 18, font: { family: 'Poppins', size: 12, weight: '600' } } } }
        }
    });
}

function initJemaatPage() {
    const tbody = safeEl('tbody-jemaat');
    if (!tbody) return;
    if (!safeEl('jemaat-toolbar')) {
        const toolbarHTML = `<div id="jemaat-toolbar" class="card shadow-sm mb-3 border-0"><div class="card-body d-flex justify-content-between align-items-center py-2 flex-wrap gap-2"><div class="d-flex align-items-center gap-3 flex-wrap"><input type="text" id="search-input" class="form-control" placeholder="Cari Nama / KK..." style="width: 250px;" onkeyup="handleSearch()"><span class="fw-bold text-dark" id="total-info">Total: 0 Data</span></div><div class="d-flex align-items-center gap-2"><button class="btn btn-outline-primary btn-sm px-3" onclick="changePage(-1)"><i class="fas fa-chevron-left"></i> Prev</button><span id="page-info" class="fw-bold mx-2">1 / 1</span><button class="btn btn-outline-primary btn-sm px-3" onclick="changePage(1)">Next <i class="fas fa-chevron-right"></i></button></div></div></div>`;
        $(tbody).closest('.table-responsive').before(toolbarHTML);
    }
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5"><div class="spinner-border text-primary"></div><br>Mengambil Data...</td></tr>';
    fetch(`${API_URL}?action=read&table=jemaat&t=${new Date().getTime()}`)
        .then(r => r.json())
        .then(data => { allJemaatData = data || []; filteredJemaat = data || []; currentPage = 1; renderJemaatTable(); });
}

function renderJemaatTable() {
    const tbody = safeEl('tbody-jemaat');
    if (!tbody) return;
    const isAdmin = localStorage.getItem("role") === 'admin';
    const totalPages = Math.ceil(filteredJemaat.length / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    if (totalPages === 0) currentPage = 1;

    setText('total-info', `Total: ${filteredJemaat.length} Data`);
    setText('page-info', `${currentPage} / ${totalPages > 0 ? totalPages : 1}`);

    const dataToShow = filteredJemaat.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    let html = '';

    if (dataToShow.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted"><em>Data tidak ditemukan.</em></td></tr>`;
        return;
    }

    dataToShow.forEach(i => {
        let dataJson = encodeURIComponent(JSON.stringify(i));
        let fotoUrl = (i.foto && i.foto !== "" && i.foto !== "null") ? `uploads/${i.foto}` : 'uploads/default.jpg';
        let btnEdit = isAdmin ? `<button class="btn btn-warning btn-sm text-white me-1 shadow-sm" onclick="aksiEditJemaat('${dataJson}')" title="Edit"><i class="fas fa-pen"></i></button>` : '';
        let btnDel = isAdmin ? `<button class="btn btn-danger btn-sm shadow-sm" onclick="hapus('jemaat',${i.id})" title="Hapus"><i class="fas fa-trash"></i></button>` : '';
        let colAksi = isAdmin ? `<div class="d-flex justify-content-center">${btnEdit}${btnDel}</div>` : `<div class="text-center text-muted">-</div>`;
        let namaTampil = i.nama;
        let classNama = "text-primary fw-bold text-decoration-none";
        if (i.status_anggota === 'Meninggal') { namaTampil = `✞ ${i.nama} (Alm)`; classNama = "text-danger fw-bold text-decoration-none"; }

        let col1 = `<div class="d-flex align-items-center"><img src="${fotoUrl}" class="rounded-circle border shadow-sm me-3" style="width: 45px; height: 45px; object-fit: cover;" onerror="this.src='uploads/default.jpg'"><div><a href="javascript:void(0)" onclick="bukaDetailJemaat('${dataJson}')" class="${classNama}" style="font-size: 1.05em;">${namaTampil}</a><div class="d-flex mt-1 text-muted small flex-wrap"><span class="me-2"><i class="fas fa-phone-alt text-success"></i> ${i.hp || '-'}</span><span><i class="fas fa-map-marker-alt text-danger"></i> ${i.alamat || '-'}</span></div></div></div>`;
        let statusBadge = (i.status_pelayan === 'Ya') ? `<div class="mt-1"><span class="badge bg-primary rounded-pill" style="font-size:0.7em">${i.bidang_pelayanan}</span></div>` : '';
        let col2 = `<div class="fw-bold text-dark">${i.tempat_lahir || '-'}</div><div class="text-muted small"><i class="fas fa-calendar-alt text-warning me-1"></i>${i.tgl_lahir || '-'}</div>`;
        let col3 = `<div class="mb-1"><span class="badge bg-light text-dark border">KK: ${i.no_kk || '-'}</span></div><div class="mb-1"><span class="badge bg-info text-dark rounded-pill">Rayon: ${i.nama_rayon || i.komsel_id || '-'}</span></div><div class="small fst-italic text-muted">${i.status_keluarga || '-'}</div>`;
        let baptisClass = i.status_baptis === 'Sudah' ? 'bg-success' : 'bg-secondary text-white';
        let col4 = `<span class="badge ${baptisClass}">${i.status_baptis === 'Sudah' ? 'Sudah Baptis' : 'Belum Baptis'}</span>${statusBadge}`;
        html += `<tr><td>${col1}</td><td>${col2}</td><td>${col3}</td><td>${col4}</td><td>${colAksi}</td></tr>`;
    });
    tbody.innerHTML = html;
}

function handleSearch() {
    const input = safeEl('search-input');
    const keyword = input ? input.value.toLowerCase() : "";
    filteredJemaat = allJemaatData.filter(item => (item.nama || "").toLowerCase().includes(keyword) || (item.no_kk || "").includes(keyword));
    currentPage = 1;
    renderJemaatTable();
}

function changePage(step) {
    const totalPages = Math.ceil(filteredJemaat.length / rowsPerPage);
    let nextPage = currentPage + step;
    if (nextPage >= 1 && nextPage <= totalPages) { currentPage = nextPage; renderJemaatTable(); }
}

function loadTable(tbl) {
    const role = localStorage.getItem("role");
    const isAdmin = role === 'admin';
    const tbody = safeEl(`tbody-${tbl}`);
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary"></div><br>Sedang memuat data...</td></tr>';

    fetch(`${API_URL}?action=read&table=${tbl}&t=${new Date().getTime()}`)
        .then(r => r.json())
        .then(data => {
            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center p-3 text-muted">Belum ada data.</td></tr>`;
                return;
            }
            tbody.innerHTML = '';
            let index = 0;
            const batchSize = 30;

            function renderBatch() {
                const chunk = data.slice(index, index + batchSize);
                let htmlChunk = '';
                chunk.forEach(i => {
                    let rowHtml = '';
                    if (tbl === 'absensi') {
                        // FIX: Memanggil hapusRiwayat berdasarkan i.id (ini adalah id_absen)
                        let btnDel = isAdmin ? `<button class="btn btn-danger btn-sm" onclick="hapusRiwayat('${i.id}')"><i class="fas fa-trash"></i></button>` : '';
                        let tgl = new Date(i.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
                        let badge = i.status === 'Hadir' ? 'success' : (i.status === 'Sakit' ? 'info' : 'danger');
                        let namaJemaat = i.nama ? i.nama : `<span class="text-muted fst-italic">ID: ${i.jemaat_id}</span>`;
                        let displayBtnDel = isAdmin ? `<td class="text-center">${btnDel}</td>` : '';
                        rowHtml = `<td>${tgl}</td><td class="fw-bold">${i.waktu.substring(0, 5)}</td><td><span class="fw-bold text-dark">${namaJemaat}</span></td><td><span class="badge bg-${badge}">${i.status}</span></td>${displayBtnDel}`;
                    } else if (tbl === 'pengumuman') {
                        let dataJson = encodeURIComponent(JSON.stringify(i));
                        let btnEdit = isAdmin ? `<button class="btn btn-warning btn-sm text-white me-1 shadow-sm" onclick="aksiEdit('${tbl}', '${dataJson}')"><i class="fas fa-pen"></i></button>` : '';
                        let btnDel = isAdmin ? `<button class="btn btn-danger btn-sm shadow-sm" onclick="hapus('${tbl}',${i.id})"><i class="fas fa-trash"></i></button>` : '';
                        let colAksi = isAdmin ? `<div class="d-flex justify-content-center">${btnEdit}${btnDel}</div>` : `<div class="text-center text-muted">-</div>`;
                        let badge = i.status === 'Aktif' ? 'success' : 'secondary';
                        let tanggalPembuatan = i.tanggal ? i.tanggal : '-';
                        rowHtml = `
                            <td class="text-wrap" style="max-width: 400px; white-space: pre-line;">${i.isi}</td>
                            <td>${tanggalPembuatan}</td>
                            <td><span class="badge bg-${badge}">${i.status}</span></td>
                            <td class="text-center">${colAksi}</td>
                        `;
                    } else {
                        let dataJson = encodeURIComponent(JSON.stringify(i));
                        let btnEdit = isAdmin ? `<button class="btn btn-warning btn-sm text-white me-1 shadow-sm" onclick="aksiEdit('${tbl}', '${dataJson}')"><i class="fas fa-pen"></i></button>` : '';
                        let btnDel = isAdmin ? `<button class="btn btn-danger btn-sm shadow-sm" onclick="hapus('${tbl}',${i.id})"><i class="fas fa-trash"></i></button>` : '';
                        let colAksi = isAdmin ? `<div class="d-flex justify-content-center">${btnEdit}${btnDel}</div>` : `<div class="text-center text-muted">-</div>`;

                        if (tbl === 'jadwal') rowHtml = `<td>${i.hari}</td><td>${i.jam}</td><td>${i.ibadah}</td><td>${i.lokasi}</td><td class="text-center">${colAksi}</td>`;
                        else if (tbl === 'komsel') rowHtml = `<td>${i.nama || '-'}</td><td>${i.ketua || '-'}</td><td>${i.wilayah || '-'}</td><td class="text-center">${colAksi}</td>`;
                        else {
                            let vals = Object.values(i); let tds = '';
                            for (let x = 1; x < Math.min(vals.length, 4); x++) { tds += `<td>${vals[x]}</td>`; }
                            rowHtml = `${tds}<td class="text-center">${colAksi}</td>`;
                        }
                    }
                    htmlChunk += `<tr>${rowHtml}</tr>`;
                });
                tbody.insertAdjacentHTML('beforeend', htmlChunk);
                index += batchSize;
                if (index < data.length) requestAnimationFrame(renderBatch);
            }
            renderBatch();
        }).catch(() => { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Gagal memuat data.</td></tr>'; });
}

function loadTableKeuangan() {
    const el = safeEl('tbody-keuangan');
    if (!el) return;
    const isAdmin = localStorage.getItem("role") === 'admin';
    el.innerHTML = '<tr><td colspan="5" class="text-center py-4">Memuat data keuangan...</td></tr>';
    fetch(`${API_URL}?action=read&table=keuangan&t=${new Date().getTime()}`)
        .then(r => r.json())
        .then(data => {
            el.innerHTML = '';
            if (!data || data.length === 0) { el.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada data transaksi.</td></tr>'; return; }
            data.forEach(d => {
                let isMasuk = d.kategori === 'Pemasukan';
                let jumlahFormatted = new Intl.NumberFormat('id-ID').format(d.jumlah);
                let dataJson = encodeURIComponent(JSON.stringify(d));
                let btnEdit = isAdmin ? `<button class="btn btn-warning btn-sm text-white border shadow-sm me-1" onclick="aksiEdit('keuangan','${dataJson}')"><i class="fas fa-pen"></i></button>` : '';
                let btnDel = isAdmin ? `<button class="btn btn-danger btn-sm border shadow-sm" onclick="hapus('keuangan',${d.id})"><i class="fas fa-trash"></i></button>` : '';
                let colAksi = isAdmin ? `<div class="d-flex justify-content-center">${btnEdit}${btnDel}</div>` : `<div class="text-center text-muted">-</div>`;
                el.innerHTML += `<tr><td>${d.tanggal}</td><td class="fw-bold text-dark">${d.keterangan}</td><td><span class="badge ${isMasuk ? 'bg-success' : 'bg-danger'} shadow-sm">${d.kategori}</span></td><td class="text-end fw-bold ${isMasuk ? 'text-success' : 'text-danger'}">${isMasuk ? '+' : '-'} Rp ${jumlahFormatted}</td><td>${colAksi}</td></tr>`;
            });
        });
}

function loadTableRayon() {
    const el = safeEl('tbody-komsel');
    if (!el) return;
    const isAdmin = localStorage.getItem("role") === 'admin';
    el.innerHTML = '<tr><td colspan="4" class="text-center">Memuat...</td></tr>';
    fetch(`${API_URL}?action=read&table=komsel&t=${new Date().getTime()}`)
        .then(r => r.json())
        .then(data => {
            el.innerHTML = '';
            if (!data || data.length === 0) { el.innerHTML = '<tr><td colspan="4" class="text-center">Kosong</td></tr>'; return; }
            data.forEach(item => {
                let dataJson = encodeURIComponent(JSON.stringify(item));
                let btnEdit = isAdmin ? `<button class="btn btn-warning btn-sm text-white me-1" onclick="aksiEdit('komsel', '${dataJson}')"><i class="fas fa-pen"></i></button>` : '';
                let btnDel = isAdmin ? `<button class="btn btn-danger btn-sm" onclick="hapus('komsel',${item.id})"><i class="fas fa-trash"></i></button>` : '';
                let colAksi = isAdmin ? `<div class="d-flex justify-content-center">${btnEdit}${btnDel}</div>` : `<div class="text-center text-muted">-</div>`;
                let badgeJemaat = `<span class="badge bg-primary rounded-pill ms-2" style="font-size: 0.75em;">${item.total_jemaat || 0} Jiwa</span>`;
                let safeNama = item.nama ? item.nama.replace(/'/g, "\\'") : '';
                el.innerHTML += `<tr><td><a href="javascript:void(0)" class="drill-link fw-bold text-decoration-none" onclick="bukaJemaatRayon('${item.id}', decodeURIComponent('${safeNama}'))"><i class="fas fa-folder me-2 text-warning"></i> ${item.nama}</a>${badgeJemaat}</td><td>${item.ketua || '-'}</td><td>${item.wilayah || '-'}</td><td class="text-center">${colAksi}</td></tr>`;
            });
        });
}

function aksiTambah(tbl) {
    if (localStorage.getItem("role") !== 'admin') { fireWarning('Hanya Admin yang dapat menambahkan data.'); return; }
    let html = '', title = 'Tambah Data', labelWajib = "Data";
    const inp = (id, ph) => `<div class="form-floating mb-2"><input id="${id}" class="form-control" placeholder="${ph}"><label>${ph}</label></div>`;
    const dateInp = (id, lbl) => `<div class="form-floating mb-2"><input type="date" id="${id}" class="form-control"><label>${lbl}</label></div>`;
    const sel = (id, opts, lbl) => `<div class="form-floating mb-2"><select id="${id}" class="form-select">${opts}</select><label>${lbl}</label></div>`;

    if (tbl === 'jemaat') {
        title='Tambah Jemaat'; labelWajib="Nama Lengkap";
        html=`<div class="text-center mb-3"><img src="uploads/default.jpg" id="preview_foto" class="rounded-circle border" style="width:100px;height:100px;object-fit:cover;"><div class="mt-2"><input type="file" id="foto_jemaat" class="form-control form-control-sm" accept="image/*" onchange="previewImage(this)"></div></div>${inp('i1','Nama Lengkap')}${inp('i2','Alamat')}<div class="row g-2"><div class="col-6">${inp('i3','No HP')}</div><div class="col-6">${sel('i_jk','<option value="L">Laki-Laki (L)</option><option value="P">Perempuan (P)</option>','Jenis Kelamin')}</div></div><div class="row g-2"><div class="col-6">${inp('tmp_lhr','Tempat Lahir')}</div><div class="col-6">${dateInp('i4','Tanggal Lahir')}</div></div><h6 class="text-primary mt-3 border-bottom pb-2">Data Keluarga</h6><div class="row g-2"><div class="col-6">${inp('kk','No KK')}</div><div class="col-6">${inp('rayon','ID Rayon')}</div></div><div class="row g-2"><div class="col-6">${sel('stat_kel','<option value="Kepala Keluarga">Kepala Keluarga</option><option value="Istri">Istri</option><option value="Anak">Anak</option><option value="Lainnya">Lainnya</option>','Status Keluarga')}</div><div class="col-6">${sel('baptis','<option value="Belum">Belum Baptis</option><option value="Sudah">Sudah Baptis</option>','Status Baptis')}</div></div><h6 class="text-primary mt-3 border-bottom pb-2">Pelayanan</h6><select id="i5" class="form-select mb-2" onchange="toggleRole(this.value)"><option value="Tidak">Jemaat Biasa</option><option value="Ya">Pelayan Altar</option></select><div id="div-role" style="display:none;">${sel('i6','<option value="-">- Pilih -</option><option value="Worship Leader">Worship Leader</option><option value="Singers">Singers</option><option value="Musik">Musik</option><option value="Tamborine">Tamborine</option><option value="Usher">Usher</option><option value="Multimedia">Multimedia</option><option value="SoundMan">SoundMan</option><option value="Doa">Doa</option><option value="Kolektan">Kolektan</option><option value="Lainnya">Lainnya</option>','Bidang Pelayanan')}</div><div class="form-check mt-3 p-3 border rounded bg-light"><input class="form-check-input" type="checkbox" id="chk_meninggal"><label class="form-check-label fw-bold text-danger" for="chk_meninggal">Tandai Meninggal Dunia?</label></div>`;
    }
    else if(tbl==='keuangan') { title='Keuangan'; labelWajib='Tanggal'; html=`${dateInp('i1','Tanggal')}${sel('i2','<option value="Pemasukan">Pemasukan</option><option value="Pengeluaran">Pengeluaran</option>','Jenis')}${inp('i3','Keterangan')}${inp('i4','Jumlah (Rp)')}`; }
    else if(tbl==='komsel') { title='Rayon'; labelWajib='Nama Rayon'; html=`${inp('i1','Nama Rayon')}${inp('i2','Ketua')}${inp('i3','Wilayah')}`; }
    else if(tbl==='jadwal') { title='Jadwal'; labelWajib='Hari'; html=`${inp('i1','Hari')}${inp('i2','Jam')}${inp('i3','Ibadah')}${inp('i4','Lokasi')}`; }
    else if(tbl==='talenta') { title='Data Talenta'; labelWajib='Bidang'; html=`${inp('i1','Bidang Talenta')}${inp('i2','Keterangan')}`; }
    else if(tbl==='pelayanan') { title='Jenis Pelayanan'; labelWajib='Nama'; html=`${inp('i1','Nama Pelayanan')}${inp('i2','Deskripsi')}`; }
    else if(tbl==='penyerahan') { title='Penyerahan Anak'; labelWajib='Tanggal'; html=`${dateInp('i1','Tanggal')}${inp('i2','Nama Anak')}${inp('i3','Nama Orang Tua')}`; }
    else if(tbl==='baptisan') { title='Baptisan Air'; labelWajib='Tanggal'; html=`${dateInp('i1','Tanggal')}${inp('i2','Nama Lengkap')}${sel('i3','<option value="Pria">Pria</option><option value="Wanita">Wanita</option>','Jenis Kelamin')}`; }
    else if(tbl==='pernikahan') { title='Pernikahan'; labelWajib='Tanggal'; html=`${dateInp('i1','Tanggal')}${inp('i2','Mempelai Pria')}${inp('i3','Mempelai Wanita')}`; }
    else if(tbl==='kedukaan') { title='Kedukaan'; labelWajib='Tanggal'; html=`${dateInp('i1','Tanggal')}${inp('i2','Nama Almarhum')}${inp('i3','Tempat Makam')}`; }
    else if(tbl==='pengumuman') { 
        title='Tambah Pengumuman'; labelWajib='Isi Pengumuman'; 
        html=`<div class="form-floating mb-2"><textarea id="i1" class="form-control" placeholder="Isi Pengumuman" style="height: 120px;"></textarea><label>Isi Pengumuman</label></div>${sel('i2','<option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option>','Status')}`; 
    }

    Swal.fire({
        title: title, html: html, width: '600px', showCancelButton: true, confirmButtonText: 'Simpan', confirmButtonColor: '#3056d3', cancelButtonText: 'Batal', borderRadius: 20,
        didOpen: () => {
            window.toggleRole = (val) => { const div = safeEl('div-role'); if (div) div.style.display = (val === 'Ya') ? 'block' : 'none'; };
            window.previewImage = (input) => {
                if (input.files && input.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function (e) { const img = safeEl('preview_foto'); if (img) img.src = e.target.result; };
                    reader.readAsDataURL(input.files[0]);
                }
            };
        },
        preConfirm: () => {
            const i1 = safeEl('i1') ? safeEl('i1').value : '';
            if (!i1) { Swal.showValidationMessage(`${labelWajib} wajib diisi!`); return false; }
            if (tbl === 'jemaat') {
                const formData = new FormData();
                const fileInput = safeEl('foto_jemaat');
                if (fileInput && fileInput.files.length > 0) formData.append('foto', fileInput.files[0]);
                formData.append('val1', safeEl('i1').value); formData.append('val2', safeEl('i2').value); formData.append('val3', safeEl('i3').value); formData.append('jenis_kelamin', safeEl('i_jk').value); formData.append('val4', safeEl('i4').value); formData.append('tempat_lahir', safeEl('tmp_lhr').value); formData.append('no_kk', safeEl('kk').value); formData.append('komsel_id', safeEl('rayon').value); formData.append('status_keluarga', safeEl('stat_kel').value); formData.append('status_baptis', safeEl('baptis').value); formData.append('val5', safeEl('i5').value); formData.append('val6', safeEl('i5').value === 'Ya' ? safeEl('i6').value : '-'); formData.append('status_anggota', safeEl('chk_meninggal').checked ? 'Meninggal' : 'Aktif');
                return formData;
            } else {
                return { val1: i1, val2: safeEl('i2') ? safeEl('i2').value : '', val3: safeEl('i3') ? safeEl('i3').value : '', val4: safeEl('i4') ? safeEl('i4').value : '' };
            }
        }
    }).then((r) => {
        if (r.isConfirmed) {
            let options = { method: 'POST', body: r.value };
            if (!(r.value instanceof FormData)) options.body = JSON.stringify(r.value);
            fetch(`${API_URL}?action=create&table=${tbl}`, options)
                .then(res => res.json())
                .then(d => {
                    if (d.status === 'success') {
                        fireSuccess('Berhasil', 'Data tersimpan');
                        if (tbl === 'jemaat') initJemaatPage();
                        else if (tbl === 'komsel') loadTableRayon();
                        else loadTable(tbl);
                    } else fireError(d.message || 'Gagal menyimpan data.');
                });
        }
    });
}

function aksiEdit(tbl, jsonStr) {
    if (localStorage.getItem("role") !== 'admin') return;
    const data = JSON.parse(decodeURIComponent(jsonStr));
    let html='', title='Edit Data', labelWajib="Data";
    const inp = (id, ph, val) => `<div class="form-floating mb-2"><input id="${id}" class="form-control" placeholder="${ph}" value="${val||''}"><label>${ph}</label></div>`;
    const dateInp = (id, lbl, val) => `<div class="form-floating mb-2"><input type="date" id="${id}" class="form-control" value="${val||''}"><label>${lbl}</label></div>`;
    const sel = (id, opts, lbl, val) => {
        let options = opts;
        if (val) {
            let regex = new RegExp(`value="${val}"`, 'i');
            if (options.match(regex)) options = options.replace(regex, `value="${val}" selected`);
            else options = options.replace(`>${val}<`, ` selected>${val}<`);
        }
        return `<div class="form-floating mb-2"><select id="${id}" class="form-select">${options}</select><label>${lbl}</label></div>`;
    };
    let v = Object.values(data);
    const getV = (key, idx) => data[key] !== undefined ? data[key] : (v[idx] || '');

    if(tbl==='keuangan') { title='Edit Keuangan'; labelWajib='Tanggal'; html=`${dateInp('i1','Tanggal', getV('tanggal', 1))}${sel('i2','<option value="Pemasukan">Pemasukan</option><option value="Pengeluaran">Pengeluaran</option>','Jenis', getV('kategori', 2))}${inp('i3','Keterangan', getV('keterangan', 3))}${inp('i4','Jumlah (Rp)', getV('jumlah', 4))}`; }
    else if(tbl==='komsel') { title='Edit Rayon'; labelWajib='Nama Rayon'; html=`${inp('i1','Nama Rayon', getV('nama', 1))}${inp('i2','Ketua', getV('ketua', 2))}${inp('i3','Wilayah', getV('wilayah', 3))}`; }
    else if(tbl==='jadwal') { title='Edit Jadwal'; labelWajib='Hari'; html=`${inp('i1','Hari', getV('hari', 1))}${inp('i2','Jam', getV('jam', 2))}${inp('i3','Ibadah', getV('ibadah', 3))}${inp('i4','Lokasi', getV('lokasi', 4))}`; }
    else if(tbl==='talenta') { title='Edit Data Talenta'; labelWajib='Bidang'; html=`${inp('i1','Bidang Talenta', getV('bidang', 1))}${inp('i2','Keterangan', getV('keterangan', 2))}`; }
    else if(tbl==='pelayanan') { title='Edit Jenis Pelayanan'; labelWajib='Nama'; html=`${inp('i1','Nama Pelayanan', getV('nama', 1))}${inp('i2','Deskripsi', getV('deskripsi', 2))}`; }
    else if(tbl==='penyerahan') { title='Edit Penyerahan Anak'; labelWajib='Tanggal'; html=`${dateInp('i1','Tanggal', getV('tanggal', 1))}${inp('i2','Nama Anak', getV('anak', 2))}${inp('i3','Nama Orang Tua', getV('ortu', 3))}`; }
    else if(tbl==='baptisan') { title='Edit Baptisan Air'; labelWajib='Tanggal'; html=`${dateInp('i1','Tanggal', getV('tanggal', 1))}${inp('i2','Nama Lengkap', getV('nama', 2))}${sel('i3','<option value="Pria">Pria</option><option value="Wanita">Wanita</option>','Jenis Kelamin', getV('gender', 3))}`; }
    else if(tbl==='pernikahan') { title='Edit Pernikahan'; labelWajib='Tanggal'; html=`${dateInp('i1','Tanggal', getV('tanggal', 1))}${inp('i2','Mempelai Pria', getV('pria', 2))}${inp('i3','Mempelai Wanita', getV('wanita', 3))}`; }
    else if(tbl==='kedukaan') { title='Edit Kedukaan'; labelWajib='Tanggal'; html=`${dateInp('i1','Tanggal', getV('tanggal', 1))}${inp('i2','Nama Almarhum', getV('almarhum', 2))}${inp('i3','Tempat Makam', getV('makam', 3))}`; }
    else if(tbl==='pengumuman') { 
        title='Edit Pengumuman'; labelWajib='Isi Pengumuman'; 
        html=`<div class="form-floating mb-2"><textarea id="i1" class="form-control" placeholder="Isi Pengumuman" style="height: 120px;">${data.isi || ''}</textarea><label>Isi Pengumuman</label></div>${sel('i2','<option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option>','Status', data.status || 'Aktif')}`; 
    }

    Swal.fire({
        title: title, html: html, width: '600px', showCancelButton: true, confirmButtonText: 'Update', confirmButtonColor: '#3056d3', cancelButtonText: 'Batal', borderRadius: 20,
        didOpen: () => {
            if (tbl === 'keuangan') {
                const jenisSelect = safeEl('i2'); const jumlahInput = safeEl('i4');
                const formatLocal = (angka) => { if (!angka) return ''; return parseFloat(angka.replace(/[^\d]/g,'')).toLocaleString('id-ID'); };
                if (jenisSelect && jumlahInput) {
                    jenisSelect.addEventListener('change', function() {
                        const jenis = this.value; let currentVal = jumlahInput.value.replace(/[^\d]/g,'') || 0;
                        if (jenis === 'Pengeluaran') { if (currentVal > 0) jumlahInput.value = `-${formatLocal(currentVal)}`; } 
                        else { if (currentVal < 0) { currentVal = Math.abs(currentVal); jumlahInput.value = formatLocal(currentVal); } }
                    });
                    const currentJenis = jenisSelect.value; const currentJumlah = jumlahInput.value;
                    if (currentJenis === 'Pengeluaran' && currentJumlah && !currentJumlah.startsWith('-')) jumlahInput.value = `-${formatLocal(currentJumlah)}`;
                    else if (currentJumlah) jumlahInput.value = formatLocal(currentJumlah.replace(/[^\d-]/g,''));
                }
            }
        },
        preConfirm: () => {
            const i1 = safeEl('i1') ? safeEl('i1').value : '';
            if (!i1) { Swal.showValidationMessage(`${labelWajib} wajib diisi!`); return false; }
            return { val1: i1, val2: safeEl('i2') ? safeEl('i2').value : '', val3: safeEl('i3') ? safeEl('i3').value : '', val4: safeEl('i4') ? safeEl('i4').value : '' };
        }
    }).then((r) => {
        if (r.isConfirmed) {
            fetch(`${API_URL}?action=update&table=${tbl}&id=${data.id}&role=${localStorage.getItem("role")}`, { method: 'POST', body: JSON.stringify(r.value) })
            .then(res => res.json())
            .then(d => {
                if (d.status === 'success') {
                    fireSuccess('Berhasil', 'Data diperbarui');
                    if (tbl === 'keuangan') { loadTableKeuangan(); updateStatistik(); } 
                    else if (tbl === 'komsel') loadTableRayon();
                    else loadTable(tbl);
                } else fireError(d.message || 'Gagal memperbarui data.');
            });
        }
    });
}

function aksiEditJemaat(jsonStr) {
    if(localStorage.getItem("role") !== 'admin') return;
    const data = JSON.parse(decodeURIComponent(jsonStr));
    const fotoSrc = data.foto ? `uploads/${data.foto}` : 'uploads/default.jpg';
    const inp = (id, label, val) => `<div class="form-floating mb-2"><input id="${id}" class="form-control" value="${val || ''}" placeholder="${label}"><label>${label}</label></div>`;
    const sel = (id, opts, label, selectedVal) => {
        let options = opts;
        if(selectedVal) {
            let regex = new RegExp(`value="${selectedVal}"`, 'i');
            if(options.match(regex)) options = options.replace(regex, `value="${selectedVal}" selected`);
            else options = options.replace(`>${selectedVal}<`, ` selected>${selectedVal}<`);
        }
        return `<div class="form-floating mb-2"><select id="${id}" class="form-select">${options}</select><label>${label}</label></div>`;
    };
    const dateInp = (id, label, val) => `<div class="form-floating mb-2"><input type="date" id="${id}" class="form-control" value="${val || ''}"><label>${label}</label></div>`;

    let html = `
        <div class="text-center mb-3"><label class="d-block mb-1 text-muted small">Foto Profil</label><img src="${fotoSrc}" id="e_preview_foto" class="rounded-circle border shadow-sm" style="width: 100px; height: 100px; object-fit: cover;"><div class="mt-2"><input type="file" id="e_foto_jemaat" class="form-control form-control-sm" accept="image/*" onchange="document.getElementById('e_preview_foto').src = window.URL.createObjectURL(this.files[0])"></div></div>
        ${inp('e_nama', 'Nama Lengkap', data.nama)}${inp('e_alamat', 'Alamat', data.alamat)}
        <div class="row g-2"><div class="col-6">${inp('e_hp', 'No HP', data.hp)}</div><div class="col-6">${sel('e_jk', '<option value="L">Laki-Laki (L)</option><option value="P">Perempuan (P)</option>', 'Jenis Kelamin', data.jenis_kelamin)}</div></div>
        <div class="row g-2"><div class="col-6">${inp('e_tmp_lahir', 'Tempat Lahir', data.tempat_lahir)}</div><div class="col-6">${dateInp('e_tgl_lahir', 'Tanggal Lahir', data.tgl_lahir)}</div></div>
        <h6 class="text-primary mt-3 border-bottom pb-2">Data Keluarga</h6>
        <div class="row g-2"><div class="col-6">${inp('e_kk', 'No KK', data.no_kk)}</div><div class="col-6">${inp('e_rayon', 'ID Rayon', data.komsel_id)}</div></div>
        <div class="row g-2"><div class="col-6">${sel('e_stat_kel', '<option value="Kepala Keluarga">Kepala Keluarga</option><option value="Istri">Istri</option><option value="Anak">Anak</option><option value="Lainnya">Lainnya</option>', 'Status Keluarga', data.status_keluarga)}</div><div class="col-6">${sel('e_baptis', '<option value="Belum">Belum Baptis</option><option value="Sudah">Sudah Baptis</option>', 'Status Baptis', data.status_baptis)}</div></div>
        <h6 class="text-primary mt-3 border-bottom pb-2">Pelayanan</h6>${sel('e_status_pelayan', '<option value="Tidak">Jemaat Biasa</option><option value="Ya">Pelayan Altar</option>', 'Status Pelayan', data.status_pelayan)}
        <div id="div-role-edit" style="display:${data.status_pelayan === 'Ya' ? 'block' : 'none'};">${sel('e_bidang', '<option value="-">- Pilih -</option><option value="Worship Leader">Worship Leader</option><option value="Singers">Singers</option><option value="Musik">Musik</option><option value="Tamborine">Tamborine</option><option value="Usher">Usher</option><option value="Multimedia">Multimedia</option><option value="SoundMan">SoundMan</option><option value="Doa">Doa</option><option value="Kolektan">Kolektan</option><option value="Lainnya">Lainnya</option>', 'Bidang Pelayanan', data.bidang_pelayanan)}</div>
        <div class="form-check mt-3 p-3 border rounded bg-light"><input class="form-check-input" type="checkbox" id="e_chk_meninggal" ${data.status_anggota === 'Meninggal' ? 'checked' : ''}><label class="form-check-label fw-bold text-danger" for="e_chk_meninggal">Tandai Meninggal Dunia?</label></div>`;

    Swal.fire({
        title: 'Edit Data Jemaat', html: html, width: '600px', showCancelButton: true, confirmButtonText: 'Simpan Perubahan', confirmButtonColor: '#3056d3', cancelButtonText: 'Batal', borderRadius: 20,
        didOpen: () => {
            const statusPelayan = safeEl('e_status_pelayan');
            if (statusPelayan) {
                statusPelayan.addEventListener('change', function() {
                    const div = safeEl('div-role-edit');
                    if (div) div.style.display = (this.value === 'Ya') ? 'block' : 'none';
                });
            }
        },
        preConfirm: () => {
            const formData = new FormData();
            formData.append('id', data.id);
            const fileInput = safeEl('e_foto_jemaat');
            if (fileInput && fileInput.files.length > 0) formData.append('foto', fileInput.files[0]);
            formData.append('val1', safeEl('e_nama').value); formData.append('val2', safeEl('e_alamat').value); formData.append('val3', safeEl('e_hp').value); formData.append('jenis_kelamin', safeEl('e_jk').value); formData.append('val4', safeEl('e_tgl_lahir').value); formData.append('tempat_lahir', safeEl('e_tmp_lahir').value); formData.append('no_kk', safeEl('e_kk').value); formData.append('komsel_id', safeEl('e_rayon').value); formData.append('status_keluarga', safeEl('e_stat_kel').value); formData.append('status_baptis', safeEl('e_baptis').value); formData.append('val5', safeEl('e_status_pelayan').value); formData.append('val6', safeEl('e_status_pelayan').value === 'Ya' ? safeEl('e_bidang').value : '-'); formData.append('status_anggota', safeEl('e_chk_meninggal').checked ? 'Meninggal' : 'Aktif');
            return formData;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${API_URL}?action=update&table=jemaat&id=${data.id}&role=${localStorage.getItem("role")}`, { method: 'POST', body: result.value })
            .then(res => res.json())
            .then(response => {
                if (response.status === 'success') { fireSuccess('Berhasil', 'Data diperbarui'); initJemaatPage(); } 
                else fireError(response.message || 'Gagal memperbarui data jemaat.');
            });
        }
    });
}

function hapus(tbl, id) {
    if (localStorage.getItem("role") !== 'admin') {
        fireWarning('Hanya Admin yang dapat menghapus data.');
        return;
    }

    Swal.fire({
        title: 'Hapus?', text: "Yakin dihapus?", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', borderRadius: 18
    }).then((r) => {
        if (r.isConfirmed) {
            fetch(`${API_URL}?action=delete&table=${tbl}&id=${id}`)
                .then(r => r.json())
                .then(res => {
                    if(res.status === 'success') {
                        if (tbl === 'keuangan') { loadTableKeuangan(); updateStatistik(); } 
                        else if (tbl === 'jemaat') initJemaatPage();
                        else if (tbl === 'komsel') loadTableRayon();
                        else loadTable(tbl);
                    } else fireError(res.message);
                });
        }
    });
}

function bukaDetailJemaat(jsonStr) {
    const d = JSON.parse(decodeURIComponent(jsonStr));
    const fotoUrl = (d.foto && d.foto !== 'null') ? `uploads/${d.foto}` : 'uploads/default.jpg';
    Swal.fire({
        title: '',
        html: `<div class="text-center mb-4"><img src="${fotoUrl}" class="rounded-circle border shadow" style="width:120px;height:120px;object-fit:cover;" onerror="this.src='uploads/default.jpg'"><h4 class="mt-3 mb-0 text-primary">${d.nama}</h4><span class="badge bg-light text-dark border mt-1">${d.status_keluarga}</span>${d.status_anggota === 'Meninggal' ? '<br><span class="badge bg-danger mt-1">Meninggal Dunia</span>' : ''}</div><div class="table-responsive"><table class="table table-sm table-borderless text-start" style="font-size:0.95em;"><tr><td width="35%" class="text-muted">No KK</td><td class="fw-bold">: ${d.no_kk||'-'}</td></tr><tr><td class="text-muted">Rayon</td><td class="fw-bold">: ${d.nama_rayon||d.komsel_id||'-'}</td></tr><tr><td class="text-muted">Jenis Kelamin</td><td class="fw-bold">: ${d.jenis_kelamin==='L' ? 'Laki-Laki' : (d.jenis_kelamin==='P' ? 'Perempuan' : '-')}</td></tr><tr><td class="text-muted">TTL</td><td class="fw-bold">: ${d.tempat_lahir||'-'}, ${d.tgl_lahir||'-'}</td></tr><tr><td class="text-muted">Alamat</td><td class="fw-bold">: ${d.alamat||'-'}</td></tr><tr><td class="text-muted">HP</td><td class="fw-bold">: ${d.hp||'-'}</td></tr><tr><td class="text-muted">Baptis</td><td class="fw-bold">: ${d.status_baptis}</td></tr><tr><td class="text-muted">Pelayanan</td><td class="fw-bold">: ${d.status_pelayan==='Ya'?d.bidang_pelayanan:'-'}</td></tr></table></div>`,
        showCloseButton: true, showConfirmButton: false, width: '450px', padding: '20px', borderRadius: 20
    });
}

function bukaModalHut() {
    const el = safeEl('tbody-hut');
    if (!el) return;
    el.innerHTML = '<tr><td colspan="4" class="text-center">Memuat...</td></tr>';
    const modalEl = safeEl('modalHut');
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
    fetch(`${API_URL}?action=get_birthday_list&t=${new Date().getTime()}`)
        .then(r => r.json())
        .then(data => {
            let h = '';
            if (!data || data.length === 0) h = '<tr><td colspan="4" class="text-center text-muted">Tidak ada yang ultah.</td></tr>';
            else data.forEach(d => { let rayon = d.nama_rayon ? d.nama_rayon : '-'; h += `<tr><td class="fw-bold">${d.tgl_fmt}</td><td>${d.nama}</td><td><span class="badge bg-light text-dark border">${rayon}</span></td><td><span class="badge bg-warning text-dark rounded-pill">${d.usia} Thn</span></td></tr>`; });
            el.innerHTML = h;
        });
}

function bukaJemaatRayon(idRayon, namaRayon) {
    setText('judulModalRayon', "Kepala Keluarga di " + namaRayon);
    const tbody = safeEl('tbody-detail-rayon');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Memuat...</td></tr>';
    const modalEl = safeEl('modalJemaatRayon');
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
    fetch(`${API_URL}?action=get_jemaat_by_rayon&id=${idRayon}`)
        .then(r => r.json())
        .then(data => {
            let h = '';
            if (!data || data.length === 0) h = '<tr><td colspan="3" class="text-center text-muted">Belum ada Kepala Keluarga.</td></tr>';
            else data.forEach(j => {
                let safeName = j.nama ? j.nama.replace(/'/g, "\\'") : '';
                let aksiKlik = (j.no_kk && j.no_kk !== '-' && j.no_kk !== 'null') ? `onclick="bukaKeluarga('${j.no_kk}', '${safeName}')"` : `onclick="Swal.fire('Info','Belum ada No KK','info')"`;
                h += `<tr><td><a href="javascript:void(0)" class="drill-link fw-bold text-decoration-none" ${aksiKlik}><i class="fas fa-user-tie me-2"></i> ${j.nama}</a></td><td>${j.alamat || '-'}</td><td>${j.hp || '-'}</td></tr>`;
            });
            tbody.innerHTML = h;
        });
}

function bukaKeluarga(noKK, namaKepala) {
    bootstrap.Modal.getOrCreateInstance(safeEl('modalJemaatRayon')).hide();
    setText('judulKeluarga', "Keluarga Bpk/Ibu " + namaKepala);
    const tbody = safeEl('tbody-detail-keluarga');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Memuat...</td></tr>';
    const modalEl = safeEl('modalKeluarga');
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
    fetch(`${API_URL}?action=get_keluarga_jemaat&no_kk=${noKK}`)
        .then(r => r.json())
        .then(data => {
            let h = '';
            (data || []).forEach(k => {
                let badge = k.status_baptis === 'Sudah' ? '<span class="badge bg-success rounded-pill">SUDAH</span>' : '<span class="badge bg-secondary text-white rounded-pill">BELUM</span>';
                let ttl = (k.tempat_lahir || '-') + ", " + (k.tgl_lahir || '-');
                h += `<tr><td class="fw-bold">${k.nama}</td><td>${k.status_keluarga}</td><td>${ttl}</td><td class="text-center">${badge}</td></tr>`;
            });
            tbody.innerHTML = h || '<tr><td colspan="4" class="text-center text-muted">Tidak ada data keluarga.</td></tr>';
        });
}

function bukaModalTotalJemaat() {
    const modalEl = safeEl('modalTotalJemaat');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
    const tbody = safeEl('tbody-total-jemaat');
    const footerCount = safeEl('count-total-jemaat');
    if (!tbody || !footerCount) return;
    tbody.innerHTML = '<tr><td colspan="2" class="text-center py-4"><div class="spinner-border text-primary"></div><br>Sedang memuat data...</td></tr>';
    footerCount.innerText = "...";
    fetch(`${API_URL}?action=get_all_jemaat_details`)
        .then(r => r.json())
        .then(data => {
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted py-4">Belum ada data jemaat.</td></tr>';
                footerCount.innerText = "0"; return;
            }
            footerCount.innerText = new Intl.NumberFormat('id-ID').format(data.length);
            tbody.innerHTML = '';
            setTimeout(() => {
                let index = 0;
                const batchSize = 50;
                function renderNextBatch() {
                    const fragment = document.createDocumentFragment();
                    const limit = Math.min(index + batchSize, data.length);
                    for (let i = index; i < limit; i++) {
                        const d = data[i]; const tr = document.createElement('tr');
                        let namaRayon = d.nama_rayon ? d.nama_rayon : 'Belum ada Rayon';
                        let badgeColor = d.nama_rayon ? 'bg-primary' : 'bg-secondary';
                        tr.innerHTML = `<td class="ps-4 fw-bold text-dark">${d.nama}</td><td class="text-end pe-4"><span class="badge ${badgeColor} rounded-pill shadow-sm" style="font-size: 0.75em;">${namaRayon}</span></td>`;
                        fragment.appendChild(tr);
                    }
                    tbody.appendChild(fragment);
                    index += batchSize;
                    if (index < data.length) requestAnimationFrame(renderNextBatch);
                }
                renderNextBatch();
            }, 250);
        });
}

function cekKodeAktif() {
    fetch(`${API_URL}?action=get_kode_absen`)
        .then(r => r.json())
        .then(data => {
            if (data && data.kode && data.tanggal_ibadah && data.batas_waktu) {
                let tglArr = data.tanggal_ibadah.split('-');
                let jamArr = data.batas_waktu.split(':');
                let batasWaktu = new Date(tglArr[0], tglArr[1] - 1, tglArr[2], jamArr[0], jamArr[1], jamArr[2] || 0);
                let sekarang = new Date();
                if (sekarang > batasWaktu) {
                    setText('display-kode-aktif', "--------");
                    setHTML('waktu-generate', `<span class="text-danger"><i class="fas fa-exclamation-circle"></i> Kode sebelumnya telah hangus (Melewati batas jam).</span>`);
                    const btnEmail = safeEl('btn-bagikan-email'); if (btnEmail) btnEmail.style.display = 'none';
                } else {
                    setText('display-kode-aktif', data.kode);
                    let info = `Dibuat: ${data.created_at} <br>Berlaku Untuk: <span class="text-primary fw-bold">${data.tanggal_ibadah}</span> <br>Batas Waktu Absen: <span class="text-danger fw-bold">Jam ${data.batas_waktu.substring(0,5)}</span>`;
                    setHTML('waktu-generate', info);
                    const btnEmail = safeEl('btn-bagikan-email'); if (btnEmail) btnEmail.style.display = 'block';
                }
            } else {
                setText('display-kode-aktif', "--------");
                setText('waktu-generate', "Belum ada kode aktif.");
                const btnEmail = safeEl('btn-bagikan-email'); if (btnEmail) btnEmail.style.display = 'none';
            }
        })
        .catch(() => console.log("Gagal mengecek kode aktif dari server."));
}

function loadTableAbsensi(silent = false) {
    currentAbsensiMode = 'harian';
    const thead = document.querySelector('#view-absensi thead');
    const isAdmin = localStorage.getItem("role") === 'admin';
    if (thead && isAdmin) thead.innerHTML = `<tr><th>Nama Pelayan</th><th class="text-center">Status Kehadiran</th><th class="text-center">Aksi</th></tr>`;
    
    const el = safeEl('tbody-absensi');
    const myId = localStorage.getItem("id_user");
    if (!silent && el) el.innerHTML = '<tr><td colspan="3" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>';
    
    fetch(`${API_URL}?action=get_pelayan_altar&id_khusus=${myId}&t=${new Date().getTime()}`)
        .then(r => r.json())
        .then(data => {
            if (!el) return;
            el.innerHTML = '';
            if (!data || data.length === 0) { el.innerHTML = `<tr><td colspan="3" class="text-center text-danger p-3">Data Kosong.</td></tr>`; return; }
            
            data.forEach(d => {
                let s = d.status_hari_ini; let isPending = d.status_approval === 'Pending'; let kontenAksi = '';
                let displayStatus = (s === 'Alpa') ? 'Tidak Hadir' : s;
                let emailText = d.email ? d.email : 'Email belum diatur';
                let emailDisplay = isAdmin ? `<br><small class="text-muted" style="font-size:0.75em; cursor:pointer;" onclick="updateEmail('${d.id}', '${d.email || ''}')"><i class="fas fa-envelope text-primary me-1"></i>${emailText} <i class="fas fa-pen ms-1"></i></small>` : '';

                if (s !== '-') {
                    if (isPending && isAdmin) {
                        kontenAksi = `<div class="d-flex flex-column align-items-center"><span class="badge bg-warning text-dark mb-2 shadow-sm"><i class="fas fa-hourglass-half me-1"></i> Menunggu Persetujuan (${displayStatus})</span><div><button class="btn btn-sm btn-success rounded-circle shadow-sm me-1" onclick="setujuiAbsensi('${d.id_absen}', '${d.nama}')" title="Setujui"><i class="fas fa-check"></i></button><button class="btn btn-sm btn-danger rounded-circle shadow-sm" onclick="tolakAbsensi('${d.id_absen}', '${d.nama}')" title="Tolak"><i class="fas fa-times"></i></button></div></div>`;
                    } else if (isPending && !isAdmin) {
                        kontenAksi = `<span class="badge bg-warning text-dark fs-6 py-2 w-100 shadow-sm"><i class="fas fa-hourglass-half me-1"></i> Menunggu Admin</span>`;
                    } else {
                        let warna = s==='Hadir'?'success':(s==='Sakit'?'info':(s==='Izin'?'warning':'danger'));
                        kontenAksi = `<span class="badge bg-${warna} fs-6 py-2 w-100 shadow-sm"><i class="fas fa-check-circle me-1"></i> ${displayStatus}</span>`;
                    }
                } else {
                    kontenAksi = `<div class="btn-group w-100 shadow-sm" role="group"><button class="btn btn-success btn-sm fw-bold" onclick="kirimAbsen('${d.id}','Hadir')">Hadir</button><button class="btn btn-info btn-sm text-white" onclick="kirimAbsen('${d.id}','Sakit')">Sakit</button><button class="btn btn-warning btn-sm text-dark" onclick="kirimAbsen('${d.id}','Izin')">Izin</button><button class="btn btn-danger btn-sm" onclick="kirimAbsen('${d.id}','Alpa')">Alpa</button></div>`;
                }

                // FIX: Gunakan d.id_absen untuk menghapus absensi spesifik
                let btnDelAdmin = isAdmin ? `<td class="text-center"><button class="btn btn-danger btn-sm shadow-sm" onclick="hapusAbsenKhusus('${d.id_absen}')"><i class="fas fa-trash"></i></button></td>` : '';
                el.innerHTML += `<tr><td><div class="fw-bold text-dark fs-6">${d.nama}</div><span class="badge bg-light text-secondary border rounded-pill mt-1" style="font-size:0.75em">${d.bidang_pelayanan||'-'}</span>${emailDisplay}</td><td class="text-center" style="vertical-align: middle; width: 220px;">${kontenAksi}</td>${btnDelAdmin}</tr>`;
            });
        });
}

function updateEmail(idJemaat, currentEmail) {
    Swal.fire({
        title: 'Atur Email Pelayan', text: 'Email ini akan digunakan untuk mengirimkan kode presensi.', input: 'email', inputValue: currentEmail, inputPlaceholder: 'contoh@gmail.com', showCancelButton: true, confirmButtonText: 'Simpan Email', confirmButtonColor: '#0d6efd', cancelButtonText: 'Batal', borderRadius: 18
    }).then(r => {
        if (r.isConfirmed) {
            fireLoading('Menyimpan...');
            fetch(`${API_URL}?action=update_email`, { method: 'POST', body: JSON.stringify({id: idJemaat, email: r.value}) })
            .then(res => res.json())
            .then(d => {
                if (d.status === 'success') { fireSuccess('Tersimpan!', 'Email pelayan berhasil diperbarui.'); loadTableAbsensi(true); } 
                else fireError('Terjadi kesalahan sistem.');
            });
        }
    });
}

function loadRiwayatAbsensi() {
    currentAbsensiMode = 'riwayat';
    const thead = document.querySelector('#view-absensi thead');
    const isAdmin = localStorage.getItem("role") === 'admin';
    if (thead) {
        let thAksi = isAdmin ? '<th class="text-center">Aksi</th>' : '';
        thead.innerHTML = `<tr><th>Tanggal</th><th>Jam</th><th>Nama Pelayan</th><th>Status</th>${thAksi}</tr>`;
    }
    loadTable('absensi');
}

function loadRekapAbsensi() {
    currentAbsensiMode = 'rekap';
    const thead = document.querySelector('#view-absensi thead');
    if (thead) thead.innerHTML = '<tr><th>Nama Pelayan</th><th class="text-center" id="th-absen">Total Akumulasi</th></tr>';
    const el = safeEl('tbody-absensi');
    if (!el) return;
    el.innerHTML = '<tr><td colspan="2" class="text-center">Menghitung...</td></tr>';
    fetch(`${API_URL}?action=get_rekap_absensi&t=${new Date().getTime()}`)
        .then(r => r.json())
        .then(data => {
            el.innerHTML = '';
            if (!data || data.length === 0) { el.innerHTML = '<tr><td colspan="2" class="text-center">Belum ada data.</td></tr>'; return; }
            data.forEach(d => {
                let badges = '';
                if (parseInt(d.total_hadir) > 0) badges += `<span class="badge bg-success me-1 mb-1"><i class="fas fa-check-circle me-1"></i>${d.total_hadir} Hadir</span>`;
                if (parseInt(d.total_sakit) > 0) badges += `<span class="badge bg-info text-white me-1 mb-1"><i class="fas fa-procedures me-1"></i>${d.total_sakit} Sakit</span>`;
                if (parseInt(d.total_izin) > 0) badges += `<span class="badge bg-warning text-dark me-1 mb-1"><i class="fas fa-envelope-open-text me-1"></i>${d.total_izin} Izin</span>`;
                if (parseInt(d.total_alpa) > 0) badges += `<span class="badge bg-danger me-1 mb-1"><i class="fas fa-times-circle me-1"></i>${d.total_alpa} Tidak Hadir</span>`;
                if (badges === '') badges = '<span class="badge bg-secondary text-light" style="font-size: 0.7em;">Belum ada data</span>';
                el.innerHTML += `<tr><td><div class="fw-bold">${d.nama}</div></td><td class="text-center" style="vertical-align: middle;">${badges}</td></tr>`;
            });
        });
}

function loadRiwayatSaya() {
    const myId = localStorage.getItem("id_user");
    const tbody = safeEl('tbody-riwayat-saya');
    if (!tbody || !myId) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-danger spinner-border-sm me-2"></div> Memuat riwayat...</td></tr>';
    fetch(`${API_URL}?action=get_riwayat_saya&id_user=${myId}&t=${new Date().getTime()}`)
        .then(r => r.json())
        .then(data => {
            tbody.innerHTML = '';
            if (!data || data.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Belum ada riwayat presensi yang tercatat.</td></tr>'; return; }
            data.forEach(d => {
                let tgl = new Date(d.tanggal).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
                let jam = d.waktu.substring(0, 5);
                let badge = 'secondary', statusText = d.status;
                if (d.status_approval === 'Pending') { badge = 'warning text-dark'; statusText = 'Menunggu Validasi'; } 
                else if (d.status_approval === 'Ditolak') { badge = 'danger'; statusText = 'Ditolak (Alpa)'; } 
                else {
                    if (d.status === 'Hadir') badge = 'success';
                    else if (d.status === 'Sakit') badge = 'info text-white';
                    else if (d.status === 'Izin') badge = 'warning text-dark';
                    else if (d.status === 'Alpa') badge = 'danger';
                }
                let kodePresensi = d.kode_presensi && d.kode_presensi !== '-' ? `<span class="fw-bold font-monospace text-primary">${d.kode_presensi}</span>` : '<span class="text-muted">-</span>';
                tbody.innerHTML += `<tr><td class="fw-bold text-center">${d.no_urut}</td><td class="fw-bold text-dark">${tgl}</td><td class="text-nowrap"><i class="fas fa-clock text-muted me-1"></i> ${jam}</td><td class="text-center">${kodePresensi}</td><td class="text-center"><span class="badge bg-${badge} px-3 py-2 rounded-pill shadow-sm">${statusText}</span></td></tr>`;
            });
        }).catch(() => { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Gagal memuat riwayat data.</td></tr>'; });
}

function kirimAbsen(id, status) {
    fireLoading('Mengirim...');
    fetch(`${API_URL}?action=absen_manual`, { method: 'POST', body: JSON.stringify({ id: id, status: status, by_admin: true }) })
    .then(r => r.json())
    .then(() => {
        let displayStatus = (status === 'Alpa') ? 'Tidak Hadir' : status;
        fireToast('success', `Status: ${displayStatus}`);
        const role = localStorage.getItem("role");
        if (role === 'admin') loadTableAbsensi(true); else loadRiwayatSaya();
        updateStatistik(); loadChatAbsensi(true);
    });
}

function setujuiAbsensi(idAbsen, namaPelayan) {
    Swal.fire({
        title: 'Setujui Kehadiran?', text: `Anda akan mengonfirmasi kehadiran untuk ${namaPelayan}.`, icon: 'info', showCancelButton: true, confirmButtonColor: '#198754', confirmButtonText: 'Ya, Setujui', cancelButtonText: 'Batal', borderRadius: 18
    }).then((result) => { if (result.isConfirmed) prosesPersetujuan(idAbsen, 'Disetujui'); });
}

function tolakAbsensi(idAbsen, namaPelayan) {
    Swal.fire({
        title: 'Tolak Kehadiran?', text: `Kehadiran ${namaPelayan} akan ditolak (dianggap tidak valid/Alfa).`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Ya, Tolak', cancelButtonText: 'Batal', borderRadius: 18
    }).then((result) => { if (result.isConfirmed) prosesPersetujuan(idAbsen, 'Ditolak'); });
}

function prosesPersetujuan(idAbsen, statusKeputusan) {
    if (!idAbsen || idAbsen === 'undefined') { fireError('ID Absensi tidak ditemukan.'); return; }
    fireLoading('Memproses...');
    fetch(`${API_URL}?action=persetujuan_absen`, { method: 'POST', body: JSON.stringify({ id_absen: idAbsen, status: statusKeputusan }) })
    .then(r => r.json())
    .then(res => {
        if (res.status === 'success') { fireSuccess('Berhasil', `Status kehadiran telah diubah menjadi ${statusKeputusan}.`); loadTableAbsensi(true); updateStatistik(); } 
        else fireError(res.message || 'Gagal memproses persetujuan.');
    }).catch(() => { fireSuccess('Simulasi Berhasil', `Status kehadiran diubah menjadi ${statusKeputusan}.`); loadTableAbsensi(true); });
}

function cetakLaporan() {
    const tgl = new Date(); const opsi = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const elTgl = safeEl('tgl-cetak'); if (elTgl) elTgl.innerText = tgl.toLocaleDateString('id-ID', opsi);
    window.print();
}

function loadTentangSistem() {
    fetch(`${API_URL}?action=read&table=pengaturan&t=${new Date().getTime()}`)
        .then(r => r.json())
        .then(data => {
            if (data && data.length > 0) {
                dataTentangSistem = data[0];
                if (safeEl('teks-deskripsi-sistem')) setText('teks-deskripsi-sistem', dataTentangSistem.deskripsi || '-');
                if (safeEl('teks-versi-sistem')) setText('teks-versi-sistem', dataTentangSistem.versi || '-');
                if (safeEl('teks-developer-sistem')) setText('teks-developer-sistem', dataTentangSistem.developer || '-');
            }
        }).catch(() => { if (safeEl('teks-deskripsi-sistem')) setText('teks-deskripsi-sistem', 'Gagal memuat data dari server.'); });
}

function bukaScanner() {
    var modalQR = new bootstrap.Modal(safeEl('modalScanQR')); modalQR.show();
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function onScanSuccess(decodedText) {
    if (html5QrcodeScanner) html5QrcodeScanner.clear();
    var modalEl = safeEl('modalScanQR'); var modalInstance = bootstrap.Modal.getInstance(modalEl); if (modalInstance) modalInstance.hide();
    Swal.fire({
        title: 'Pilih Status Kehadiran',
        html: `<p class="text-muted mb-4">Mencatat absensi untuk ID Pelayan: <strong class="text-primary">${decodedText}</strong></p><div class="d-grid gap-3"><button class="btn btn-success btn-lg shadow-sm fw-bold" onclick="submitAbsenQR('${decodedText}', 'Hadir')"><i class="fas fa-check-circle me-2"></i> Hadir</button><button class="btn btn-info text-white btn-lg shadow-sm fw-bold" onclick="submitAbsenQR('${decodedText}', 'Sakit')"><i class="fas fa-procedures me-2"></i> Sakit</button><button class="btn btn-warning text-dark btn-lg shadow-sm fw-bold" onclick="submitAbsenQR('${decodedText}', 'Izin')"><i class="fas fa-envelope-open-text me-2"></i> Izin</button><button class="btn btn-danger btn-lg shadow-sm fw-bold" onclick="submitAbsenQR('${decodedText}', 'Alpa')"><i class="fas fa-times-circle me-2"></i> Tidak Hadir</button></div>`,
        showConfirmButton: false, showCancelButton: true, cancelButtonText: 'Batal Scan', allowOutsideClick: false, borderRadius: 18
    });
}

function submitAbsenQR(idPelayan, statusPilihan) {
    fireLoading('Menyimpan Absensi...');
    fetch(`${API_URL}?action=absen_manual`, { method: 'POST', body: JSON.stringify({ id: idPelayan, status: statusPilihan, by_admin: true }) })
    .then(r => r.json())
    .then(res => {
        if (res.status === 'success') {
            let displayStatus = (statusPilihan === 'Alpa') ? 'Tidak Hadir' : statusPilihan;
            Swal.fire({ icon: 'success', title: 'Absensi Tercatat!', html: `Status: <b>${displayStatus}</b>`, timer: 2000, showConfirmButton: false, borderRadius: 18 });
            loadTableAbsensi(true); updateStatistik();
        } else Swal.fire('Info', res.message || 'Gagal memproses ke server.', 'info');
    }).catch(() => { Swal.fire({ icon: 'warning', title: 'Koneksi Terputus', text: `Data QR: ${idPelayan} | Status: ${statusPilihan} (Offline/Gagal).`, showConfirmButton: true, borderRadius: 18 }); });
}

function onScanFailure(error) {}

function tutupScanner() {
    if (html5QrcodeScanner) { html5QrcodeScanner.clear().catch(error => console.error("Gagal menghentikan scanner.", error)); }
}

function logout(e) {
    if (e) e.preventDefault();
    Swal.fire({ title: 'Memproses Logout...', text: 'Menghapus sesi Anda.', timer: 1000, timerProgressBar: true, showConfirmButton: false, didOpen: () => Swal.showLoading() })
    .then(() => {
        localStorage.clear(); sessionStorage.clear();
        fetch(`${API_URL}?action=logout`).catch(() => {});
        window.location.replace("login");
    });
}

function tampilkanQRSaya() {
    const myId = localStorage.getItem("id_user");
    const myName = localStorage.getItem("customName") || "Pelayan Altar";
    if (!myId) { fireError('ID Anda tidak ditemukan di sistem. Silakan login ulang.'); return; }

    const namaContainer = safeEl("qr-nama-pelayan");
    const qrContainer = safeEl("qrcode-container");
    const modalQREl = safeEl('modalMyQR');

    if (!qrContainer || !modalQREl) return;
    if (namaContainer) namaContainer.innerText = myName;
    qrContainer.innerHTML = "";

    try {
        myQrCode = new QRCode(qrContainer, { text: myId.toString(), width: 200, height: 200, colorDark: "#0a2647", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H });
        var modalQR = new bootstrap.Modal(modalQREl); modalQR.show();
    } catch(e) { fireError('Library QRCode gagal dimuat.'); }
}

function generateKodeAbsensi() {
    if (localStorage.getItem("role") !== 'admin') return;
    const tglInput = safeEl('input-tgl-generate') ? safeEl('input-tgl-generate').value : '';
    const jamInput = safeEl('input-jam-generate') ? safeEl('input-jam-generate').value : '';
    if (!tglInput || !jamInput) { fireWarning('Harap pilih Tanggal dan Batas Waktu Jam terlebih dahulu.'); return; }

    fireLoading('Membuat Kode...');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let kode = '';
    for (let i = 0; i < 8; i++) { kode += chars.charAt(Math.floor(Math.random() * chars.length)); }

    fetch(`${API_URL}?action=simpan_kode_absen`, { method: 'POST', body: JSON.stringify({ kode: kode, tanggal: tglInput, batas_jam: jamInput }) })
    .then(r => r.json())
    .then(res => {
        if (res.status === 'success') {
            const now = new Date().toLocaleString('id-ID');
            setText('display-kode-aktif', kode);
            setHTML('waktu-generate', `Dibuat: ${now} <br>Berlaku Untuk: <span class="text-primary fw-bold">${tglInput}</span> <br>Batas Waktu Absen: <span class="text-danger fw-bold">Jam ${jamInput}</span>`);
            const btnEmail = safeEl('btn-bagikan-email'); if (btnEmail) btnEmail.style.display = 'block';
            Swal.fire({ icon: 'success', title: 'Kode Presensi Dibuat!', html: `Bagikan 8 digit kode ini ke pelayan altar: <br><div class="bg-light border p-3 mt-3 rounded-3"><h1 class="font-monospace fw-bold text-primary mb-0" style="letter-spacing: 5px;">${kode}</h1></div><small class="text-danger mt-2 d-block"><i class="fas fa-clock"></i> Akan hangus pada ${tglInput} jam ${jamInput}</small>`, confirmButtonColor: '#0d6efd', borderRadius: 18 });
        } else fireError(res.message || 'Gagal membuat kode presensi.');
    }).catch(() => fireError('Gagal menyimpan kode ke database server.'));
}

function bagikanKodeKeEmail() {
    const kodeEl = safeEl("display-kode-aktif");
    const kodeAktif = kodeEl ? kodeEl.innerText : '';
    if (kodeAktif === "--------" || kodeAktif === "") { fireWarning('Silakan generate kode terlebih dahulu.'); return; }

    Swal.fire({
        title: 'Kirim Kode Presensi?', html: `Kode <b>${kodeAktif}</b> akan dikirimkan ke kotak notifikasi aplikasi dan ke email Pelayan Altar.`, icon: 'question', showCancelButton: true, confirmButtonColor: '#0d6efd', cancelButtonColor: '#6c757d', confirmButtonText: '<i class="fas fa-paper-plane me-1"></i> Ya, Kirim Sekarang', cancelButtonText: 'Batal', borderRadius: 18
    }).then((result) => {
        if (result.isConfirmed) {
            fireLoading('Mengirim Info...');
            fetch(`${API_URL}?action=kirim_email_kode`, { method: 'POST', body: JSON.stringify({ kode: kodeAktif }) })
            .then(r => r.json())
            .then(res => {
                if (res.status === 'success') fireSuccess('Berhasil!', res.message); else fireError(res.message || 'Gagal mengirim kode.');
            });
        }
    });
}

function hapusPesan(idPesan) {
    Swal.fire({ title: 'Hapus Pesan?', text: "Pesan ini akan dihapus secara permanen.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Ya, Hapus', borderRadius: 18 })
    .then((result) => {
        if (result.isConfirmed) {
            fetch(`${API_URL}?action=hapus_pesan`, { method: 'POST', body: JSON.stringify({ id_pesan: idPesan }) })
            .then(r => r.json())
            .then(res => {
                if (res.status === 'success') { loadChatAbsensi(true); } else { fireError(res.message || 'Gagal menghapus pesan.'); }
            }).catch(() => { const el = safeEl(`pesan-box-${idPesan}`); if (el) el.remove(); });
        }
    });
}

function loadChatAbsensi(isSilent = false) {
    const role = localStorage.getItem("role");
    const myId = localStorage.getItem("id_user");
    const container = role === 'admin' ? safeEl('admin-chat-container') : safeEl('pelayan-chat-container');
    if (!container) return;

    fetch(`${API_URL}?action=get_pesan_absen&role=${role}&id_user=${myId}`)
        .then(r => r.json())
        .then(data => {
            container.innerHTML = '';
            if (!data || data.length === 0) { container.innerHTML = `<div class="text-center text-muted p-3"><i class="fas fa-check-circle fa-2x mb-2 opacity-50"></i><br>Belum ada obrolan/notifikasi.</div>`; return; }

            data.forEach(d => {
                const isBaru = d.status_baca === 'Belum' ? `<span class="badge bg-danger ms-2" style="font-size:0.6rem;">Baru</span>` : '';
                const tgl = new Date(d.waktu_kirim).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit'});
                const isBroadcast = (d.pengirim_id == 0 || d.pengirim_id === '0');

                let badgeWarna = 'secondary', icon = 'fa-bell';
                if (isBroadcast) { badgeWarna = 'primary'; icon = 'fa-bullhorn'; d.jenis_pesan = 'PENGUMUMAN'; }
                else if (d.jenis_pesan === 'Sakit') { badgeWarna = 'info'; icon = 'fa-procedures'; }
                else if (d.jenis_pesan === 'Izin') { badgeWarna = 'warning text-dark'; icon = 'fa-envelope-open-text'; }
                else if (d.jenis_pesan === 'Request') { badgeWarna = 'primary'; icon = 'fa-hand-paper'; }
                else if (d.jenis_pesan === 'Info') { badgeWarna = 'success'; icon = 'fa-key'; }
                else if (d.jenis_pesan === 'Tanya') { badgeWarna = 'secondary text-dark'; icon = 'fa-comment-dots'; }

                let btnDelete = '';
                if (role === 'admin') btnDelete = `<button class="btn-delete-chat" onclick="hapusPesan(${d.id})"><i class="fas fa-times"></i></button>`;
                else { if (!isBroadcast && d.jenis_pesan !== 'Info') btnDelete = `<button class="btn-delete-chat" onclick="hapusPesan(${d.id})"><i class="fas fa-times"></i></button>`; }

                if (role === 'admin') {
                    let actionBtn = '';
                    if (d.jenis_pesan === 'Request') actionBtn = `<button class="btn btn-sm btn-primary" style="font-size:0.75rem;" onclick="kirimKodeKeSatuPelayan('${d.pengirim_id}')"><i class="fas fa-paper-plane me-1"></i> Balas dengan Kode</button>`;
                    else if (d.jenis_pesan === 'Izin' || d.jenis_pesan === 'Sakit') { actionBtn = `<button class="btn btn-sm btn-outline-success me-1" style="font-size:0.75rem;" onclick="kirimAbsen('${d.pengirim_id}', '${d.jenis_pesan}')">Konfirmasi ${d.jenis_pesan}</button><button class="btn btn-sm btn-outline-secondary" style="font-size:0.75rem;" onclick="balasPesan('${d.pengirim_id}', '${d.nama_pengirim}')"><i class="fas fa-reply"></i> Balas</button>`; } 
                    else if (d.jenis_pesan === 'Tanya') { actionBtn = `<button class="btn btn-sm btn-outline-secondary" style="font-size:0.75rem;" onclick="balasPesan('${d.pengirim_id}', '${d.nama_pengirim}')"><i class="fas fa-reply"></i> Balas Chat</button>`; }
                    container.innerHTML += `<div class="chat-bubble ${isBroadcast ? 'admin-reply' : ''}" id="pesan-box-${d.id}">${btnDelete}<div class="d-flex justify-content-between align-items-center mb-1 pe-4"><h6 class="fw-bold mb-0 text-dark">${isBroadcast ? 'Pengumuman Saya' : d.nama_pengirim} ${isBaru}</h6><small class="text-muted" style="font-size:0.75rem;">${tgl}</small></div><span class="badge bg-${badgeWarna} mb-2"><i class="fas ${icon} me-1"></i> ${d.jenis_pesan}</span><p class="mb-0 text-dark small">"${d.pesan}"</p><div class="mt-2 text-end">${actionBtn}</div></div>`;
                } else {
                    let isFromAdmin = d.jenis_pesan === 'Info' || isBroadcast;
                    let bubbleClass = isFromAdmin ? 'chat-bubble admin-reply' : 'chat-bubble';
                    let namaSender = isFromAdmin ? '<i class="fas fa-user-shield text-success me-1"></i> Admin' : 'Anda';
                    if (isBroadcast) namaSender = '<i class="fas fa-bullhorn text-primary me-1"></i> PENGUMUMAN';
                    container.innerHTML += `<div class="${bubbleClass}" id="pesan-box-${d.id}">${btnDelete}<div class="d-flex justify-content-between pe-4"><span class="fw-bold text-dark" style="font-size: 0.85rem;">${namaSender}</span><small class="text-muted" style="font-size:0.7rem;">${tgl}</small></div><div class="mt-1 mb-2"><span class="badge bg-${badgeWarna}" style="font-size: 0.65rem;"><i class="fas ${icon} me-1"></i> ${d.jenis_pesan} ${isBaru}</span></div><p class="mb-2 text-dark" style="font-size:0.85rem;">"${d.pesan}"</p>${isFromAdmin ? `<div class="text-end"><button class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size:0.7rem;" onclick="balasPesan('${d.pengirim_id}', 'Admin')"><i class="fas fa-reply"></i> Balas Admin</button></div>` : ''}</div>`;
                }
            });
        });
}

function kirimPesanAbsen() {
    const myId = localStorage.getItem("id_user"); const myName = localStorage.getItem("customName") || "Pelayan Altar";
    const jenis = safeEl('input-jenis-absen').value; const pesan = safeEl('input-pesan-absen').value.trim();
    if (!pesan) { fireWarning('Pesan tidak boleh kosong!'); return; }
    fireLoading('Mengirim...');
    fetch(`${API_URL}?action=kirim_pesan_absen`, { method: 'POST', body: JSON.stringify({ id_user: myId, nama: myName, jenis: jenis, pesan: pesan }) })
    .then(r => r.json())
    .then(res => {
        if (res.status === 'success') { fireSuccess('Terkirim!', 'Pesan Anda telah dikirim ke Admin.'); safeEl('input-pesan-absen').value = ''; loadChatAbsensi(true); } 
        else fireError(res.message || 'Gagal mengirim pesan.');
    }).catch(() => fireError('Terjadi kesalahan koneksi.'));
}

function kirimPengumumanAdmin() {
    const pesan = safeEl('input-pengumuman-admin').value.trim();
    if (!pesan) { fireWarning('Pengumuman tidak boleh kosong!'); return; }
    fireLoading('Mengirim...');
    fetch(`${API_URL}?action=kirim_pesan_absen`, { method: 'POST', body: JSON.stringify({ id_user: 0, nama: 'Admin Sistem', jenis: 'Info', pesan: pesan }) })
    .then(r => r.json())
    .then(res => {
        if (res.status === 'success') { fireSuccess('Terkirim!', 'Pengumuman dikirim ke semua pelayan.'); safeEl('input-pengumuman-admin').value = ''; loadChatAbsensi(true); } 
        else fireError(res.message || 'Gagal mengirim pengumuman.');
    }).catch(() => fireError('Terjadi kesalahan koneksi.'));
}

function balasPesan(idPelayan, namaPelayan) {
    Swal.fire({ title: `Balas ke ${namaPelayan}`, input: 'text', inputPlaceholder: 'Ketik pesan balasan...', showCancelButton: true, confirmButtonText: 'Kirim', cancelButtonText: 'Batal' })
    .then((result) => {
        if (result.isConfirmed && result.value) {
            fireLoading('Mengirim...');
            fetch(`${API_URL}?action=kirim_pesan_absen`, { method: 'POST', body: JSON.stringify({ id_user: idPelayan, nama: 'Admin Sistem', jenis: 'Info', pesan: result.value }) })
            .then(r => r.json())
            .then(res => {
                if(res.status === 'success') { fireToast('success', 'Balasan terkirim.'); loadChatAbsensi(true); } else fireError();
            });
        }
    });
}

function kirimKodeKeSatuPelayan(idPelayan) {
    const kodeEl = safeEl("display-kode-aktif");
    const kodeAktif = kodeEl ? kodeEl.innerText : '';
    if (kodeAktif === "--------" || kodeAktif === "") { fireWarning('Silakan generate kode terlebih dahulu.'); return; }
    fireLoading('Mengirim Kode...');
    fetch(`${API_URL}?action=kirim_pesan_absen`, { method: 'POST', body: JSON.stringify({ id_user: idPelayan, nama: 'Admin Sistem', jenis: 'Info', pesan: `Syalom. Kode Presensi hari ini: ${kodeAktif}` }) })
    .then(r => r.json())
    .then(res => { if(res.status === 'success'){ fireToast('success', 'Kode berhasil dikirim ke pelayan tersebut.'); loadChatAbsensi(true); } else fireError(); });
}

function mintaKodeAbsensi() {
    const myId = localStorage.getItem("id_user"); const myName = localStorage.getItem("customName") || "Pelayan Altar";
    if (!myId) { fireError('Sesi tidak valid, silakan login ulang.'); return; }
    fireLoading('Meminta kode...');
    fetch(`${API_URL}?action=kirim_pesan_absen`, { method: 'POST', body: JSON.stringify({ id_user: myId, nama: myName, jenis: 'Request', pesan: 'Mohon kirimkan kode presensi hari ini.' }) })
    .then(r => r.json())
    .then(res => {
        if (res.status === 'success') { fireSuccess('Terkirim', 'Permintaan kode berhasil dikirim ke Admin.'); loadChatAbsensi(true); } 
        else fireError(res.message || 'Gagal meminta kode ke Admin.');
    }).catch(() => fireError('Koneksi ke server gagal.'));
}

function submitKodePresensiManual() {
    const inputEl = document.getElementById("input-kode-absen"); const kodeInput = inputEl ? inputEl.value.trim() : ""; const myId = localStorage.getItem("id_user");
    if (!kodeInput) { fireWarning('Harap masukkan kode presensi terlebih dahulu!'); return; }
    fireLoading('Memverifikasi Kode...');
    fetch(`${API_URL}?action=verifikasi_kode`, { method: 'POST', body: JSON.stringify({ id_user: myId, kode: kodeInput }) })
    .then(r => r.json())
    .then(res => {
        if (res.status === 'success') { fireSuccess('Berhasil!', 'Presensi Anda telah tercatat.'); if (inputEl) inputEl.value = ""; loadRiwayatSaya(); updateStatistik(); } 
        else fireError(res.message || 'Kode presensi salah atau sudah kadaluarsa.');
    }).catch(() => fireError('Terjadi kesalahan saat menghubungi server.'));
}

function mulaiRequestAkun() {
    Swal.fire({
        title: 'Cari Data Anda',
        html: `<p style="font-size:0.9rem; color:#64748b;">Ketik nama Anda sesuai data di Gereja:</p><input type="text" id="req-cari-nama" class="form-control" placeholder="Ketik nama jemaat..." style="background:#fff; color:#000; border:1px solid #ccc;"><div id="hasil-pencarian-req" style="margin-top:15px; text-align:left; max-height:200px; overflow-y:auto;"></div>`,
        background: '#ffffff', showConfirmButton: false, showCancelButton: true, cancelButtonText: 'Tutup', borderRadius: '24px',
        didOpen: () => {
            const input = document.getElementById('req-cari-nama'); const hasil = document.getElementById('hasil-pencarian-req');
            input.addEventListener('keyup', function() {
                let val = this.value.trim();
                if(val.length < 3) { hasil.innerHTML = '<small class="text-muted">Ketik minimal 3 huruf...</small>'; return; }
                hasil.innerHTML = '<small class="text-muted">Mencari...</small>';
                fetch(`${API_URL}?action=cari_jemaat_req&query=${val}`).then(r => r.json()).then(data => {
                    if(data.length === 0) { hasil.innerHTML = '<small class="text-danger">Nama tidak ditemukan. Pastikan Anda sudah terdaftar di Gereja.</small>'; return; }
                    let h = '';
                    data.forEach(d => {
                        if(d.punya_akun) {
                            h += `<div style="padding:10px; border:1px solid #fee2e2; border-radius:10px; margin-bottom:8px; background:#fef2f2; cursor:not-allowed; opacity: 0.8;"><div style="font-weight:bold; color:#991b1b;">${d.nama}</div><div style="font-size:0.8rem; color:#b91c1c; margin-top:4px;"><i class="fas fa-exclamation-circle"></i> Akun sudah terdaftar / dalam antrean.</div></div>`;
                        } else {
                            h += `<div style="padding:10px; border:1px solid #eee; border-radius:10px; margin-bottom:8px; cursor:pointer; background:#f8f9fa;" onclick="lanjutFormRequest('${d.id}', '${d.nama}')" onmouseover="this.style.background='#eef2f7'" onmouseout="this.style.background='#f8f9fa'"><div style="font-weight:bold; color:#0d6efd;">${d.nama}</div><div style="font-size:0.8rem; color:#6c757d;">TTL: ${d.tgl_lahir || '-'}</div></div>`;
                        }
                    });
                    hasil.innerHTML = h;
                });
            });
        }
    });
}

window.lanjutFormRequest = function(id, nama) {
    Swal.fire({
        title: 'Buat Akun Anda',
        html: `<p style="font-size:0.85rem; color:#64748b;">Anda memilih: <b style="color:#0a2647;">${nama}</b></p><div style="text-align:left; margin-top:15px;"><label style="font-size:0.8rem; font-weight:bold; color:#08101f;">Username Pilihan</label><input type="text" id="req-username" class="form-control mb-3" placeholder="Contoh: miracle99" style="background:#fff; color:#000; border:1px solid #ccc;"><label style="font-size:0.8rem; font-weight:bold; color:#08101f;">Email Anda (Penting!)</label><input type="email" id="req-email" class="form-control" placeholder="Contoh: user@gmail.com" style="background:#fff; color:#000; border:1px solid #ccc;"><small style="color:#dc3545; font-size:0.75rem; margin-top:5px; display:block;">*Password akan dikirimkan ke email ini setelah disetujui Admin.</small></div>`,
        background: '#ffffff', showCancelButton: true, confirmButtonText: 'Ajukan Permintaan', confirmButtonColor: '#0d6efd', cancelButtonText: 'Batal', borderRadius: '24px',
        preConfirm: () => {
            const u = document.getElementById('req-username').value.trim(); const e = document.getElementById('req-email').value.trim();
            if(!u || !e) { Swal.showValidationMessage('Username dan Email wajib diisi!'); return false; }
            return { jemaat_id: id, username: u, email: e };
        }
    }).then((res) => {
        if(res.isConfirmed) {
            Swal.fire({ title: 'Mengirim...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            fetch(`${API_URL}?action=submit_req_akun`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(res.value) }).then(r => r.json()).then(d => {
                if(d.status === 'success') { Swal.fire({ icon: 'success', title: 'Berhasil Diajukan', text: 'Tunggu persetujuan Admin. Password akan dikirim ke email Anda.', borderRadius: '24px' }); } 
                else { Swal.fire({ icon: 'error', title: 'Gagal', text: d.message, borderRadius: '24px' }); }
            });
        }
    });
}

function loadRequestAkun() {
    if(localStorage.getItem("role") !== 'admin') return;
    fetch(`${API_URL}?action=get_req_akun`)
    .then(r => r.json())
    .then(data => {
        const box = safeEl('box-request-akun'); const tbody = safeEl('tbody-request-akun');
        if(!box || !tbody) return;
        if(data.length === 0) { box.style.display = 'none'; } 
        else {
            box.style.display = 'block'; tbody.innerHTML = '';
            data.forEach(d => {
                tbody.innerHTML += `<tr><td class="fw-bold text-dark">${d.nama}</td><td><span class="badge bg-light text-primary border">${d.req_username}</span></td><td class="text-muted"><i class="fas fa-envelope me-1"></i>${d.email}</td><td class="text-center"><button class="btn btn-sm btn-success shadow-sm me-1" onclick="aksiReqAkun('${d.id}', 'approve')"><i class="fas fa-check me-1"></i>Setujui</button><button class="btn btn-sm btn-danger shadow-sm" onclick="aksiReqAkun('${d.id}', 'reject')"><i class="fas fa-times"></i></button></td></tr>`;
            });
        }
    });
}

function aksiReqAkun(id, aksi) {
    let title = aksi === 'approve' ? 'Setujui Akun?' : 'Tolak Akun?';
    let text = aksi === 'approve' ? 'Sistem akan membuatkan password acak dan mengirimnya ke email jemaat ini.' : 'Permintaan ini akan dihapus/ditolak.';
    Swal.fire({ title: title, text: text, icon: 'question', showCancelButton: true, confirmButtonColor: aksi==='approve' ? '#198754' : '#dc3545' }).then((res) => {
        if(res.isConfirmed){
            fireLoading('Memproses...');
            let act = aksi === 'approve' ? 'approve_req_akun' : 'reject_req_akun';
            fetch(`${API_URL}?action=${act}&id=${id}`)
            .then(r => r.json())
            .then(d => {
                if(d.status === 'success') { fireSuccess('Berhasil!', aksi === 'approve' ? 'Akun disetujui & email terkirim.' : 'Request ditolak.'); loadRequestAkun(); } 
                else fireError(d.message);
            });
        }
    });
}

function cetakLaporanSuper() {
    fireLoading('Menyiapkan data laporan...');
    const role = localStorage.getItem("role");
    fetch(`${API_URL}?action=get_super_recap&role=${role}`)
    .then(r => r.json())
    .then(d => {
        Swal.close();
        const tgl = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>Rekapitulasi Global SIMG</title>
            <style>body { font-family: sans-serif; padding: 40px; color: #333; } .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 30px; } .title { font-size: 22px; font-weight: bold; text-transform: uppercase; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #999; padding: 12px; text-align: left; } th { background-color: #f2f2f2; width: 40%; } .section-title { background: #eee; font-weight: bold; padding: 10px; margin-top: 25px; border-left: 5px solid #d4af37; } .footer { margin-top: 50px; text-align: right; font-size: 14px; }</style>
            </head><body>
            <div class="header"><div class="title">SISTEM INFORMASI GEREJA (SIMG)</div><div style="font-size: 18px;">GPdI GALILEA PUSAT KAWANGKOAN</div><div style="font-size: 12px; margin-top: 5px;">Laporan Rekapitulasi Data Global Per Tanggal: ${tgl}</div></div>
            <div class="section-title">I. DATA KEPENDUDUKAN JEMAAT</div><table><tr><th>Total Seluruh Jemaat</th><td>${d.total_jemaat} Jiwa</td></tr><tr><th>Jemaat Laki-Laki</th><td>${d.jemaat_pria} Jiwa</td></tr><tr><th>Jemaat Perempuan</th><td>${d.jemaat_wanita} Jiwa</td></tr><tr><th>Total Rayon/Komsel</th><td>${d.total_rayon} Kelompok</td></tr></table>
            <div class="section-title">II. RINGKASAN KEUANGAN GEREJA</div><table><tr><th>Total Pemasukan</th><td>${formatRupiah(d.masuk)}</td></tr><tr><th>Total Pengeluaran</th><td>${formatRupiah(d.keluar)}</td></tr><tr><th>Saldo Kas Saat Ini</th><td><b>${formatRupiah(d.masuk - d.keluar)}</b></td></tr></table>
            <div class="section-title">III. DATA PELAYANAN PASTORAL</div><table><tr><th>Penyerahan Anak</th><td>${d.penyerahan} Data</td></tr><tr><th>Baptisan Air</th><td>${d.baptisan} Data</td></tr><tr><th>Pernikahan</th><td>${d.pernikahan} Data</td></tr><tr><th>Kedukaan</th><td>${d.kedukaan} Data</td></tr></table>
            <div class="footer"><p>Kawangkoan, ${tgl}</p><br><br><br><p><b>Administrasi Gereja</b></p><p style="font-size: 10px; color: #999;">Printed by SIMG - Development by Miracle Kaligis</p></div>
            <script>window.onload = function() { window.print(); window.close(); }<\/script></body></html>
        `);
        printWindow.document.close();
    }).catch(() => fireError('Gagal mengambil data rekap.'));
}

function popupGantiPassword() {
    Swal.fire({
        title: 'Ganti Password',
        html: `<div style="text-align: left;"><div class="form-group mb-3"><label class="small fw-bold">Password Saat Ini</label><input type="password" id="old-pass" class="form-control" placeholder="Masukkan password lama"></div><div class="form-group mb-3"><label class="small fw-bold">Password Baru</label><input type="password" id="new-pass" class="form-control" placeholder="Minimal 5 karakter"></div><div class="form-group"><label class="small fw-bold">Konfirmasi Password Baru</label><input type="password" id="conf-pass" class="form-control" placeholder="Ulangi password baru"></div></div>`,
        showCancelButton: true, confirmButtonText: 'Update Password', confirmButtonColor: '#dc3545', cancelButtonText: 'Batal', borderRadius: '22px',
        preConfirm: () => {
            const oldP = safeEl('old-pass').value; const newP = safeEl('new-pass').value; const confP = safeEl('conf-pass').value;
            if (!oldP || !newP || !confP) { Swal.showValidationMessage('Semua kolom wajib diisi!'); return false; }
            if (newP.length < 5) { Swal.showValidationMessage('Password baru minimal 5 karakter!'); return false; }
            if (newP !== confP) { Swal.showValidationMessage('Konfirmasi password tidak cocok!'); return false; }
            return { id_user: localStorage.getItem("id_user"), role: localStorage.getItem("role"), pass_lama: oldP, pass_baru: newP };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            fireLoading('Memproses password baru...');
            fetch(`${API_URL}?action=ganti_password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.value) })
            .then(r => r.json())
            .then(d => {
                if (d.status === 'success') { Swal.fire({ icon: 'success', title: 'Berhasil!', text: d.message + ' Silakan login ulang nanti dengan password baru.', borderRadius: '22px' }); } 
                else { fireError(d.message); }
            });
        }
    });
}

// ==========================================
// KODE TAMBAHAN UNTUK PENGHAPUSAN RIWAYAT
// ==========================================

function hapusAbsenKhusus(idAbsen) {
    if(localStorage.getItem("role") !== 'admin') return;
    if (!idAbsen || idAbsen === 'null') {
        fireWarning('Belum ada data kehadiran untuk pelayan ini di hari ini.');
        return;
    }
    hapusRiwayat(idAbsen);
}

function hapusRiwayat(id_absen) {
    const id_user = localStorage.getItem("id_user");
    const role = localStorage.getItem("role");

    Swal.fire({
        title: 'Hapus Riwayat?', 
        text: "Data absensi ini akan dihapus secara permanen.", 
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: '#d33', 
        confirmButtonText: 'Ya, Hapus', 
        borderRadius: 18
    }).then(r => {
        if(r.isConfirmed) {
            fireLoading('Menghapus...');
            fetch(`${API_URL}?action=hapus_riwayat&id_absen=${id_absen}&id_user=${id_user}&role=${role}`)
            .then(r => r.json())
            .then(res => {
                if(res.status === 'success') {
                    fireSuccess('Berhasil', res.message);
                    if (currentAbsensiMode === 'harian') loadTableAbsensi(true);
                    else if (role === 'admin') loadTable('absensi');
                    else loadRiwayatSaya();
                    updateStatistik();
                } else fireError(res.message);
            }).catch(() => fireError('Terjadi kesalahan pada server.'));
        }
    });
}

function hapusAbsensiHariIni() {
    const role = localStorage.getItem("role");
    if(role !== 'admin') {
        fireWarning('Hanya Admin yang dapat menghapus semua absensi hari ini.');
        return;
    }

    Swal.fire({
        title: 'Hapus Semua Absensi Hari Ini?', 
        text: "PERINGATAN: Seluruh data kehadiran pelayan pada hari ini akan terhapus dan tidak dapat dikembalikan!", 
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: '#d33', 
        confirmButtonText: 'Ya, Hapus Semua', 
        borderRadius: 18
    }).then(r => {
        if(r.isConfirmed) {
            fireLoading('Menghapus data...');
            fetch(`${API_URL}?action=hapus_absensi_hari_ini&role=${role}`)
            .then(r => r.json())
            .then(res => {
                if(res.status === 'success') {
                    fireSuccess('Berhasil', res.message);
                    loadTableAbsensi(true);
                    updateStatistik();
                } else fireError(res.message);
            }).catch(() => fireError('Terjadi kesalahan pada server.'));
        }
    });
}