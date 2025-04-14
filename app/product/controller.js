const fs = require('fs');
const path = require('path');
const Product = require('./model');
const Category = require('../category/model');
const Tag = require('../tag/model');
const config = require('../config');
const { policyFor } = require('../policy');

const resolveCategory = async (name) => {
  if (!name) return null;
  const category = await Category.findOne({ name: { $regex: name, $options: 'i' } });
  return category ? category._id : null;
};

const resolveTags = async (names) => {
  if (!Array.isArray(names) || !names.length) return [];
  const tags = await Tag.find({ name: { $in: names } });
  return tags.map(tag => tag._id);
};

const handleImageUpload = (file) => {
  return new Promise((resolve, reject) => {
    const tmp_path = file.path;
    const ext = file.originalname.split('.').pop();
    const filename = `${file.filename}.${ext}`;
    const target_path = path.resolve(config.rootPath, `public/upload/${filename}`);
    const src = fs.createReadStream(tmp_path);
    const dest = fs.createWriteStream(target_path);

    src.pipe(dest);
    src.on('end', () => resolve(filename));
    src.on('error', reject);
  });
};

const removeImage = (filename) => {
  const imagePath = path.resolve(config.rootPath, `public/upload/${filename}`);
  if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
};

async function index(req, res, next) {
  try {
    let { limit = 10, skip = 0, q = '', category = '', tags = [] } = req.query;
    let criteria = {};

    if (q) criteria.name = { $regex: q, $options: 'i' };
    if (category) {
      const cat = await Category.findOne({ name: { $regex: category, $options: 'i' } });
      if (cat) criteria.category = cat._id;
    }
    if (tags.length) {
      const tagDocs = await Tag.find({ name: { $in: tags } });
      criteria.tags = { $in: tagDocs.map(tag => tag._id) };
    }

    const count = await Product.countDocuments(criteria);
    const data = await Product.find(criteria)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('category')
      .populate('tags');

    res.json({ data, count });
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    const policy = policyFor(req.user);
    if (!policy.can('create', 'Product')) {
      return res.status(403).json({ error: 1, message: 'Tidak punya akses membuat produk' });
    }

    let payload = req.body;
    payload.category = await resolveCategory(payload.category);
    payload.tags = await resolveTags(payload.tags);

    if (req.file) {
      const filename = await handleImageUpload(req.file);
      payload.image_url = filename;
    }

    const product = new Product(payload);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 1, message: err.message, fields: err.errors });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const policy = policyFor(req.user);
    if (!policy.can('update', 'Product')) {
      return res.status(403).json({ error: 1, message: 'Tidak punya akses mengedit produk' });
    }

    let payload = req.body;
    payload.category = await resolveCategory(payload.category);
    payload.tags = await resolveTags(payload.tags);

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 1, message: 'Produk tidak ditemukan' });

    if (req.file) {
      removeImage(product.image_url);
      const filename = await handleImageUpload(req.file);
      payload.image_url = filename;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 1, message: err.message, fields: err.errors });
    }
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    const policy = policyFor(req.user);
    if (!policy.can('delete', 'Product')) {
      return res.status(403).json({ error: 1, message: 'Tidak punya akses menghapus produk' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 1, message: 'Produk tidak ditemukan' });

    removeImage(product.image_url);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

module.exports = { index, store, update, destroy };
