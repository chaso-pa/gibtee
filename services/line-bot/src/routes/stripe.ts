import express from 'express';
import { stripeSuccess, stripeCancel } from '../controllers/payment-webhook.js';

const router = express.Router();

// Stripe コールバックURL
router.get('/stripe/success', stripeSuccess);
router.get('/stripe/cancel', stripeCancel);

export default router;
