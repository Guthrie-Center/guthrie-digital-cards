"""Rebuild and decode-check employee QR assets.

Dependencies: Pillow, qrcode==8.2, zxing-cpp==3.1.1
Run from any directory: python scripts/generate_qr.py
"""
import json
from pathlib import Path

import qrcode
import zxingcpp
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = 'https://guthrie-center.github.io/guthrie-digital-cards/#/'
source = (ROOT / 'contacts.js').read_text()
contacts = json.loads(source.split('=', 1)[1].strip().rstrip(';'))

for contact in contacts:
    url = BASE_URL + contact['slug']
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,
                       box_size=16, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    # Explicit opaque colors: white/transparent modules disappear on the modal.
    image = qr.make_image(fill_color='black', back_color='white').convert('RGB')
    for size in (image.width, 330, 240):
        preview = image.resize((size, size), Image.Resampling.LANCZOS)
        result = zxingcpp.read_barcode(preview)
        assert result and result.text == url, f"Unreadable QR: {contact['slug']} at {size}px"
    image.save(ROOT / 'assets' / 'qr' / (contact['slug'] + '.png'))

print(f'Generated and decoded {len(contacts)} QR codes at native, desktop, and mobile sizes.')
