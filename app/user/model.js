const mongoose = require('mongoose');
const { model, Schema } = mongoose;
const bcrypt = require('bcrypt');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const HASH_ROUND = 10;

let userSchema = new Schema(
  {
    full_name: {
      type: String,
      required: [true, 'Nama harus diisi'],
      maxlength: [255, 'Panjang nama harus antara 3 - 255 karakter'],
      minlength: [3, 'Panjang nama harus antara 3 - 255 karakter'],
    },

    customer_id: {
      type: Number,
    },

    email: {
      type: String,
      required: [true, 'Email harus diisi'],
      maxlength: [255, 'Panjang email maksimal 255 karakter'],
      unique: true, // Tambahkan agar MongoDB langsung menangani email duplikat
      lowercase: true, // Normalisasi email
    },

    password: {
      type: String,
      required: [true, 'Password harus diisi'],
      maxlength: [255, 'Panjang password maksimal 255 karakter'],
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    token: [String],
  },
  { timestamps: true }
);

// Validasi format email
userSchema.path('email').validate(
  function (value) {
    const EMAIL_RE = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return EMAIL_RE.test(value);
  },
  (attr) => `${attr.value} harus merupakan email yang valid!`
);

// Pastikan email unik di database
userSchema.path('email').validate(
  async function (value) {
    try {
      const count = await this.model('User').countDocuments({ email: value });
      return count === 0;
    } catch (err) {
      throw err;
    }
  },
  (attr) => `${attr.value} sudah terdaftar`
);

// Hash password sebelum menyimpan
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Cegah hashing ulang saat update

  try {
    this.password = await bcrypt.hash(this.password, HASH_ROUND);
    next();
  } catch (error) {
    next(error);
  }
});

// Auto-increment untuk customer_id
userSchema.plugin(AutoIncrement, { inc_field: 'customer_id' });

module.exports = model('User', userSchema);
