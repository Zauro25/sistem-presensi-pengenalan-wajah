import base64
from io import BytesIO

import face_recognition
import numpy as np
from PIL import Image
from sklearn.svm import SVC

from .models import Santri

def decode_base64_image(data_url):
    try:
        if ',' in data_url:
            header, encoded = data_url.split(',', 1)
        else:
            encoded = data_url
        data = base64.b64decode(encoded)
        return Image.open(BytesIO(data)).convert('RGB')
    except Exception as e:
        print(f"Error decoding base64 image: {str(e)}")
        raise ValueError(f"Failed to decode image: {str(e)}")


def get_all_encodings():
    enc_dict = {}
    for s in Santri.objects.exclude(face_encoding__isnull=True):
        try:
            enc = np.array(s.face_encoding, dtype=float)
            enc_dict[s.id] = enc
        except Exception:
            continue
    return enc_dict


def train_svm_classifier(enc_dict):
    """Train a linear SVM (one-vs-rest) on stored encodings."""
    ids = list(enc_dict.keys())
    if len(ids) < 2:
        return None, "not_enough_classes"

    X = np.stack([enc_dict[i] for i in ids])
    y = np.array(ids)

    model = SVC(kernel="linear", probability=True)
    model.fit(X, y)
    return model, None


def predict_with_svm(model, face_enc, min_prob=0.6):
    probs = model.predict_proba([face_enc])[0]
    best_idx = int(np.argmax(probs))
    best_prob = float(probs[best_idx])
    if best_prob < min_prob:
        return None, best_prob

    best_pk = model.classes_[best_idx]
    return int(best_pk), best_prob


def encode_face_from_image(pil_image):
    img = np.array(pil_image.convert("RGB"))
    face_locations = face_recognition.face_locations(img, model='hog')
    if not face_locations:
        return None, None
    encs = face_recognition.face_encodings(img, face_locations)
    if not encs:
        return None, None
    return encs[0].tolist(), face_locations[0]


def recognize_from_image_pil(pil_image, min_prob=0.6):
    try:
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

        model, train_error = train_svm_classifier(db_encs)
        if train_error:
            return None, train_error, None

        face_enc = face_encodings[0]
        predicted_pk, prob = predict_with_svm(model, face_enc, min_prob=min_prob)
        if predicted_pk is None:
            return None, "low_confidence", None

        try:
            santri = Santri.objects.get(pk=predicted_pk)
        except Santri.DoesNotExist:
            return None, "not_found", None

        loc = face_locations[0]
        return santri, prob, loc
    except Exception as e:
        print(f"Error in recognize_from_image_pil: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, f"error: {str(e)}", None
