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
  - rasterizes each page to a single JPEG so viewers decode one image
    instead of stroking every vector path and Type3 glyph again
  - keeps an invisible text layer so search, copy and screen readers still work
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
    compress_streams=True,
    object_stream_mode=pikepdf.ObjectStreamMode.generate,
)
pdf.close()
tmp.replace(dst)

# One JPEG per page, invisible text on top for search and copy. This is what
# makes the viewer cheap: it decodes a single image per page instead of
# stroking every Canva path and Type3 glyph on load.
helv = pymupdf.Font("helv")
flat = pikepdf.new()
with pymupdf.open(dst) as doc:
    for pg in doc:
        pix = pg.get_pixmap(dpi=TARGET_DPI, alpha=False)
        rgb = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        buf = io.BytesIO()
        rgb.save(buf, "JPEG", quality=JPEG_QUALITY + 3, optimize=True)
        img = flat.make_stream(buf.getvalue())
        img.Subtype = pikepdf.Name.Image
        img.Filter = pikepdf.Name.DCTDecode
        img.ColorSpace = pikepdf.Name.DeviceRGB
        img.BitsPerComponent = 8
        img.Width, img.Height = rgb.size
        page = pikepdf.Page(
            flat.make_indirect(
                pikepdf.Dictionary(Type=pikepdf.Name.Page, MediaBox=list(pg.mediabox))
            )
        )
        flat.pages.append(page)
        font = flat.make_indirect(
            pikepdf.Dictionary(
                Type=pikepdf.Name.Font,
                Subtype=pikepdf.Name.Type1,
                BaseFont=pikepdf.Name.Helvetica,
                Encoding=pikepdf.Name.WinAnsiEncoding,
            )
        )
        page.Resources = pikepdf.Dictionary(
            XObject=pikepdf.Dictionary(I0=img), Font=pikepdf.Dictionary(F1=font)
        )
        ops = [f"q {pg.rect.width} 0 0 {pg.rect.height} 0 0 cm /I0 Do Q".encode()]
        for w in pg.get_text("words"):
            rect, text = pymupdf.Rect(w[:4]), w[4]
            raw = (
                text.encode("cp1252", "replace")
                .replace(b"\\", b"\\\\")
                .replace(b"(", b"\\(")
                .replace(b")", b"\\)")
            )
            width = max(helv.text_length(text, fontsize=1) or 1e-4, 1e-4)
            sx, sy = rect.width / width, rect.height * 0.9
            baseline = rect.y1 - rect.height * 0.1
            ops.append(
                f"BT 3 Tr /F1 1 Tf {sx:.3f} 0 0 {sy:.3f} {rect.x0:.3f} {baseline:.3f} Tm (".encode()
                + raw
                + b") Tj ET"
            )
        page.Contents = flat.make_stream(b"\n".join(ops) + b"\n")

        annots = []
        for link in pg.get_links():
            if "uri" not in link:
                continue
            annots.append(
                flat.make_indirect(
                    pikepdf.Dictionary(
                        Type=pikepdf.Name.Annot,
                        Subtype=pikepdf.Name.Link,
                        Rect=list(pymupdf.Rect(link["from"])),
                        Border=[0, 0, 0],
                        A=pikepdf.Dictionary(S=pikepdf.Name.URI, URI=link["uri"]),
                    )
                )
            )
        if annots:
            page.Annots = pikepdf.Array(annots)

flat.save(
    tmp,
    linearize=True,
    compress_streams=True,
    object_stream_mode=pikepdf.ObjectStreamMode.generate,
)
flat.close()
tmp.replace(dst)

print(
    f"{src.name}: {before / 1e6:.1f} MB -> {dst.stat().st_size / 1e6:.1f} MB, "
    f"{len(replace)} duplicate images merged, {resized} downsampled, "
    f"{dropped} opaque masks dropped, pages rasterized at {TARGET_DPI} dpi"
)
