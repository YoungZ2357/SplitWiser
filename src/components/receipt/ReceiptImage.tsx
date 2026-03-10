export default function ReceiptImage({ src, alt = "Uploaded receipt" }: { src: string; alt?: string }) {
    return (
        <div className="rounded-xl border border-border overflow-hidden bg-surface">
            <div className="overflow-y-auto max-h-[300px] md:max-h-[600px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt} className="w-full h-auto object-contain" data-testid="receipt-review-image" />
            </div>
        </div>
    );
}
