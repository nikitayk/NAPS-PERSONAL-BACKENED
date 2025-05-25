const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Make sure your .env has STRIPE_SECRET_KEY

/**
 * Create a Stripe Payment Intent and return client secret
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount provided" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd", // Adjust currency if needed
      payment_method_types: ["card"],
      description: "NAPS Finance premium payment",
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
 
const stripeService = require("../services/stripeService");

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await stripeService.createPaymentIntent(amount, "usd", "NAPS Finance payment");
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Payment failed" });
  }
};
