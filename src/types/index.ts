// ---- Database row types ----

export interface Bill {
  id: string;
  user_id: string;
  title: string;
  date: string; // ISO date string
  tax: number;
  tip: number;
  receipt_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  name: string;
  price: number;
  is_ai_parsed: boolean;
  created_at: string;
}

export interface Participant {
  id: string;
  bill_id: string;
  name: string;
  created_at: string;
}

export interface ItemAssignment {
  id: string;
  bill_item_id: string;
  participant_id: string;
}

// ---- API request/response types ----

export interface CreateBillRequest {
  title: string;
  date: string;
  tax: number;
  tip: number;
  items: CreateBillItemInput[];
  participants: CreateParticipantInput[];
  assignments: CreateAssignmentInput[];
}

export interface CreateBillItemInput {
  name: string;
  price: number;
  is_ai_parsed?: boolean;
}

export interface CreateParticipantInput {
  name: string;
}

export interface CreateAssignmentInput {
  item_index: number;       // index into the items array
  participant_index: number; // index into the participants array
}

export interface BillDetail {
  bill: Bill;
  items: BillItem[];
  participants: Participant[];
  assignments: ItemAssignment[];
  split: SplitResult;
}

export interface UpdateBillRequest {
  title?: string;
  date?: string;
  tax?: number;
  tip?: number;
  items?: CreateBillItemInput[];
  participants?: CreateParticipantInput[];
  assignments?: CreateAssignmentInput[];
}

// ---- Receipt parsing types ----

export interface ParseReceiptResponse {
  items: ParsedReceiptItem[];
  receipt_image_url?: string;
  raw_text?: string;
}

export interface ParsedReceiptItem {
  name: string;
  price: number;
  confidence: "high" | "medium" | "low";
}

// ---- Split engine types ----

export interface SplitInput {
  items: {
    id: string;
    name: string;
    price: number;
    assigned_to: string[]; // participant IDs. Empty = shared by all.
  }[];
  participants: {
    id: string;
    name: string;
  }[];
  tax: number;
  tip: number;
}

export interface SplitResult {
  per_person: PersonSplit[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}

export interface PersonSplit {
  participant_id: string;
  participant_name: string;
  items_subtotal: number;  // sum of their assigned items
  tax_share: number;       // proportional tax
  tip_share: number;       // proportional tip
  total: number;           // items_subtotal + tax_share + tip_share
}

// ---- Share endpoint types ----

export interface ShareItemDetail {
  name: string;
  price: number;
  shared_with: number;
}

export interface SharePersonSplit extends PersonSplit {
  items: ShareItemDetail[];
}

export interface ShareResponse {
  title: string;
  date: string;
  split: {
    per_person: SharePersonSplit[];
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
  };
}
