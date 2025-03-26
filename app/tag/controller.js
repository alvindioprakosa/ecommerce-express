const Tag = require('./model');
const { policyFor } = require('../policy');

async function store(req, res, next) {
  try {
    let policy = policyFor(req.user);

    if (!policy.can('create', 'Tag')) {
      return res.status(403).json({
        error: 1,
        message: 'Anda tidak memiliki akses untuk membuat tag',
      });
    }

    let payload = req.body;
    let tag = new Tag(payload);

    await tag.save();
    return res.status(201).json(tag);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 1,
        message: err.message,
        fields: err.errors,
      });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    let policy = policyFor(req.user);

    if (!policy.can('update', 'Tag')) {
      return res.status(403).json({
        error: 1,
        message: 'Anda tidak memiliki akses untuk mengupdate tag',
      });
    }

    let payload = req.body;

    if (!Object.keys(payload).length) {
      return res.status(400).json({
        error: 1,
        message: 'Payload tidak boleh kosong',
      });
    }

    let tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({
        error: 1,
        message: 'Tag tidak ditemukan',
      });
    }

    tag = await Tag.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });

    return res.json(tag);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 1,
        message: err.message,
        fields: err.errors,
      });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({
        error: 1,
        message: 'ID tidak valid',
      });
    }

    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    let policy = policyFor(req.user);

    if (!policy.can('delete', 'Tag')) {
      return res.status(403).json({
        error: 1,
        message: 'Anda tidak memiliki akses untuk menghapus tag',
      });
    }

    let tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({
        error: 1,
        message: 'Tag tidak ditemukan',
      });
    }

    await Tag.findByIdAndDelete(req.params.id);

    return res.json({
      success: 1,
      message: 'Tag berhasil dihapus',
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({
        error: 1,
        message: 'ID tidak valid',
      });
    }

    next(err);
  }
}

module.exports = {
  store,
  update,
  destroy,
};
