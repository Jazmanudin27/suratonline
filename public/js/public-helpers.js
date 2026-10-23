/**
 * PUBLIC HELPERS - SURAT AJUAN ONLINE
 * File ini berada di folder /public/js/ dan dimuat langsung di index.html.
 * Menyediakan fungsi helper publik seperti jQuery untuk manipulasi DOM cepat.
 */

(function () {
  'use strict';

  // Siapkan objek global jika belum ada
  window.$public = {
    version: '1.0.0',
    // Cepat ambil elemen DOM
    get: function (sel) {
      return document.querySelector(sel);
    },
    getAll: function (sel) {
      return document.querySelectorAll(sel);
    },
    // Format mata uang Rupiah
    rupiah: function (num) {
      if (num === null || num === undefined) return 'Rp 0';
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(num);
    },
    // Print halaman
    printDoc: function () {
      window.print();
    }
  };

  console.log('✅ Public Assets (CSS & JS) siap digunakan.');
})();
