-- Add subscription fields to developers table
ALTER TABLE developers 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT CHECK (subscription_plan IN ('trial', 'starter', 'professional')),
ADD COLUMN IF NOT EXISTS subscription_billing_period TEXT CHECK (subscription_billing_period IN ('monthly', 'yearly'));

-- Add payment tracking fields to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS plan_type TEXT CHECK (plan_type IN ('starter', 'professional')),
ADD COLUMN IF NOT EXISTS billing_period TEXT CHECK (billing_period IN ('monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS przelewy24_token TEXT,
ADD COLUMN IF NOT EXISTS przelewy24_order_id TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update status check constraint for payments
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'initialized', 'completed', 'failed', 'cancelled'));

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments(przelewy24_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_plan_type ON payments(plan_type);
CREATE INDEX IF NOT EXISTS idx_developers_subscription_status ON developers(subscription_status);
CREATE INDEX IF NOT EXISTS idx_developers_subscription_plan ON developers(subscription_plan);