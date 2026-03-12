import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseReceiptImage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get("image") as File | null;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/heic"];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: "Unsupported image format. Use JPEG, PNG, or HEIC." },
        { status: 400 }
      );
    }

    // Validate file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (image.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const fileExt = image.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, image);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName);

    // Prepare for Gemini
    const buffer = await image.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    try {
      const parseResult = await parseReceiptImage(base64, image.type);

      return NextResponse.json({
        ...parseResult,
        receipt_image_url: publicUrl,
      });
    } catch (geminiError) {
      const message = geminiError instanceof Error ? geminiError.message : String(geminiError);
      
      if (message === "NOT_A_RECEIPT") {
        return NextResponse.json(
          { error: "Image could not be parsed as a receipt" },
          { status: 422 }
        );
      }
      if (message === "RATE_LIMIT_HIT") {
        return NextResponse.json(
          { error: "Gemini rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      
      console.error("Gemini parse error:", geminiError);
      return NextResponse.json(
        { error: "Failed to parse receipt items" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Receipt parse endpoint error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
