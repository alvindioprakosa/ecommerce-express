// (1) import mongoose 
const mongoose = require('mongoose');

// (2) dapatkan module model dan Schema dari package mongoose
const { model, Schema } = mongoose;

// (3) buat schema
const tagSchema = new Schema({
  name: {
    type: String,
    trim: true,
    minlength: [3, 'Panjang nama kategori minimal 3 karakter'],
    maxlength: [20, 'Panjang nama kategori maksimal 20 karakter'],
    required: [true, 'Nama kategori harus diisi'],
    unique: true
  }
}, { timestamps: true });

// (4) Middleware untuk menangani duplicate key error
tagSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Nama kategori sudah digunakan, silakan pilih nama lain.'));
  } else {
    next(error);
  }
});

// (5) buat model berdasarkan schema sekaligus export
module.exports = model('Tag', tagSchema);
