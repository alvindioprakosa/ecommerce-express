const mongoose = require('mongoose');
const Order = require('./model');
const OrderItem = require('../order-item/model');
const CartItem = require('../cart-item/model');
const DeliveryAddress = require('../delivery-address/model');
const { policyFor } = require('../policy');
const { subject } = require('@casl/ability');

async function store(req, res, next) {
  let policy = policyFor(req.user);

  // Check if the user has permission to create an order
  if (!policy.can('create', 'Order')) {
    return res.json({
      error: 1,
      message: `You're not allowed to perform this action`,
    });
  }

  try {
    const { delivery_fee, delivery_address } = req.body;

    // Fetch cart items for the user
    const items = await CartItem.find({ user: req.user._id }).populate('product');
    if (!items.length) {
      return res.json({
        error: 1,
        message: `Cannot create order because your cart is empty`,
      });
    }

    // Fetch delivery address
    const address = await DeliveryAddress.findOne({ _id: delivery_address });
    if (!address) {
      return res.json({
        error: 1,
        message: `Invalid delivery address`,
      });
    }

    // Create the order
    const order = new Order({
      _id: new mongoose.Types.ObjectId(),
      status: 'waiting_payment',
      delivery_fee,
      delivery_address: {
        provinsi: address.provinsi,
        kabupaten: address.kabupaten,
        kecamatan: address.kecamatan,
        kelurahan: address.kelurahan,
        detail: address.detail,
      },
      user: req.user._id,
    });

    // Prepare order items
    const orderItemsData = items.map(item => ({
      name: item.product.name,
      qty: parseInt(item.qty),
      price: parseInt(item.product.price),
      order: order._id,
      product: item.product._id,
    }));

    // Insert order items in parallel using insertMany
    const orderItems = await OrderItem.insertMany(orderItemsData);

    // Push each order item to the order's order_items array
    order.order_items.push(...orderItems);

    // Save the order
    await order.save();

    // Clear cart items
    await CartItem.deleteMany({ user: req.user._id });

    return res.json(order);
  } catch (err) {
    if (err && err.name == 'ValidationError') {
      return res.json({
        error: 1,
        message: err.message,
        fields: err.errors,
      });
    }
    next(err);
  }
}

async function index(req, res, next) {
  let policy = policyFor(req.user);

  // Check if the user has permission to view orders
  if (!policy.can('view', 'Order')) {
    return res.json({
      error: 1,
      message: `You're not allowed to perform this action`,
    });
  }

  try {
    const { limit = 10, skip = 0 } = req.query;

    // Get count of orders for the user
    const count = await Order.find({ user: req.user._id }).countDocuments();

    // Fetch orders for the user with pagination and populate order items
    const orders = await Order.find({ user: req.user._id })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('order_items')
      .sort('-createdAt');

    return res.json({
      data: orders.map(order => order.toJSON({ virtuals: true })),
      count,
    });
  } catch (err) {
    if (err && err.name == 'ValidationError') {
      return res.json({
        error: 1,
        message: err.message,
        fields: err.errors,
      });
    }
    next(err);
  }
}

module.exports = {
  store,
  index,
};
