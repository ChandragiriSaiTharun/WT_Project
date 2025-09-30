const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Address = require('../models/Address');
const Wishlist = require('../models/Wishlist');
const Crop = require('../models/Crop');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  next();
};

// ==================== CART ROUTES ====================

// Get user's cart
router.get('/cart', requireAuth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.user.id })
      .populate({
        path: 'items.cropId',
        select: 'name description price unit seller images location'
      });
    
    if (!cart) {
      return res.json({
        success: true,
        cart: { items: [], totalItems: 0 }
      });
    }
    
    // Filter out any items where cropId is null (deleted crops)
    cart.items = cart.items.filter(item => item.cropId);
    
    const totalItems = cart.getTotalItems();
    
    res.json({
      success: true,
      cart: {
        items: cart.items,
        totalItems: totalItems,
        lastModified: cart.lastModified
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart'
    });
  }
});

// Add item to cart
router.post('/cart/add', requireAuth, async (req, res) => {
  try {
    const { cropId, quantity = 1 } = req.body;
    
    if (!cropId) {
      return res.status(400).json({
        success: false,
        error: 'Crop ID is required'
      });
    }
    
    // Check if crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        error: 'Crop not found'
      });
    }
    
    let cart = await Cart.findOne({ userId: req.session.user.id });
    
    if (!cart) {
      cart = new Cart({ userId: req.session.user.id, items: [] });
    }
    
    await cart.addItem(cropId, quantity);
    
    res.json({
      success: true,
      message: 'Item added to cart successfully',
      totalItems: cart.getTotalItems()
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart'
    });
  }
});

// Update item quantity in cart
router.put('/cart/update', requireAuth, async (req, res) => {
  try {
    const { cropId, quantity } = req.body;
    
    if (!cropId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Crop ID and quantity are required'
      });
    }
    
    const cart = await Cart.findOne({ userId: req.session.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    await cart.updateItemQuantity(cropId, quantity);
    
    res.json({
      success: true,
      message: 'Cart updated successfully',
      totalItems: cart.getTotalItems()
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart'
    });
  }
});

// Remove item from cart
router.delete('/cart/remove/:cropId', requireAuth, async (req, res) => {
  try {
    const { cropId } = req.params;
    
    const cart = await Cart.findOne({ userId: req.session.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    await cart.removeItem(cropId);
    
    res.json({
      success: true,
      message: 'Item removed from cart',
      totalItems: cart.getTotalItems()
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart'
    });
  }
});

// Clear entire cart
router.delete('/cart/clear', requireAuth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.user.id });
    
    if (cart) {
      await cart.clearCart();
    }
    
    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart'
    });
  }
});

// ==================== ADDRESS ROUTES ====================

// Get user's addresses
router.get('/addresses', requireAuth, async (req, res) => {
  try {
    const addresses = await Address.find({ 
      userId: req.session.user.id,
      isActive: true 
    }).sort({ isDefault: -1, createdAt: -1 });
    
    res.json({
      success: true,
      addresses: addresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch addresses'
    });
  }
});

// Add new address
router.post('/addresses', requireAuth, async (req, res) => {
  try {
    const addressData = {
      ...req.body,
      userId: req.session.user.id
    };
    
    const address = new Address(addressData);
    await address.save();
    
    res.json({
      success: true,
      message: 'Address added successfully',
      address: address
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add address'
    });
  }
});

// Update address
router.put('/addresses/:id', requireAuth, async (req, res) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user.id },
      req.body,
      { new: true }
    );
    
    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Address updated successfully',
      address: address
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update address'
    });
  }
});

// Delete address
router.delete('/addresses/:id', requireAuth, async (req, res) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user.id },
      { isActive: false },
      { new: true }
    );
    
    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete address'
    });
  }
});

// Set default address
router.put('/addresses/:id/default', requireAuth, async (req, res) => {
  try {
    // Remove default from all other addresses
    await Address.updateMany(
      { userId: req.session.user.id },
      { isDefault: false }
    );
    
    // Set this address as default
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user.id },
      { isDefault: true },
      { new: true }
    );
    
    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Default address updated successfully',
      address: address
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set default address'
    });
  }
});

// ==================== ORDER ROUTES ====================

