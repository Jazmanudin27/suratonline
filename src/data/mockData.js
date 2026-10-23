// Master HRD Jabatan from production database
export const HRD_JABATAN = [
  { kode: 'J01', nama: 'DIREKTUR', alias: 'DIR' },
  { kode: 'J02', nama: 'GENERAL MANAGER', alias: 'GM' },
  { kode: 'J03', nama: 'REGIONAL SALES MANAGER', alias: 'RSM' },
  { kode: 'J04', nama: 'REGIONAL OPERATION MANAGER', alias: 'ROM' },
  { kode: 'J05', nama: 'MANAGER', alias: 'MGR' },
  { kode: 'J06', nama: 'ASST. MANAGER', alias: 'ASST. MGR' },
  { kode: 'J07', nama: 'SALES MARKETING MANAGER', alias: 'SMM' },
  { kode: 'J08', nama: 'OPERATION MANAGER', alias: 'OM' },
  { kode: 'J09', nama: 'KEPALA PRODUKSI', alias: 'KAPROD' },
  { kode: 'J10', nama: 'KEPALA GUDANG', alias: 'KAGUD' },
  { kode: 'J11', nama: 'KEPALA REGU', alias: 'KAREGU' },
  { kode: 'J12', nama: 'SUPERVISOR', alias: 'SPV' },
  { kode: 'J13', nama: 'STAFF', alias: 'STAFF' },
  { kode: 'J14', nama: 'ADMIN', alias: 'ADM' },
  { kode: 'J15', nama: 'CHECKER', alias: 'CHECKER' },
  { kode: 'J16', nama: 'OPERATOR', alias: 'OPR' },
  { kode: 'J17', nama: 'MEKANIK', alias: 'MEK' },
  { kode: 'J18', nama: 'HELPER', alias: 'HELPER' },
  { kode: 'J19', nama: 'SALESMAN', alias: 'SLS' },
  { kode: 'J20', nama: 'SECURITY', alias: 'SEC' },
  { kode: 'J21', nama: 'SOPIR', alias: 'SOPIR' },
  { kode: 'J25', nama: 'SPV PAJAK', alias: 'SPV PAJAK' },
  { kode: 'J26', nama: 'CRM', alias: 'CRM' },
  { kode: 'J27', nama: 'IT', alias: 'IT' },
  { kode: 'J28', nama: 'KEUANGAN', alias: 'KEU' },
]

