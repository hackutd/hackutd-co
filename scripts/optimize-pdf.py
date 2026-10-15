"""
Shrinks public/Sponsorship-Packet.pdf (or any Canva PDF export) so it opens
fast in browser PDF viewers.

Canva embeds every image at its upload resolution (up to ~3000 DPI for small
logos) with a separate alpha mask, and repeats the page background as a new
object on every page. Viewers decode each one to full-size RGBA, which is
where the memory goes. This script:

  - merges byte-identical images into one shared object
  - downsamples each image to TARGET_DPI at its largest placed size
  - drops alpha masks that are fully opaque
  - writes a linearized file so viewers can show page 1 before the rest loads

Usage:  python3 scripts/optimize-pdf.py [in.pdf] [out.pdf]   (needs: pip install pikepdf pymupdf pillow)
Defaults to optimizing public/Sponsorship-Packet.pdf in place.
"""
import hashlib
import io
import sys
import zlib
from pathlib import Path

import pikepdf
import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEFAULT = ROOT / "public/Sponsorship-Packet.pdf"

TARGET_DPI = 200
JPEG_QUALITY = 85
MIN_SHRINK = 0.9

src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT
dst = Path(sys.argv[2]) if len(sys.argv) > 2 else src

# Largest on-page size (pt) of every image, measured from where it is drawn.
placed: dict[int, tuple[float, float]] = {}
with pymupdf.open(src) as doc:
    for page in doc:
        for info in page.get_image_info(xrefs=True):
            if not info["xref"]:
                continue
            box = pymupdf.Rect(info["bbox"])
            w, h = placed.get(info["xref"], (0.0, 0.0))
            placed[info["xref"]] = (max(w, box.width), max(h, box.height))

pdf = pikepdf.open(src)
before = src.stat().st_size


def image_key(img: pikepdf.Stream) -> str:
    digest = hashlib.sha256(img.read_raw_bytes())
    if "/SMask" in img:
        digest.update(img.SMask.read_raw_bytes())
    return digest.hexdigest()


images = [
    o
    for o in pdf.objects
    if isinstance(o, pikepdf.Stream) and o.get("/Subtype") == "/Image"
]
masks = {img.SMask.objgen for img in images if "/SMask" in img}
images = [img for img in images if img.objgen not in masks]

canonical: dict[str, pikepdf.Stream] = {}
replace: dict[tuple[int, int], pikepdf.Stream] = {}
for img in images:
    keep = canonical.setdefault(image_key(img), img)
    if keep is not img:
        replace[img.objgen] = keep
        a = placed.get(keep.objgen[0], (0.0, 0.0))
        b = placed.get(img.objgen[0], (0.0, 0.0))
        placed[keep.objgen[0]] = (max(a[0], b[0]), max(a[1], b[1]))

visited: set[tuple[int, int]] = set()


def relink(obj) -> None:
    if isinstance(obj, (pikepdf.Dictionary, pikepdf.Stream)):
        if obj.is_indirect:
            if obj.objgen in visited:
                return
            visited.add(obj.objgen)
        xobjects = obj.get("/XObject")
        if isinstance(xobjects, pikepdf.Dictionary):
            for name, x in list(xobjects.items()):
                if x.is_indirect and x.objgen in replace:
                    xobjects[name] = replace[x.objgen]
        for _, value in obj.items():
            relink(value)
    elif isinstance(obj, pikepdf.Array):
        for value in obj:
            relink(value)


relink(pdf.Root)


def is_jpeg(stream: pikepdf.Stream) -> bool:
    return stream.get("/Filter") in (pikepdf.Name.DCTDecode, pikepdf.Array([pikepdf.Name.DCTDecode]))


def read_mask(mask: pikepdf.Stream) -> Image.Image:
    if mask.get("/BitsPerComponent") != 8 or mask.get("/Decode") is not None:
        raise ValueError(f"unsupported mask {mask.objgen}")
    if is_jpeg(mask):
        return Image.open(io.BytesIO(mask.read_raw_bytes())).convert("L")
    return Image.frombytes("L", (int(mask.Width), int(mask.Height)), mask.read_bytes())


def write_mask(img: pikepdf.Stream, alpha: Image.Image) -> None:
    if alpha.getextrema()[0] == 255:
        del img["/SMask"]
        return
    mask = pdf.make_stream(zlib.compress(alpha.tobytes(), 9))
    mask.Type = pikepdf.Name.XObject
    mask.Subtype = pikepdf.Name.Image
    mask.Width, mask.Height = alpha.size
    mask.ColorSpace = pikepdf.Name.DeviceGray
    mask.BitsPerComponent = 8
    mask.Filter = pikepdf.Name.FlateDecode
    img.SMask = mask


resized = dropped = 0
for img in canonical.values():
    if img.objgen[0] not in placed:
        continue
    w, h = int(img.Width), int(img.Height)
    box_w, box_h = placed[img.objgen[0]]
    scale = min(1.0, max(box_w / 72 * TARGET_DPI / w, box_h / 72 * TARGET_DPI / h))
    size = (max(1, round(w * scale)), max(1, round(h * scale)))
    shrink = scale < MIN_SHRINK
    alpha = read_mask(img.SMask) if "/SMask" in img else None

    if shrink:
        if not is_jpeg(img):
            raise ValueError(f"unsupported image filter {img.objgen}: {img.get('/Filter')}")
        rgb = Image.open(io.BytesIO(img.read_raw_bytes()))
        if rgb.mode != "RGB":
            raise ValueError(f"unsupported JPEG mode {img.objgen}: {rgb.mode}")
        out = io.BytesIO()
        rgb.resize(size, Image.LANCZOS).save(out, "JPEG", quality=JPEG_QUALITY, optimize=True)
        img.write(out.getvalue(), filter=pikepdf.Name.DCTDecode)
        img.Width, img.Height = size
        resized += 1
        if alpha is not None:
            alpha = alpha.resize(size, Image.LANCZOS)

    if alpha is not None and (shrink or alpha.getextrema()[0] == 255):
        write_mask(img, alpha)
        dropped += "/SMask" not in img

pdf.remove_unreferenced_resources()
tmp = dst.with_suffix(".tmp.pdf")
pdf.save(
    tmp,
    linearize=True,
    compress_streams=True,
    object_stream_mode=pikepdf.ObjectStreamMode.generate,
)
pdf.close()
tmp.replace(dst)

print(
    f"{src.name}: {before / 1e6:.1f} MB -> {dst.stat().st_size / 1e6:.1f} MB, "
    f"{len(replace)} duplicate images merged, {resized} downsampled, {dropped} opaque masks dropped"
)
