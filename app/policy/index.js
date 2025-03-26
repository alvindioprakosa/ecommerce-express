const { AbilityBuilder, Ability } = require("@casl/ability");

const policies = {
  guest(user, { can }) {
    can("read", "Product");
  },

  user(user, { can }) {
    // membaca daftar `Order`
    can("view", "Order");

    // membuat `Order`
    can("create", "Order");

    // membaca `Order` miliknya
    can("read", "Order", { user_id: user._id });

    // mengupdate data dirinya sendiri (`User`)
    can("update", "User", { _id: user._id });

    // membaca `Cart` miliknya
    can("read", "Cart", { user_id: user._id });

    // mengupdate `Cart` miliknya
    can("update", "Cart", { user_id: user._id });

    // melihat daftar `DeliveryAddress`
    can("view", "DeliveryAddress");

    // membuat `DeliveryAddress`
    can("create", "DeliveryAddress", { user_id: user._id });

    // membaca `DeliveryAddress` miliknya
    can("read", "DeliveryAddress", { user_id: user._id });

    // mengupdate `DeliveryAddress` miliknya
    can("update", "DeliveryAddress", { user_id: user._id });

    // menghapus `DeliveryAddress` miliknya
    can("delete", "DeliveryAddress", { user_id: user._id });

    // membaca `Invoice` miliknya
    can("read", "Invoice", { user_id: user._id });
  },

  admin(user, { can }) {
    can("manage", "all"); // Memberikan akses penuh ke semua resource
  }
};

function policyFor(user) {
  const { can, cannot, rules } = new AbilityBuilder(Ability);

  if (user && typeof policies[user.role] === "function") {
    policies[user.role](user, { can, cannot });
  } else {
    policies["guest"](user, { can, cannot });
  }

  return new Ability(rules);
}

module.exports = { policyFor };
