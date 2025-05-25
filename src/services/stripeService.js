const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Payment Intent
 * @param {number} amount - Amount in cents
 * @param {string} currency - Currency code, e.g., "usd"
 * @param {string} description - Payment description
 * @returns {Promise<Object>} - PaymentIntent object
 */
async function createPaymentIntent(amount, currency = "usd", description = "") {
  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    payment_method_types: ["card"],
    description,
  });
  return paymentIntent;
}

/**
 * Retrieve a Payment Intent by ID
 * @param {string} paymentIntentId
 * @returns {Promise<Object>} - PaymentIntent object
 */
async function retrievePaymentIntent(paymentIntentId) {
  if (!paymentIntentId) {
    throw new Error("PaymentIntent ID is required");
  }
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

/**
 * Capture a Payment Intent (for manual capture)
 * @param {string} paymentIntentId
 * @returns {Promise<Object>}
 */
async function capturePaymentIntent(paymentIntentId) {
  if (!paymentIntentId) {
    throw new Error("PaymentIntent ID is required");
  }
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
}

module.exports = {
  createPaymentIntent,
  retrievePaymentIntent,
  capturePaymentIntent,
};
