const { AbilityBuilder, Ability } = require("@casl/ability");

const policies = {
  guest(user, { can }) {
    can("read", "Product");  // Membaca produk
  },

  user(user, { can }) {
    // Akses ke Order
    can("view", "Order"); // melihat daftar order
    can("create", "Order"); // membuat order
    can("read", "Order", { user_id: user._id }); // membaca order miliknya

    // Akses ke User
    can("update", "User", { _id: user._id }); // mengupdate data dirinya sendiri

    // Akses ke Cart
    can("read", "Cart", { user_id: user._id }); // membaca cart miliknya
    can("update", "Cart", { user_id: user._id }); // mengupdate cart miliknya

    // Akses ke Delivery Address
    can("view", "DeliveryAddress"); // melihat daftar alamat
    can("create", "DeliveryAddress", { user_id: user._id }); // membuat alamat pengiriman
    can("read", "DeliveryAddress", { user_id: user._id }); // membaca alamat miliknya
    can("update", "DeliveryAddress", { user_id: user._id }); // mengupdate alamat miliknya
    can("delete", "DeliveryAddress", { user_id: user._id }); // menghapus alamat miliknya

    // Akses ke Invoice
    can("read", "Invoice", { user_id: user._id }); // membaca invoice miliknya
  },

  admin(user, { can }) {
    can("manage", "all"); // memberikan akses penuh
  }
};

// Modifikasi fungsi policyFor untuk menangani peran dan logika otorisasi
function policyFor(user) {
  const { can, cannot, rules } = new AbilityBuilder(Ability);

  // Cek peran pengguna dan tentukan kebijakan akses yang berlaku
  if (user && policies[user.role]) {
    policies[user.role](user, { can, cannot });
  } else {
    // Default ke guest jika tidak ada peran yang ditemukan
    policies["guest"](user, { can, cannot });
  }

  return new Ability(rules);
}

module.exports = { policyFor };