export const INITIAL_BRANCHES = [
  { id: 'PST', code: 'PST', name: 'Kantor Pusat Tasikmalaya', address: 'Jalan Perintis Kemerdekaan No. 160 Kel Kersamenak Kec Kawalu Kota Tasikmalaya', pt: 'CV Makmur Permata', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Drs. H. Sutisna, M.M.', knownByPosition: 'Kepala Operasional Pusat', rsmId: '349', rsmName: 'Yusup Supriatna', regionalName: 'Regional 1 (Jabar)' },
  { id: 'BDG', code: 'BDG', name: 'Cabang Bandung', address: 'JL Sukabirus Komplek Pergudangan Nanjung Industrial Park KAV10 Ds Nanjung Kec Margaasih Kab Bandung', pt: 'PT. INTIRASA PANGAN PERSADA', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Dedi Supriyadi, S.E.', knownByPosition: 'Kepala Cabang Bandung', rsmId: '349', rsmName: 'Yusup Supriatna', regionalName: 'Regional 1 (Jabar)' },
  { id: 'BGR', code: 'BGR', name: 'Cabang Bogor', address: 'Jl Anyar No 7 RT002 RW001 Desa Leuwinutug Kec Citeureup Kab Bogor', pt: 'PT. ASIA BOGOR DISTRIBUSI', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Ir. Hendra Gunawan', knownByPosition: 'Kepala Cabang Bogor', rsmId: '349', rsmName: 'Yusup Supriatna', regionalName: 'Regional 1 (Jabar)' },
  { id: 'BKI', code: 'BKI', name: 'Cabang Bekasi', address: 'Jalan Raya Tegal Danas Nomor 6, Jayamukti, Kec. Cikarang Pusat, Kab. Bekasi', pt: 'PT. SUBUR MAKMUR UTAMA', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Bambang Triyono, S.T.', knownByPosition: 'Kepala Cabang Bekasi', rsmId: '349', rsmName: 'Yusup Supriatna', regionalName: 'Regional 1 (Jabar)' },
  { id: 'BTN', code: 'BTN', name: 'Cabang Banten', address: 'Jl Raya Banten Lingkungan Kelanggaran Kel Unyur Kec Serang Kota Serang Banten', pt: 'PT. BANTEN MAJU JAYA', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'H. Tb. Mulyadi', knownByPosition: 'Kepala Cabang Banten', rsmId: '349', rsmName: 'Yusup Supriatna', regionalName: 'Regional 1 (Jabar & Banten)' },
  { id: 'CRB', code: 'CRB', name: 'Cabang Cirebon', address: 'Jalan Raya Plumbon – Palimanan Km 5 Pasar Lama, Kec. Plumbon, Kab. Cirebon', pt: 'PT. SUBUR MAKMUR ALAMI', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Agus Setiawan, S.E.', knownByPosition: 'Kepala Cabang Cirebon', rsmId: '349', rsmName: 'Yusup Supriatna', regionalName: 'Regional 1 (Jabar)' },
  { id: 'GRT', code: 'GRT', name: 'Cabang Garut', address: 'Jalan H. Hasan Arif Kp Cisoreang Ds Sukaratu Kec Banyuresmi Kab Garut', pt: 'PT. GARUT CAHAYA PERKASA', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Asep Saepuloh, S.Pd.', knownByPosition: 'Kepala Cabang Garut', rsmId: '349', rsmName: 'Yusup Supriatna', regionalName: 'Regional 1 (Jabar)' },
  { id: 'KLT', code: 'KLT', name: 'Cabang Yogyakarta / Klaten', address: 'Jalan Mataram No 7 Belang Wetan Kec Klaten Utara Kab Klaten', pt: 'PT. INTI SARI CAPSAICINDO', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Raden Mas Suryo', knownByPosition: 'Kepala Cabang Yogyakarta', rsmId: '97', rsmName: 'Bagus Eka', regionalName: 'Regional 2 (Jateng & DIY)' },
  { id: 'MLG', code: 'MLG', name: 'Cabang Malang', address: 'Jl. Raya Wonorejo No.97-72, Arjowinangun, Kec. Kedungkandang, Kota Malang', pt: 'PT. INTIRASA ALAMI SEJAHTERA', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Joko Prasetyo, S.E.', knownByPosition: 'Kepala Cabang Malang', rsmId: '189', rsmName: 'Antonius Tri Utomo', regionalName: 'Regional 3 (Jatim)' },
  { id: 'PWK', code: 'PWK', name: 'Cabang Purwakarta', address: 'Jl Kemuning RT075 RW008 Desa Nagri Kaler Kec Purwakarta Kab Purwakarta', pt: 'PT. INTIRASA ALAMI SEJAHTERA', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Cecep Hidayat', knownByPosition: 'Kepala Cabang Purwakarta', rsmId: '349', rsmName: 'Yusup Supriatna', regionalName: 'Regional 1 (Jabar)' },
  { id: 'PWT', code: 'PWT', name: 'Cabang Purwokerto', address: 'Jl Sultan Agung No 8A Desa Karangnanas Kec Sokaraja Kab Banyumas', pt: 'PT. CAKRAWALA PANGAN DISTRIBUSI', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Slamet Riyadi', knownByPosition: 'Kepala Cabang Purwokerto', rsmId: '97', rsmName: 'Bagus Eka', regionalName: 'Regional 2 (Jateng & DIY)' },
  { id: 'SBY', code: 'SBY', name: 'Cabang Surabaya', address: 'Wonokerto Timur No 10 RT 002 RW 002, Kel. Kedung Wonokerto, Kec. Prambon, Kab. Sidoarjo', pt: 'PT. LANGGENG KARYA ABHINAYA', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Budi Hartono, M.M.', knownByPosition: 'Kepala Cabang Surabaya', rsmId: '189', rsmName: 'Antonius Tri Utomo', regionalName: 'Regional 3 (Jatim)' },
  { id: 'SKB', code: 'SKB', name: 'Cabang Cianjur (Sukabumi)', address: 'Jl Raya Cibeber Kp. Warungtiwu RT 01 RW 08 Desa Peuteuy Condong Kec Cibeber Kab Cianjur', pt: 'PT. RASA UTAMA GEMILANG', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Ujang Suherman', knownByPosition: 'Kepala Cabang Cianjur', rsmId: '349', rsmName: 'Yusup Supriatna', regionalName: 'Regional 1 (Jabar)' },
  { id: 'SMR', code: 'SMR', name: 'Cabang Semarang', address: 'Jalan Raya Kuripan No 96 Sengor Desa Kuripan Kec Karangawen Kab Demak', pt: 'PT. PANGAN SEMARANG SEJAHTERA', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Sugeng Raharjo, S.E.', knownByPosition: 'Kepala Cabang Semarang', rsmId: '97', rsmName: 'Bagus Eka', regionalName: 'Regional 2 (Jateng & DIY)' },
  { id: 'TGL', code: 'TGL', name: 'Cabang Pemalang (Tegal)', address: 'Jl Pangeran Cakrabuana Desa Wanasaba Kidul Kec Talun Kab Cirebon', pt: 'PT. SUBUR MAKMUR ALAMI', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Khaerul Anam', knownByPosition: 'Kepala Cabang Pemalang', rsmId: '97', rsmName: 'Bagus Eka', regionalName: 'Regional 2 (Jateng & DIY)' },
  { id: 'TGR', code: 'TGR', name: 'Cabang Tangerang', address: 'Gang Cukang Galih II No 1 Desa Cukanggalih Kec Curug Kab Tangerang', pt: 'PT. MAKMUR ANUGRAH DISTRIBUSINDO', madeBy: 'Robertus David CH', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Ardi Kurniawan', knownByPosition: 'Operation Manager (OM)', rsmId: '349', rsmName: 'Yusup Supriatna', regionalName: 'Regional 1 (Jabar & Banten)' },
  { id: 'TSM', code: 'TSM', name: 'Cabang Tasikmalaya', address: 'Jalan Perintis Kemerdekaan No. 160 Kel Kersamenak Kec Kawalu Kota Tasikmalaya', pt: 'PT. CAHAYA RIANG GALUNGGUNG', madeBy: 'Anif Ardiana', madeByPosition: 'Sales Marketing Manager (SMM)', knownBy: 'Drs. H. Maman Suratman', knownByPosition: 'Kepala Cabang Tasikmalaya', rsmId: '349', rsmName: 'Yusup Supriatna', regionalName: 'Regional 1 (Jabar)' },
]

export const INITIAL_USERS = [
  {
    id: '4',
    name: 'Siti Aisah',
    username: 'aisah',
    email: 'aisah@pedasalami.com',
    role: 'pemohon',
    roleLabel: 'Pemohon (Admin Cabang Bandung)',
    branchId: 'BDG',
    branchName: 'Cabang Bandung',
    position: 'Admin Cabang (J14)',
    kodeJabatan: 'J14',
  },
  {
    id: '3',
    name: 'Iis Istiqomah',
    username: 'iis',
    email: 'iis@pedasalami.com',
    role: 'pemohon',
    roleLabel: 'Pemohon (Admin Cabang Tasikmalaya)',
    branchId: 'TSM',
    branchName: 'Cabang Tasikmalaya',
    position: 'Admin Cabang (J14)',
    kodeJabatan: 'J14',
  },
  {
    id: '27',
    name: 'Dasep Reski Soejani',
    username: 'dasep',
    email: 'dasep@pedasalami.com',
    role: 'approver',
    approvalLevel: 1,
    roleLabel: 'Approver 1 (Sales Marketing Manager Bandung)',
    branchId: 'BDG',
    branchName: 'Cabang Bandung',
    position: 'Sales Marketing Manager (J07)',
    kodeJabatan: 'J07',
  },
  {
    id: '349',
    name: 'Yusup Supriatna',
    username: 'yusup.jabar',
    email: 'rsm.jabar@pedasalami.com',
    role: 'approver',
    approvalLevel: 2,
    roleLabel: 'Approver 2 (RSM Regional 1 - Jabar)',
    branchId: 'PST',
    branchName: 'Kantor Regional 1 (Jabar)',
    position: 'Regional Sales Manager (J03)',
    kodeJabatan: 'J03',
  },
  {
    id: '97',
    name: 'Bagus Eka',
    username: 'rsm2',
    email: 'rsm2@pedasalami.com',
    role: 'approver',
    approvalLevel: 2,
    roleLabel: 'Approver 2 (RSM Regional 2 - Jateng & DIY)',
    branchId: 'PST',
    branchName: 'Kantor Regional 2 (Jateng & DIY)',
    position: 'Regional Sales Manager (J03)',
    kodeJabatan: 'J03',
  },
  {
    id: '189',
    name: 'Antonius Tri Utomo',
    username: 'antonius@pedasalami.com',
    email: 'antonius@pedasalami.com',
    role: 'approver',
    approvalLevel: 2,
    roleLabel: 'Approver 2 (RSM Regional 3 - Jatim)',
    branchId: 'PST',
    branchName: 'Kantor Regional 3 (Jatim)',
    position: 'Regional Sales Manager (J03)',
    kodeJabatan: 'J03',
  },
  {
    id: '22',
    name: 'Jemmy Feldiana',
    username: 'jemmy',
    email: 'jemmy@pedasalami.com',
    role: 'approver',
    approvalLevel: 3,
    roleLabel: 'Approver 3 (Direktur Utama / Direksi)',
    branchId: 'PST',
    branchName: 'Kantor Pusat',
    position: 'DIREKTUR (J01)',
    kodeJabatan: 'J01',
  },
  {
    id: '29',
    name: 'Jazmanudin',
    username: 'jazmanudin',
    email: 'jaz@pedasalami.com',
    role: 'admin_pusat',
    roleLabel: 'Super Admin Pusat (IT System)',
    branchId: 'PST',
    branchName: 'Kantor Pusat',
    position: 'IT & Administrator Sistem (J27)',
    kodeJabatan: 'J27',
  },
  {
    id: '30',
    name: 'Budi Raharja',
    username: 'budi.crm',
    email: 'crm@pedasalami.com',
    role: 'admin_pusat',
    roleLabel: 'Admin CRM (J26)',
    branchId: 'PST',
    branchName: 'Kantor Pusat',
    position: 'CRM & Layanan Pelanggan (J26)',
    kodeJabatan: 'J26',
  },
]

export const INITIAL_TEMPLATES = [
  {
    id: 'tpl-perdin',
    code: 'PERDIN',
    name: 'Ajuan Perjalanan Dinas',
    category: 'Operasional',
    description: 'Surat tugas dan pengajuan estimasi biaya perjalanan dinas luar kota karyawan cabang.',
    numberFormat: '{{year}}/{{branch_code}}/SP/{{roman_month}}/{{seq}}',
    allowedBranches: ['all'],
    isActive: true,
    approvalSteps: [
      { step: 1, title: 'Verifikasi & Validasi HRD', approverRole: 'HRD', kodeJabatan: 'J05', specificUserId: '109', specificUserName: 'HRD (Dedy Julfikar / Dude)', assignmentType: 'role' },
      { step: 2, title: 'Persetujuan Yudistira Ridla (HRD Pusat)', approverRole: 'HRD & GA PUSAT', kodeJabatan: 'J12', specificUserId: '223', specificUserName: 'Yudistira Ridla Ichfany', assignmentType: 'user' },
      { step: 3, title: 'Persetujuan Dedy Julfikar (Dude)', approverRole: 'HRD PUSAT', kodeJabatan: 'J05', specificUserId: '109', specificUserName: 'Dedy Julfikar (Dude)', assignmentType: 'user' },
      { step: 4, title: 'Persetujuan Direktur Utama (Jemmy)', approverRole: 'DIREKTUR UTAMA', kodeJabatan: 'J01', specificUserId: '22', specificUserName: 'Jemmy Feldiana', assignmentType: 'user' },
    ],
    fields: [
      { id: 'f_nama', label: 'Nama Pemohon', name: 'nama_pemohon', type: 'text', required: true, autoFill: 'user_name' },
      { id: 'f_jabatan', label: 'Jabatan Pemohon', name: 'jabatan', type: 'text', required: true, autoFill: 'position' },
      { id: 'f_tujuan', label: 'Kota / Lokasi Tujuan', name: 'kota_tujuan', type: 'text', placeholder: 'Contoh: Semarang & Solo', required: true },
      { id: 'f_tgl_berangkat', label: 'Tanggal Berangkat', name: 'tanggal_berangkat', type: 'date', required: true },
      { id: 'f_tgl_pulang', label: 'Tanggal Kembali', name: 'tanggal_pulang', type: 'date', required: true },
      {
        id: 'f_transportasi',
        label: 'Moda Transportasi',
        name: 'transportasi',
        type: 'select',
        options: ['Pesawat Komersial', 'Kereta Api Eksekutif', 'Mobil Operasional Cabang', 'Kendaraan Pribadi / Travel'],
        required: true,
      },
      { id: 'f_keperluan', label: 'Keperluan & Agenda Perjalanan Dinas', name: 'keperluan', type: 'textarea', placeholder: 'Uraikan maksud dan target perjalanan dinas...', required: true },
      {
        id: 'f_biaya_table',
        label: 'Rincian Estimasi Biaya Perjalanan Dinas',
        name: 'rincian_biaya',
        type: 'table_costs',
        required: true,
      },
    ],
    letterTemplate: `
<p style="text-align: right; margin-bottom: 16px;">{{nama_cabang}}, {{tanggal_surat}}</p>
<table style="width: 100%; border: none; margin-bottom: 16px;">
  <tr>
    <td style="width: 15%; vertical-align: top;"><strong>Nomor</strong></td>
    <td style="width: 2%; vertical-align: top;">:</td>
    <td style="vertical-align: top;">{{nomor_surat}}</td>
  </tr>
  <tr>
    <td style="vertical-align: top;"><strong>Lampiran</strong></td>
    <td style="vertical-align: top;">:</td>
    <td style="vertical-align: top;">1 (Satu) Berkas Rincian Biaya</td>
  </tr>
  <tr>
    <td style="vertical-align: top;"><strong>Perihal</strong></td>
    <td style="vertical-align: top;">:</td>
    <td style="vertical-align: top;"><strong>Permohonan Persetujuan Perjalanan Dinas</strong></td>
  </tr>
</table>

<p>Kepada Yth,<br><strong>Pimpinan / Dewan Direksi & Manajer Terkait</strong><br>Di Tempat</p>

<p style="margin-top: 16px;">Dengan hormat,</p>
<p>Sehubungan dengan pelaksanaan agenda kerja perusahaan dan koordinasi operasional cabang, kami yang bertanda tangan di bawah ini mengajukan permohonan pelaksanaan perjalanan dinas dengan data sebagai berikut:</p>

<table style="width: 100%; border: none; margin: 16px 0; line-height: 1.8;">
  <tr>
    <td style="width: 28%;">Nama Karyawan</td>
    <td style="width: 2%;">:</td>
    <td><strong>{{nama_pemohon}}</strong></td>
  </tr>
  <tr>
    <td>Jabatan</td>
    <td>:</td>
    <td>{{jabatan}}</td>
  </tr>
  <tr>
    <td>Unit Kerja / Cabang</td>
    <td>:</td>
    <td>{{nama_cabang}}</td>
  </tr>
  <tr>
    <td>Kota / Tujuan</td>
    <td>:</td>
    <td><strong>{{kota_tujuan}}</strong></td>
  </tr>
  <tr>
    <td>Jadwal Pelaksanaan</td>
    <td>:</td>
    <td>{{tanggal_berangkat}} s.d {{tanggal_pulang}}</td>
  </tr>
  <tr>
    <td>Transportasi</td>
    <td>:</td>
    <td>{{transportasi}}</td>
  </tr>
  <tr>
    <td style="vertical-align: top;">Keperluan / Maksud</td>
    <td style="vertical-align: top;">:</td>
    <td style="vertical-align: top;">{{keperluan}}</td>
  </tr>
</table>

<p>Adapun rincian estimasi kebutuhan anggaran perjalanan dinas adalah sebagai berikut:</p>

{{tabel_biaya_html}}

<p style="margin-top: 16px; margin-bottom: 24px;">Demikian surat permohonan perjalanan dinas ini kami sampaikan dengan sebenar-benarnya. Atas perhatian, arahan, dan persetujuan yang diberikan, kami ucapkan terima kasih.</p>
`,
  },
  {
    id: 'tpl-service',
    code: 'SERVICE',
    name: 'Ajuan Service / Perbaikan Aset',
    category: 'Pemeliharaan',
    description: 'Surat pengajuan servis rutin atau perbaikan kerusakan kendaraan operasional dan peralatan kantor cabang.',
    numberFormat: '{{year}}/{{branch_code}}/SP/{{roman_month}}/{{seq}}',
    allowedBranches: ['all'],
    isActive: true,
    approvalSteps: [
      { step: 1, title: 'Pemeriksaan Lapangan (Dedi Mulyadi)', approverRole: 'PRODUKSI / LOGISTIK', kodeJabatan: 'J12', specificUserId: '222', specificUserName: 'Dedi Mulyadi', assignmentType: 'user' },
      { step: 2, title: 'Verifikasi Manajer (Ridwan Nugraha)', approverRole: 'OPERATION MANAGER', kodeJabatan: 'J02', specificUserId: '20', specificUserName: 'Ridwan Nugraha', assignmentType: 'user' },
      { step: 3, title: 'Persetujuan Direktur Utama (Jemmy)', approverRole: 'DIREKTUR UTAMA', kodeJabatan: 'J01', specificUserId: '22', specificUserName: 'Jemmy Feldiana', assignmentType: 'user' },
    ],
    fields: [
      { id: 'f_nama', label: 'Nama Pemohon', name: 'nama_pemohon', type: 'text', required: true, autoFill: 'user_name' },
      {
        id: 'f_jenis_aset',
        label: 'Kategori / Jenis Aset',
        name: 'jenis_aset',
        type: 'select',
        options: ['Kendaraan Roda 4 (Operasional)', 'Kendaraan Roda 2 (Kurir/Lap.)', 'Perangkat IT / Server / Laptop', 'Mesin Genset / Elektrikal', 'AC & Fasilitas Gedung'],
        required: true,
      },
      { id: 'f_no_aset', label: 'Nama / No. Polisi / No. Inventaris Aset', name: 'nama_nomor_aset', type: 'text', placeholder: 'Contoh: Toyota Avanza B 1234 XYZ (Inv: INV/2023/089)', required: true },
      { id: 'f_keluhan', label: 'Rincian Keluhan / Kerusakan Aset', name: 'keluhan_kerusakan', type: 'textarea', placeholder: 'Jelaskan tanda kerusakan, komponen aus, atau masalah fungsi...', required: true },
      { id: 'f_tempat_service', label: 'Rekomendasi Bengkel / Tempat Servis', name: 'tempat_service', type: 'text', placeholder: 'Nama bengkel resmi / rekanan kantor...', required: true },
      { id: 'f_estimasi_biaya', label: 'Estimasi Biaya Perbaikan (Rp)', name: 'estimasi_biaya', type: 'number', placeholder: '1500000', required: true },
      {
        id: 'f_urgensi',
        label: 'Tingkat Urgensi',
        name: 'urgensi',
        type: 'select',
        options: ['Biasa (Jadwal Berkala)', 'Mendesak (Mengganggu Operasional)', 'Sangat Mendesak (Aset Mati Total)'],
        required: true,
      },
      { id: 'f_lampiran', label: 'Catatan Foto / Dokumen Kerusakan', name: 'lampiran_catatan', type: 'text', placeholder: 'Lampiran foto bukti fisik kerusakan terlampir', required: false },
    ],
    letterTemplate: `
<p style="text-align: right; margin-bottom: 16px;">{{nama_cabang}}, {{tanggal_surat}}</p>
<table style="width: 100%; border: none; margin-bottom: 16px;">
  <tr>
    <td style="width: 15%; vertical-align: top;"><strong>Nomor</strong></td>
    <td style="width: 2%; vertical-align: top;">:</td>
    <td style="vertical-align: top;">{{nomor_surat}}</td>
  </tr>
  <tr>
    <td style="vertical-align: top;"><strong>Lampiran</strong></td>
    <td style="vertical-align: top;">:</td>
    <td style="vertical-align: top;">Estimasi Penawaran Servis & Foto Fisik</td>
  </tr>
  <tr>
    <td style="vertical-align: top;"><strong>Perihal</strong></td>
    <td style="vertical-align: top;">:</td>
    <td style="vertical-align: top;"><strong>Permohonan Service & Perbaikan Aset Cabang</strong></td>
  </tr>
</table>

<p>Kepada Yth,<br><strong>Manajemen Operasional & Tim Persetujuan</strong><br>Di Tempat</p>

<p style="margin-top: 16px;">Dengan hormat,</p>
<p>Bersama surat ini kami laporkan kondisi aset operasional di lingkungan cabang yang memerlukan tindakan perbaikan / servis teknis segera, dengan spesifikasi sebagai berikut:</p>

<table style="width: 100%; border: none; margin: 16px 0; line-height: 1.8;">
  <tr>
    <td style="width: 28%;">Nama Pemohon</td>
    <td style="width: 2%;">:</td>
    <td><strong>{{nama_pemohon}}</strong></td>
  </tr>
  <tr>
    <td>Cabang Pemohon</td>
    <td>:</td>
    <td>{{nama_cabang}}</td>
  </tr>
  <tr>
    <td>Kategori Aset</td>
    <td>:</td>
    <td>{{jenis_aset}}</td>
  </tr>
  <tr>
    <td>Identitas / No. Inventaris</td>
    <td>:</td>
    <td><strong>{{nama_nomor_aset}}</strong></td>
  </tr>
  <tr>
    <td>Tingkat Urgensi</td>
    <td>:</td>
    <td><span style="display:inline-block; padding: 2px 8px; background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; font-weight: bold;">{{urgensi}}</span></td>
  </tr>
  <tr>
    <td>Rekomendasi Bengkel/Vendor</td>
    <td>:</td>
    <td>{{tempat_service}}</td>
  </tr>
  <tr>
    <td>Estimasi Total Biaya</td>
    <td>:</td>
    <td><strong style="color: #1e3a8a; font-size: 1.1em;">Rp {{estimasi_biaya_format}}</strong></td>
  </tr>
  <tr>
    <td style="vertical-align: top;">Rincian Kerusakan</td>
    <td style="vertical-align: top;">:</td>
    <td style="vertical-align: top;">{{keluhan_kerusakan}}</td>
  </tr>
</table>

<p>Pekerjaan perbaikan ini penting dilakukan guna menjamin kelancaran aktivitas layanan di cabang serta mencegah kerusakan meluas yang berpotensi menambah beban biaya perusahaan.</p>

<p style="margin-top: 16px; margin-bottom: 24px;">Demikian permohonan ini diajukan untuk mendapatkan evaluasi dan persetujuan. Terima kasih.</p>
`,
  },
  {
    id: 'tpl-diskon-crm',
    code: 'DISKON',
    name: 'Ajuan Diskon Khusus Klien (CRM)',
    category: 'Sales & CRM',
    description: 'Surat persetujuan pemberian potongan harga khusus atau negosiasi kontrak proyek klien perusahaan.',
    numberFormat: '{{year}}/{{branch_code}}/SP/{{roman_month}}/{{seq}}',
    allowedBranches: ['all'],
    isActive: true,
    approvalSteps: [
      { step: 1, title: 'Persetujuan Kepala Cabang', approverRole: 'Kepala Cabang' },
      { step: 2, title: 'Persetujuan Manajer Area', approverRole: 'Manajer Area' },
      { step: 3, title: 'Persetujuan Pimpinan Pusat (Direksi)', approverRole: 'Pimpinan Pusat' },
    ],
    fields: [
      { id: 'f_nama', label: 'Nama Sales / Account Executive', name: 'nama_pemohon', type: 'text', required: true, autoFill: 'user_name' },
      { id: 'f_klien', label: 'Nama Perusahaan / Klien CRM', name: 'nama_klien', type: 'text', placeholder: 'PT Megah Perkasa Sentosa', required: true },
      { id: 'f_pic', label: 'Nama PIC & Kontak Klien', name: 'pic_klien', type: 'text', placeholder: 'Bpk. Irfan (0812-9988-7766)', required: true },
      { id: 'f_nilai_transaksi', label: 'Nilai Total Kontrak / Proyek (Rp)', name: 'nilai_kontrak', type: 'number', placeholder: '150000000', required: true },
      { id: 'f_persen_diskon', label: 'Persentase Diskon Diajukan (%)', name: 'persen_diskon', type: 'number', placeholder: '15', required: true },
      { id: 'f_alasan_diskon', label: 'Alasan & Pertimbangan Komersial', name: 'alasan_diskon', type: 'textarea', placeholder: 'Komitmen pembelian jangka panjang atau tender strategis...', required: true },
    ],
    letterTemplate: `
<p style="text-align: right; margin-bottom: 16px;">{{nama_cabang}}, {{tanggal_surat}}</p>
<table style="width: 100%; border: none; margin-bottom: 16px;">
  <tr>
    <td style="width: 15%; vertical-align: top;"><strong>Nomor</strong></td>
    <td style="width: 2%; vertical-align: top;">:</td>
    <td style="vertical-align: top;">{{nomor_surat}}</td>
  </tr>
  <tr>
    <td style="vertical-align: top;"><strong>Perihal</strong></td>
    <td style="vertical-align: top;">:</td>
    <td style="vertical-align: top;"><strong>Permohonan Persetujuan Diskon Khusus Klien Komersial</strong></td>
  </tr>
</table>

<p>Kepada Yth,<br><strong>Direksi Penjualan & Tim Otorisasi Harga</strong><br>Di Tempat</p>

<p style="margin-top: 16px;">Dengan hormat,</p>
<p>Sehubungan dengan peluang transaksi strategis dengan mitra pelanggan (CRM) di lingkungan cabang, bersama ini kami mengajukan permohonan fasilitas diskon khusus di luar ketentuan standar:</p>

<table style="width: 100%; border: none; margin: 16px 0; line-height: 1.8;">
  <tr>
    <td style="width: 32%;">Nama Klien / Mitra</td>
    <td style="width: 2%;">:</td>
    <td><strong>{{nama_klien}}</strong></td>
  </tr>
  <tr>
    <td>Kontak PIC Klien</td>
    <td>:</td>
    <td>{{pic_klien}}</td>
  </tr>
  <tr>
    <td>Nilai Kontrak / Pesanan</td>
    <td>:</td>
    <td><strong>Rp {{nilai_kontrak_format}}</strong></td>
  </tr>
  <tr>
    <td>Diskon yang Diajukan</td>
    <td>:</td>
    <td><span style="background-color: #fef08a; padding: 2px 8px; border-radius: 4px; font-weight: bold; color: #854d0e;">{{persen_diskon}}%</span></td>
  </tr>
  <tr>
    <td style="vertical-align: top;">Pertimbangan Bisnis</td>
    <td style="vertical-align: top;">:</td>
    <td style="vertical-align: top;">{{alasan_diskon}}</td>
  </tr>
</table>

<p>Permohonan ini diajukan dengan harapan dapat memenangkan tender dan membina kerja sama jangka panjang dengan pelanggan terkait.</p>

<p style="margin-top: 16px; margin-bottom: 24px;">Demikian kami sampaikan untuk mendapatkan persetujuan. Terima kasih.</p>
`,
  },
  {
    id: 'tpl-cuti',
    code: 'CUTI',
    name: 'Ajuan Cuti & Izin Karyawan',
    category: 'HRD & Personalia',
    description: 'Surat permohonan hak cuti tahunan, cuti khusus, atau izin meninggalkan tugas kedinasan cabang.',
    numberFormat: '{{year}}/{{branch_code}}/SP/{{roman_month}}/{{seq}}',
    allowedBranches: ['all'],
    isActive: true,
    approvalSteps: [
      { step: 1, title: 'Persetujuan Kepala Cabang', approverRole: 'Kepala Cabang' },
      { step: 2, title: 'Verifikasi HRD Pusat', approverRole: 'HRD Pusat' },
    ],
    fields: [
      { id: 'f_nama', label: 'Nama Karyawan', name: 'nama_pemohon', type: 'text', required: true, autoFill: 'user_name' },
      {
        id: 'f_jenis_cuti',
        label: 'Jenis Cuti / Izin',
        name: 'jenis_cuti',
        type: 'select',
        options: ['Cuti Tahunan', 'Cuti Menikah', 'Cuti Melahirkan', 'Cuti Ibadah Keagamaan', 'Izin Keperluan Keluarga Mendesak'],
        required: true,
      },
      { id: 'f_tgl_mulai', label: 'Tanggal Mulai Cuti', name: 'tanggal_mulai', type: 'date', required: true },
      { id: 'f_tgl_selesai', label: 'Tanggal Selesai Cuti', name: 'tanggal_selesai', type: 'date', required: true },
      { id: 'f_total_hari', label: 'Total Hari Kerja Cuti', name: 'total_hari', type: 'number', placeholder: '3', required: true },
      { id: 'f_pengganti', label: 'Karyawan Pengganti Sementara (Handover)', name: 'petugas_pengganti', type: 'text', placeholder: 'Nama rekan kerja yang menggantikan operasional...', required: true },
      { id: 'f_keterangan', label: 'Keterangan Tambahan / Alamat Selama Cuti', name: 'keterangan_cuti', type: 'textarea', placeholder: 'Alamat tempat tinggal / nomor HP aktif saat cuti...', required: false },
    ],
    letterTemplate: `
<p style="text-align: right; margin-bottom: 16px;">{{nama_cabang}}, {{tanggal_surat}}</p>
<table style="width: 100%; border: none; margin-bottom: 16px;">
  <tr>
    <td style="width: 15%; vertical-align: top;"><strong>Nomor</strong></td>
    <td style="width: 2%; vertical-align: top;">:</td>
    <td style="vertical-align: top;">{{nomor_surat}}</td>
  </tr>
  <tr>
    <td style="vertical-align: top;"><strong>Perihal</strong></td>
    <td style="vertical-align: top;">:</td>
    <td style="vertical-align: top;"><strong>Permohonan Hak Cuti / Izin Kerja Karyawan</strong></td>
  </tr>
</table>

<p>Kepada Yth,<br><strong>Kepala Cabang & Divisi SDM / HRD Pusat</strong><br>Di Tempat</p>

<p style="margin-top: 16px;">Dengan hormat,</p>
<p>Yang bertanda tangan di bawah ini:</p>

<table style="width: 100%; border: none; margin: 16px 0; line-height: 1.8;">
  <tr>
    <td style="width: 30%;">Nama Pemohon</td>
    <td style="width: 2%;">:</td>
    <td><strong>{{nama_pemohon}}</strong></td>
  </tr>
  <tr>
    <td>Cabang Penempatan</td>
    <td>:</td>
    <td>{{nama_cabang}}</td>
  </tr>
  <tr>
    <td>Jenis Cuti</td>
    <td>:</td>
    <td><strong>{{jenis_cuti}}</strong></td>
  </tr>
  <tr>
    <td>Periode Pengambilan</td>
    <td>:</td>
    <td>{{tanggal_mulai}} s.d {{tanggal_selesai}} ({{total_hari}} Hari Kerja)</td>
  </tr>
  <tr>
    <td>Petugas Pengganti Sementara</td>
    <td>:</td>
    <td>{{petugas_pengganti}}</td>
  </tr>
  <tr>
    <td style="vertical-align: top;">Catatan / Kontak</td>
    <td style="vertical-align: top;">:</td>
    <td style="vertical-align: top;">{{keterangan_cuti}}</td>
  </tr>
</table>

<p>Tugas dan tanggung jawab pekerjaan operasional selama masa cuti telah dikoordinasikan kepada petugas pengganti di atas.</p>

<p style="margin-top: 16px; margin-bottom: 24px;">Demikian permohonan ini diajukan untuk mendapatkan persetujuan. Terima kasih.</p>
`,
  },
]

export const INITIAL_LETTERS = [
  {
    id: 'ltr-001',
    templateId: 'tpl-perdin',
    templateCode: 'PERDIN',
    templateName: 'Ajuan Perjalanan Dinas',
    letterNumber: '001/PERDIN/BDG/X/2026',
    userId: '4',
    userName: 'Siti Aisah',
    branchId: 'BDG',
    branchName: 'Cabang Bandung',
    status: 'approved',
    currentStep: 3,
    totalSteps: 3,
    title: 'Perjalanan Dinas Audit Stock & Pelatihan Gudang Nanjung',
    createdAt: '2026-10-10T08:30:00Z',
    updatedAt: '2026-10-12T14:20:00Z',
    fieldValues: {
      nama_pemohon: 'Siti Aisah',
      jabatan: 'Admin Cabang (J14)',
      kota_tujuan: 'Tasikmalaya & Garut',
      tanggal_berangkat: '2026-10-20',
      tanggal_pulang: '2026-10-23',
      transportasi: 'Kereta Api Eksekutif',
      keperluan: 'Pemeriksaan stok pergudangan dan rekonsiliasi data faktur penjualan cabang Jawa Barat.',
      rincian_biaya: [
        { item: 'Uang Saku & Uang Makan (4 hari)', amount: 1200000 },
        { item: 'Penginapan / Hotel 3 Malam', amount: 1500000 },
        { item: 'Tiket Kereta Eksekutif PP', amount: 950000 },
        { item: 'Transport Lokal Antar Cabang', amount: 450000 },
      ],
      total_biaya: 4100000,
    },
    content: '',
    approvalHistory: [
      { step: 1, approverRole: 'Sales Marketing Manager', approverName: 'Dasep Reski Soejani', status: 'approved', notes: 'Disetujui. Sesuai agenda audit triwulan 4.', date: '2026-10-10T11:00:00Z' },
      { step: 2, approverRole: 'Regional Sales Manager Jabar', approverName: 'Yusup Supriatna', status: 'approved', notes: 'Disetujui. Koordinasikan dengan kepala gudang.', date: '2026-10-11T09:15:00Z' },
      { step: 3, approverRole: 'Direktur Utama', approverName: 'Jemmy Feldiana', status: 'approved', notes: 'Disetujui penuh. Dana operasional dapat dicairkan.', date: '2026-10-12T14:20:00Z' },
    ],
  },
  {
    id: 'ltr-002',
    templateId: 'tpl-service',
    templateCode: 'SERVICE',
    templateName: 'Ajuan Service / Perbaikan Aset',
    letterNumber: '002/SERVICE/TSM/X/2026',
    userId: '3',
    userName: 'Iis Istiqomah',
    branchId: 'TSM',
    branchName: 'Cabang Tasikmalaya',
    status: 'pending',
    currentStep: 1,
    totalSteps: 2,
    title: 'Perbaikan Sistem Rem & Radiator Mobil Operasional Avanza Tasik',
    createdAt: '2026-10-14T09:10:00Z',
    updatedAt: '2026-10-14T09:10:00Z',
    fieldValues: {
      nama_pemohon: 'Iis Istiqomah',
      jenis_aset: 'Kendaraan Roda 4 (Operasional)',
      nama_nomor_aset: 'Toyota Avanza Z 1245 KP (Inv: OPR-TSM-02)',
      keluhan_kerusakan: 'Rem berbunyi gesekan besi tajam, air radiator cepat berkurang dan indikator temperatur mesin sering naik.',
      tempat_service: 'Bengkel Resmi Auto2000 Tasikmalaya',
      estimasi_biaya: 2850000,
      urgensi: 'Mendesak (Mengganggu Operasional)',
      lampiran_catatan: 'Estimasi nota awal dan foto kanvas rem terlampir.',
    },
    content: '',
    approvalHistory: [
      { step: 1, approverRole: 'Sales Marketing Manager', approverName: 'Aceng Saepul Anwar', status: 'pending', notes: '', date: null },
      { step: 2, approverRole: 'Regional Sales Manager Jabar', approverName: 'Yusup Supriatna', status: 'pending', notes: '', date: null },
    ],
  },
  {
    id: 'ltr-003',
    templateId: 'tpl-diskon-crm',
    templateCode: 'DISKON',
    templateName: 'Ajuan Diskon Khusus Klien (CRM)',
    letterNumber: '003/DISKON/GRT/X/2026',
    userId: '5',
    userName: 'Radea Feryzal, ST',
    branchId: 'GRT',
    branchName: 'Cabang Garut',
    status: 'pending',
    currentStep: 2,
    totalSteps: 3,
    title: 'Diskon Khusus Proyek Pengadaan CV Berkah Pangan Garut',
    createdAt: '2026-10-13T10:15:00Z',
    updatedAt: '2026-10-14T11:00:00Z',
    fieldValues: {
      nama_pemohon: 'Radea Feryzal, ST',
      nama_klien: 'CV Berkah Pangan Nusantara (Garut)',
      pic_klien: 'Bpk. H. Dadang (0812-2345-6789)',
      nilai_kontrak: 85000000,
      persen_diskon: 12,
      alasan_diskon: 'Kontrak berlangganan komitmen pasokan bumbu dapur 6 bulan berturut-turut.',
    },
    content: '',
    approvalHistory: [
      { step: 1, approverRole: 'Sales Marketing Manager', approverName: 'Radea Feryzal, ST', status: 'approved', notes: 'Disetujui. Volume pembelian memenuhi kuota grosir.', date: '2026-10-13T14:00:00Z' },
      { step: 2, approverRole: 'Regional Sales Manager Jabar', approverName: 'Yusup Supriatna', status: 'pending', notes: '', date: null },
      { step: 3, approverRole: 'Direktur Utama', approverName: 'Jemmy Feldiana', status: 'pending', notes: '', date: null },
    ],
  },
]
