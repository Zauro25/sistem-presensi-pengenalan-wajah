import face_recognition
import numpy as np
from PIL import Image
from io import BytesIO
import base64
from .models import Santri

def decode_base64_image(data_url):
    """Decode base64 dataURL jadi PIL image (RGB)."""
    header, encoded = data_url.split(',', 1)
    data = base64.b64decode(encoded)
    return Image.open(BytesIO(data)).convert('RGB')


def get_all_encodings():
    """Ambil semua face_encoding santri dari DB."""
    enc_dict = {}
    for s in Santri.objects.exclude(face_encoding__isnull=True):
        try:
            enc = np.array(s.face_encoding, dtype=float)
            enc_dict[s.id] = enc
        except Exception:
            continue
    return enc_dict


def encode_face_from_image(pil_image):
    """Ambil encoding & lokasi wajah pakai model HOG (lebih ringan)."""
    img = np.array(pil_image.convert("RGB"))
    face_locations = face_recognition.face_locations(img, model='hog')
    if not face_locations:
        return None, None
    encs = face_recognition.face_encodings(img, face_locations)
    if not encs:
        return None, None
    return encs[0].tolist(), face_locations[0]


def recognize_from_image_pil(pil_image, tolerance=0.45):
    """Cocokin wajah dengan database santri dan balikin lokasi wajah."""
    img = np.array(pil_image.convert("RGB"))
    face_locations = face_recognition.face_locations(img, model='hog')

    if not face_locations:
        return None, "no_face", None

    face_encodings = face_recognition.face_encodings(img, face_locations)
    if not face_encodings:
        return None, "no_face", None

    db_encs = get_all_encodings()
    if not db_encs:
        return None, "no_dataset", None

    face_enc = face_encodings[0]
    ids = list(db_encs.keys())
    encs = np.stack([db_encs[i] for i in ids])

    matches = face_recognition.compare_faces(encs, face_enc, tolerance=tolerance)
    distances = face_recognition.face_distance(encs, face_enc)

    matched_indices = [i for i, m in enumerate(matches) if m]
    if matched_indices:
        best_idx = min(matched_indices, key=lambda i: distances[i])
        santri_pk = ids[best_idx]
        santri = Santri.objects.get(pk=santri_pk)
        loc = face_locations[0]
        return santri, float(distances[best_idx]), loc
    else:
        return None, "no_match", None
