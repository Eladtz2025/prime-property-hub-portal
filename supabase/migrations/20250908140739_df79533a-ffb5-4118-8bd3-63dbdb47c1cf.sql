-- Insert sample properties
INSERT INTO public.properties (id, address, city, property_size, floor, rooms, status, contact_status, acquisition_cost, current_market_value, notes) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'רחוב הרצל 15', 'תל אביב', 85, 3, 3, 'occupied', 'called_answered', 850000, 1200000, 'דירת 3 חדרים מרווחת במרכז העיר'),
('550e8400-e29b-41d4-a716-446655440002', 'שדרות רוטשילד 42', 'תל אביב', 120, 5, 4, 'vacant', 'not_contacted', 1200000, 1800000, 'דירת פנטהאוז עם מרפסת גדולה'),
('550e8400-e29b-41d4-a716-446655440003', 'רחוב דיזנגוף 88', 'תל אביב', 75, 2, 2.5, 'occupied', 'called_answered', 750000, 1100000, 'דירה מודרנית קרוב לים'),
('550e8400-e29b-41d4-a716-446655440004', 'רחוב בן יהודה 25', 'ירושלים', 95, 1, 3, 'maintenance', 'needs_callback', 650000, 950000, 'דירה הזקוקה לשיפוצים קלים'),
('550e8400-e29b-41d4-a716-446655440005', 'רחוב אחד העם 18', 'חיפה', 110, 4, 4, 'occupied', 'called_answered', 550000, 750000, 'דירה עם נוף לים מהמרפסת')
ON CONFLICT (id) DO NOTHING;

-- Insert sample tenants
INSERT INTO public.tenants (id, property_id, name, phone, email, lease_start_date, lease_end_date, monthly_rent, deposit_amount, is_active) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'דוד כהן', '052-1234567', 'david.cohen@email.com', '2024-01-01', '2025-01-01', 6500, 13000, true),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'שרה לוי', '054-9876543', 'sara.levi@email.com', '2024-03-01', '2025-03-01', 7200, 14400, true),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'מיכאל שמש', '050-5555555', 'michael.shemesh@email.com', '2023-12-01', '2024-12-01', 4800, 9600, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample financial records (income)
INSERT INTO public.financial_records (id, property_id, type, category, amount, description, transaction_date, created_by) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'income', 'rent', 6500, 'שכר דירה חודש ינואר 2024', '2024-01-01', 'cf92899a-e626-461a-bbee-a9ad49719e30'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'income', 'rent', 6500, 'שכר דירה חודש פברואר 2024', '2024-02-01', 'cf92899a-e626-461a-bbee-a9ad49719e30'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'income', 'rent', 7200, 'שכר דירה חודש מרץ 2024', '2024-03-01', 'cf92899a-e626-461a-bbee-a9ad49719e30'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 'income', 'rent', 4800, 'שכר דירה חודש דצמבר 2023', '2023-12-01', 'cf92899a-e626-461a-bbee-a9ad49719e30')
ON CONFLICT (id) DO NOTHING;

-- Insert sample financial records (expenses)  
INSERT INTO public.financial_records (id, property_id, type, category, amount, description, transaction_date, created_by) VALUES
('770e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'expense', 'maintenance', 850, 'תיקון ברז במטבח', '2024-01-15', 'cf92899a-e626-461a-bbee-a9ad49719e30'),
('770e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'expense', 'utilities', 320, 'חשמל וגז', '2024-01-20', 'cf92899a-e626-461a-bbee-a9ad49719e30'),
('770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440004', 'expense', 'maintenance', 2500, 'צביעת הדירה', '2024-02-01', 'cf92899a-e626-461a-bbee-a9ad49719e30'),
('770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', 'expense', 'insurance', 1200, 'ביטוח דירה שנתי', '2024-02-15', 'cf92899a-e626-461a-bbee-a9ad49719e30')
ON CONFLICT (id) DO NOTHING;

-- Insert sample rent payments (fixed payment_date issue)
INSERT INTO public.rent_payments (id, property_id, tenant_id, amount, due_date, payment_date, status, payment_method, created_by) VALUES
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 6500, '2024-01-01', '2024-01-01', 'paid', 'bank_transfer', 'cf92899a-e626-461a-bbee-a9ad49719e30'),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 6500, '2024-02-01', '2024-02-03', 'paid', 'cash', 'cf92899a-e626-461a-bbee-a9ad49719e30'),
('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 7200, '2024-03-01', '2024-02-28', 'paid', 'bank_transfer', 'cf92899a-e626-461a-bbee-a9ad49719e30'),
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440003', 4800, '2024-01-01', '2024-01-05', 'overdue', 'bank_transfer', 'cf92899a-e626-461a-bbee-a9ad49719e30')
ON CONFLICT (id) DO NOTHING;

-- Assign properties to the super admin for demonstration
INSERT INTO public.property_owners (property_id, owner_id, ownership_percentage) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'cf92899a-e626-461a-bbee-a9ad49719e30', 100),
('550e8400-e29b-41d4-a716-446655440002', 'cf92899a-e626-461a-bbee-a9ad49719e30', 100),
('550e8400-e29b-41d4-a716-446655440003', 'cf92899a-e626-461a-bbee-a9ad49719e30', 100),
('550e8400-e29b-41d4-a716-446655440004', 'cf92899a-e626-461a-bbee-a9ad49719e30', 100),
('550e8400-e29b-41d4-a716-446655440005', 'cf92899a-e626-461a-bbee-a9ad49719e30', 100)
ON CONFLICT (property_id, owner_id) DO NOTHING;

-- Insert sample notifications
INSERT INTO public.notifications (id, recipient_id, property_id, type, title, message, priority) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'cf92899a-e626-461a-bbee-a9ad49719e30', '550e8400-e29b-41d4-a716-446655440001', 'rent_due', 'תזכורת תשלום שכירות', 'שכירות לחודש מרץ טרם שולמה', 'medium'),
('990e8400-e29b-41d4-a716-446655440002', 'cf92899a-e626-461a-bbee-a9ad49719e30', '550e8400-e29b-41d4-a716-446655440004', 'maintenance', 'דרושה תחזוקה', 'הדירה ברחוב בן יהודה זקוקה לתחזוקה', 'high'),
('990e8400-e29b-41d4-a716-446655440003', 'cf92899a-e626-461a-bbee-a9ad49719e30', '550e8400-e29b-41d4-a716-446655440002', 'lease_expiry', 'תוקף חוזה פוקע', 'חוזה השכירות פוקע בקרוב', 'urgent')
ON CONFLICT (id) DO NOTHING;