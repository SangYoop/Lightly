-- ============================================
-- Add Payment Fields to Orders Table
-- ============================================

-- Add payment_status column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Add payment_key column (Toss Payments paymentKey)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_key VARCHAR(255);

-- Add payment_method column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Add payment_amount column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_amount INTEGER DEFAULT 9900;

-- Add index for payment_status
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Add index for payment_key
CREATE INDEX IF NOT EXISTS idx_orders_payment_key ON orders(payment_key);

-- Comment on columns
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, paid, failed, cancelled';
COMMENT ON COLUMN orders.payment_key IS 'Toss Payments paymentKey for transaction tracking';
COMMENT ON COLUMN orders.payment_method IS 'Payment method used: card, transfer, etc';
COMMENT ON COLUMN orders.payment_amount IS 'Payment amount in KRW';
