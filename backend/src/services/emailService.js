const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Get verified email from environment (for Resend test mode)
const VERIFIED_EMAIL = process.env.RESEND_VERIFIED_EMAIL || 'nduatijeremy7@gmail.com';
// Use verified domain email (same as fashion-fit project) - allows sending to any recipient
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ShopStar <hello@modenova.co.ke>';

/**
 * Check if we're in Resend test mode and handle email redirect for unverified recipients
 */
const getRecipientEmail = (targetEmail) => {
  // If using test mode (onboarding@resend.dev), check if we need to redirect
  const isTestMode = FROM_EMAIL.includes('onboarding@resend.dev');
  
  // If using verified domain (like modenova.co.ke), we can send to any recipient
  const isVerifiedDomain = FROM_EMAIL.includes('modenova.co.ke');
  
  if (isTestMode && targetEmail !== VERIFIED_EMAIL) {
    console.log(`⚠️ Resend Test Mode: Redirecting email from ${targetEmail} to ${VERIFIED_EMAIL}`);
    console.log(`📝 Original recipient was: ${targetEmail}`);
    return VERIFIED_EMAIL;
  }
  
  // With verified domain, send directly to target email
  if (isVerifiedDomain) {
    console.log(`✅ Using verified domain - sending directly to ${targetEmail}`);
  }
  
  return targetEmail;
};

/**
 * Send order confirmation email to customer
 */
const sendOrderConfirmation = async (order, user) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('📧 Email service not configured. Skipping email send.');
    return { success: false, reason: 'RESEND_API_KEY not configured' };
  }

  console.log(`📧 Attempting to send order confirmation email to: ${user.email}`);

  try {
    // In test mode, redirect to verified email if needed
    const recipientEmail = getRecipientEmail(user.email);
    const isRedirected = recipientEmail !== user.email;
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipientEmail],
      subject: `ShopStar - Order Confirmation ${order.orderNumber}`,
      replyTo: 'hello@modenova.co.ke',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0;">Order Confirmed! 🎉</h1>
            <p style="color: white; margin: 10px 0 0 0;">Order #${order.orderNumber}</p>
          </div>
          
          <div style="padding: 20px;">
            ${isRedirected ? `
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Test Mode:</strong> This email was redirected to your verified address. 
                  Original recipient: <strong>${user.email}</strong>
                </p>
              </div>
            ` : ''}
            <h2 style="color: #333;">Thank you for your order, ${user.name}!</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Order Details</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Payment:</strong> ${order.paymentStatus === 'paid' ? 'Paid ✅' : 'Pending'}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Items Ordered</h3>
              ${order.items.map(item => `
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
                  <p style="margin: 5px 0;"><strong>${item.name}</strong></p>
                  <p style="margin: 5px 0; color: #666;">Quantity: ${item.quantity}</p>
                  <p style="margin: 5px 0; color: #666;">Price: $${item.price}</p>
                </div>
              `).join('')}
            </div>
            
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Shipping Address</h3>
              <p>${order.shippingAddress.street}</p>
              <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
              <p>${order.shippingAddress.country}</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Order Summary</h3>
              <p>Subtotal: $${order.subtotal.toFixed(2)}</p>
              <p>Tax: $${order.tax.toFixed(2)}</p>
              <p>Shipping: $${order.shipping.toFixed(2)}</p>
              <p style="font-size: 18px; font-weight: bold; margin-top: 10px;">Total: $${order.total.toFixed(2)}</p>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              We'll send you another email when your order ships!
            </p>
            
            <p style="color: #666; line-height: 1.6;">
              Thank you for shopping with us!<br>
              The ShopStar Team ⭐
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend API Error:', JSON.stringify(error, null, 2));
      console.error(`❌ Failed to send email to ${user.email}:`, error.message || error);
      return { success: false, error };
    }

    if (data) {
      if (recipientEmail !== user.email) {
        console.log(`✅ Order confirmation email sent to ${recipientEmail} (redirected from ${user.email})`);
      } else {
        console.log(`✅ Order confirmation email sent successfully to ${user.email}`);
      }
      console.log(`📧 Email ID: ${data.id}`);
      return { success: true, data, redirected: recipientEmail !== user.email };
    } else {
      console.warn(`⚠️ No data returned from Resend for ${user.email}`);
      return { success: false, reason: 'No data returned' };
    }
  } catch (error) {
    console.error(`❌ Exception while sending email to ${user.email}:`, error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { success: false, error: error.message };
  }
};

/**
 * Send order status update email
 */
const sendOrderStatusUpdate = async (order, user, newStatus) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('📧 Email service not configured. Skipping email send.');
    return { success: false, reason: 'RESEND_API_KEY not configured' };
  }

  console.log(`📧 Attempting to send order status update email to: ${user.email}`);

  try {
    const statusMessages = {
      processing: 'Your order is being processed!',
      shipped: 'Your order has shipped! 🚚',
      delivered: 'Your order has been delivered! 📦',
      cancelled: 'Your order has been cancelled'
    };

    // In test mode, redirect to verified email if needed
    const recipientEmail = getRecipientEmail(user.email);
    const isRedirected = recipientEmail !== user.email;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipientEmail],
      subject: `ShopStar - Order Update ${order.orderNumber}`,
      replyTo: 'hello@modenova.co.ke',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0;">${statusMessages[newStatus] || 'Order Update'}</h1>
            <p style="color: white; margin: 10px 0 0 0;">Order #${order.orderNumber}</p>
          </div>
          
          <div style="padding: 20px;">
            ${isRedirected ? `
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>⚠️ Test Mode:</strong> This email was redirected to your verified address. 
                  Original recipient: <strong>${user.email}</strong>
                </p>
              </div>
            ` : ''}
            <h2 style="color: #333;">Hi ${user.name},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Your order status has been updated to: <strong>${newStatus}</strong>
            </p>
            
            ${order.trackingNumber ? `
              <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Tracking Information</h3>
                <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
              </div>
            ` : ''}
            
            <p style="color: #666; line-height: 1.6;">
              Thank you for your patience!<br>
              The ShopStar Team ⭐
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend API Error:', JSON.stringify(error, null, 2));
      console.error(`❌ Failed to send status update email to ${user.email}:`, error.message || error);
      return { success: false, error };
    }

    if (data) {
      if (recipientEmail !== user.email) {
        console.log(`✅ Order status update email sent to ${recipientEmail} (redirected from ${user.email})`);
      } else {
        console.log(`✅ Order status update email sent successfully to ${user.email}`);
      }
      console.log(`📧 Email ID: ${data.id}`);
      return { success: true, data, redirected: recipientEmail !== user.email };
    } else {
      console.warn(`⚠️ No data returned from Resend for ${user.email}`);
      return { success: false, reason: 'No data returned' };
    }
  } catch (error) {
    console.error(`❌ Exception while sending status update email to ${user.email}:`, error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOrderConfirmation,
  sendOrderStatusUpdate
};

