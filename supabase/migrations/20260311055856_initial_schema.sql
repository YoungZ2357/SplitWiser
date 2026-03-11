-- Users are managed by Supabase Auth (auth.users)
-- No custom users table needed

CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  tip DECIMAL(10,2) NOT NULL DEFAULT 0,
  receipt_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_ai_parsed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE item_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_item_id UUID NOT NULL REFERENCES bill_items(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  UNIQUE(bill_item_id, participant_id)
);

-- Indexes
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX idx_participants_bill_id ON participants(bill_id);
CREATE INDEX idx_item_assignments_bill_item_id ON item_assignments(bill_item_id);
CREATE INDEX idx_item_assignments_participant_id ON item_assignments(participant_id);

-- RLS Policies
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_assignments ENABLE ROW LEVEL SECURITY;

-- Bills: owner can CRUD, anyone can read (for share page)
CREATE POLICY "Users can manage own bills" ON bills
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can read bills for sharing" ON bills
  FOR SELECT USING (true);

-- Bill items: same as bills (access through bill ownership)
CREATE POLICY "Users can manage items on own bills" ON bill_items
  FOR ALL USING (
    bill_id IN (SELECT id FROM bills WHERE user_id = auth.uid())
  );

CREATE POLICY "Public can read bill items" ON bill_items
  FOR SELECT USING (true);

-- Participants: same pattern
CREATE POLICY "Users can manage participants on own bills" ON participants
  FOR ALL USING (
    bill_id IN (SELECT id FROM bills WHERE user_id = auth.uid())
  );

CREATE POLICY "Public can read participants" ON participants
  FOR SELECT USING (true);

-- Item assignments: same pattern
CREATE POLICY "Users can manage assignments on own bills" ON item_assignments
  FOR ALL USING (
    bill_item_id IN (
      SELECT bi.id FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read assignments" ON item_assignments
  FOR SELECT USING (true);