// Create order (simple version for buy-now page)
router.post('/orders', requireAuth, async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, totalAmount } = req.body;
    
    if (!items || !deliveryAddress || !paymentMethod || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required order information'
      });
    }

    // Get shipping address details
    const address = await Address.findOne({
      _id: deliveryAddress,
      userId: req.session.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Shipping address not found'
      });
    }

    // Prepare order items
    const orderItems = [];
    for (const item of items) {
      const crop = await Crop.findById(item.cropId).populate('seller', 'fullName');
      if (!crop) {
        return res.status(404).json({
          success: false,
          error: `Crop with ID ${item.cropId} not found`
        });
      }

      orderItems.push({
        cropId: crop._id,
        cropName: crop.name,
        quantity: item.quantity,
        unit: crop.unit || 'kg',
        pricePerUnit: item.price,
        totalPrice: item.price * item.quantity,
        sellerId: crop.seller._id,
        sellerName: crop.seller.fullName
      });
    }

    // Create order
    const order = new Order({
      buyerId: req.session.user.id,
      buyerName: req.session.user.fullName,
      items: orderItems,
      totalAmount: totalAmount,
      shippingAddress: {
        fullName: address.fullName,
        phoneNumber: address.phoneNumber,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        pincode: address.pincode
      },
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order placed successfully',
      order: {
        _id: order._id,
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        estimatedDelivery: order.estimatedDelivery,
        paymentMethod: order.paymentMethod,
        status: order.orderStatus
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// Create order from cart
router.post('/orders/create', requireAuth, async (req, res) => {
  try {
    const { addressId, paymentMethod, directPurchase } = req.body;
    
    if (!addressId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Address and payment method are required'
      });
    }
    
    // Get shipping address
    const address = await Address.findOne({
      _id: addressId,
      userId: req.session.user.id,
      isActive: true
    });
    
    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }
    
    let orderItems = [];
    let totalAmount = 0;
    
    if (directPurchase) {
      // Direct purchase from Buy Now button
      const crop = await Crop.findById(directPurchase.cropId).populate('sellerId', 'fullName');
      if (!crop) {
        return res.status(404).json({
          success: false,
          error: 'Crop not found'
        });
      }
      
      const itemTotal = crop.price * directPurchase.quantity;
      totalAmount = itemTotal;
      
      orderItems.push({
        cropId: crop._id,
        cropName: crop.name,
        quantity: directPurchase.quantity,
        unit: crop.unit,
        pricePerUnit: crop.price,
        totalPrice: itemTotal,
        sellerId: crop.sellerId || crop._id, // Use crop ID as fallback
        sellerName: crop.sellerId ? 
          (crop.sellerId.fullName || crop.seller || 'Farm Owner') : 
          (crop.seller || 'Farm Owner')
      });
    } else {
      // Cart purchase
      const cart = await Cart.findOne({ userId: req.session.user.id })
        .populate({
          path: 'items.cropId',
          populate: {
            path: 'sellerId',
            select: 'fullName'
          }
        });
      
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cart is empty'
        });
      }
      
      // Calculate order items and total
      for (const cartItem of cart.items) {
        const crop = cartItem.cropId;
        
        const itemTotal = crop.price * cartItem.quantity;
        totalAmount += itemTotal;
        
        orderItems.push({
          cropId: crop._id,
          cropName: crop.name,
          quantity: cartItem.quantity,
          unit: crop.unit,
          pricePerUnit: crop.price,
          totalPrice: itemTotal,
          sellerId: crop.sellerId || crop._id, // Use crop ID as fallback
          sellerName: crop.sellerId ? 
            (crop.sellerId.fullName || crop.seller || 'Farm Owner') : 
            (crop.seller || 'Farm Owner')
        });
      }
    }
    
    // Generate unique order ID
    const orderId = 'KIS' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    // Create order
    const order = new Order({
      orderId: orderId,
      buyerId: req.session.user.id,
      buyerName: req.session.user.fullName,
      items: orderItems,
      totalAmount: totalAmount,
      shippingAddress: {
        fullName: address.fullName,
        phoneNumber: address.phoneNumber,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        pincode: address.pincode
      },
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed'
    });
    
    await order.save();
    
    // Clear cart only if it was a cart purchase (not direct purchase)
    if (!directPurchase) {
      const cart = await Cart.findOne({ userId: req.session.user.id });
      if (cart) {
        await cart.clearCart();
      }
    }
    
    res.json({
      success: true,
      message: 'Order placed successfully',
      order: {
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        estimatedDelivery: order.estimatedDelivery,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// Get user's orders
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.session.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// Get specific order details
router.get('/orders/:orderId', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.orderId,
      buyerId: req.session.user.id
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

// Cancel order
router.put('/orders/:orderId/cancel', requireAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findOne({
      orderId: req.params.orderId,
      buyerId: req.session.user.id
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    if (!['placed', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be cancelled at this stage'
      });
    }
    
    order.orderStatus = 'cancelled';
    order.cancellationReason = reason || 'Cancelled by user';
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      notes: reason || 'Cancelled by user'
    });
    
    await order.save();
    
    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
});

// ==================== WISHLIST ROUTES ====================

// Get user's wishlist
router.get('/wishlist', requireAuth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.session.user.id })
      .populate({
        path: 'items.cropId',
        select: 'name description price unit seller images location'
      });
    
    if (!wishlist) {
      return res.json({
        success: true,
        wishlist: { items: [], totalItems: 0 }
      });
    }
    
    // Filter out any items where cropId is null (deleted crops)
    wishlist.items = wishlist.items.filter(item => item.cropId);
    
    const totalItems = wishlist.getTotalItems();
    
    res.json({
      success: true,
      wishlist: {
        items: wishlist.items,
        totalItems: totalItems,
        lastModified: wishlist.lastModified
      }
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wishlist'
    });
  }
});

// Add item to wishlist
router.post('/wishlist/add', requireAuth, async (req, res) => {
  try {
    const { cropId } = req.body;
    
    if (!cropId) {
      return res.status(400).json({
        success: false,
        error: 'Crop ID is required'
      });
    }

    // Check if crop exists
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        error: 'Crop not found'
      });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ userId: req.session.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.session.user.id, items: [] });
    }

    // Add item to wishlist
    await wishlist.addItem(cropId);

    res.json({
      success: true,
      message: 'Item added to wishlist',
      totalItems: wishlist.getTotalItems()
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to wishlist'
    });
  }
});

// Remove item from wishlist
router.delete('/wishlist/remove/:cropId', requireAuth, async (req, res) => {
  try {
    const { cropId } = req.params;
    
    const wishlist = await Wishlist.findOne({ userId: req.session.user.id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        error: 'Wishlist not found'
      });
    }

    await wishlist.removeItem(cropId);

    res.json({
      success: true,
      message: 'Item removed from wishlist',
      totalItems: wishlist.getTotalItems()
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from wishlist'
    });
  }
});

// Clear wishlist
router.delete('/wishlist/clear', requireAuth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.session.user.id });
    if (!wishlist) {
      return res.json({
        success: true,
        message: 'Wishlist is already empty'
      });
    }

    await wishlist.clearWishlist();

    res.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear wishlist'
    });
  }
});

module.exports = router;
