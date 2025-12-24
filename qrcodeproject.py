import sys
import argparse
import qrcode
from PIL import Image

def generate_qr(
    data,
    filename,
    box_size=10,
    border=4,
    error_lvl="M",
    color="black",
    bg="white",
    logo_path=None
):
    # Map user-friendly error levels to library constants
    levels = {
        "L": qrcode.constants.ERROR_CORRECT_L,
        "M": qrcode.constants.ERROR_CORRECT_M,
        "Q": qrcode.constants.ERROR_CORRECT_Q,
        "H": qrcode.constants.ERROR_CORRECT_H
    }

    # Default to medium correction; force high if a logo is used
    ecc = levels.get(error_lvl.upper(), qrcode.constants.ERROR_CORRECT_M)
    if logo_path:
        ecc = qrcode.constants.ERROR_CORRECT_H

    # Build and render the QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=ecc,
        box_size=box_size,
        border=border
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(
        fill_color=color,
        back_color=bg
    ).convert("RGBA")

    if logo_path:
        try:
            logo = Image.open(logo_path).convert("RGBA")

            # Limit logo size to preserve scannability
            qr_w, qr_h = img.size
            max_logo_size = int(qr_w * 0.2)
            logo.thumbnail(
                (max_logo_size, max_logo_size),
                Image.Resampling.LANCZOS
            )

            # Center the logo
            l_w, l_h = logo.size
            offset = ((qr_w - l_w) // 2, (qr_h - l_h) // 2)

            img.paste(logo, offset, logo)
        except Exception as e:
            print(f"Skipping logo due to error: {e}")

    img.save(filename)
    print(f"Success! QR code saved as: {filename}")

def main():
    parser = argparse.ArgumentParser(
        description="Quick QR code generator"
    )
    parser.add_argument(
        "content",
        nargs="?",
        help="Text or URL to encode"
    )
    parser.add_argument(
        "-o",
        "--output",
        default="my_qr.png",
        help="Output filename"
    )
    parser.add_argument(
        "-l",
        "--logo",
        help="Optional logo image"
    )

    args = parser.parse_args()

    # Use direct input if provided, otherwise read from stdin
    content = args.content
    if not content:
        if not sys.stdin.isatty():
            content = sys.stdin.read().strip()
        else:
            print("Missing input. Example: python script.py 'https://google.com'")
            return

    generate_qr(content, args.output, logo_path=args.logo)

if __name__ == "__main__":
    main()
