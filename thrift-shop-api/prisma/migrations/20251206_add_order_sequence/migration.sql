-- Migration: Add order number sequence for atomic generation
-- This sequence ensures no race conditions when generating order numbers

-- Create sequence for order numbers (one per year approach)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;

-- Create a function to get the next order number
CREATE OR REPLACE FUNCTION get_next_order_number()
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER;
    seq_value BIGINT;
    order_num TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Get next value from sequence
    SELECT nextval('order_number_seq') INTO seq_value;
    
    -- Format: TS-YYYY-NNNNN
    order_num := 'TS-' || current_year || '-' || LPAD(seq_value::TEXT, 5, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a trigger to auto-generate order numbers
-- This is commented out as we'll use the service to call the function
-- CREATE OR REPLACE FUNCTION set_order_number()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF NEW.order_number IS NULL THEN
--         NEW.order_number := get_next_order_number();
--     END IF;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER orders_order_number_trigger
-- BEFORE INSERT ON orders
-- FOR EACH ROW
-- EXECUTE FUNCTION set_order_number();

-- Reset sequence at the start of each year (optional cron job)
-- You can schedule this: SELECT setval('order_number_seq', 1, false);
