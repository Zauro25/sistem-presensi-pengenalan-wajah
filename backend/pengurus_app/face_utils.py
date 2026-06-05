import base64
from io import BytesIO
import numpy as np
from PIL import Image
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from skimage.feature import hog
import cv2
import os
import joblib
from django.conf import settings
from .models import Santri

MODEL_FILE = os.path.join(settings.MEDIA_ROOT, 'face_model.joblib')


_MODEL_CACHE = {
    "model": None,
    "scaler": None,
    "samples": None,
    "labels": None,
    "profiles": None,
}


def normalize_vector(vec):
    arr = np.array(vec, dtype=float)
    norm = float(np.linalg.norm(arr))
    if norm <= 1e-12:
        return arr
    return arr / norm


def merge_encodings(encodings):
    if not encodings:
        return None
    arr = np.array([normalize_vector(e) for e in encodings], dtype=float)
    mean_vec = np.mean(arr, axis=0)
    return normalize_vector(mean_vec).tolist()


def invalidate_face_model_cache():
    _MODEL_CACHE["model"] = None
    _MODEL_CACHE["scaler"] = None
    _MODEL_CACHE["samples"] = None
    _MODEL_CACHE["labels"] = None
    _MODEL_CACHE["profiles"] = None
    try:
        if os.path.exists(MODEL_FILE):
            os.remove(MODEL_FILE)
    except Exception:
        pass


def _build_cascade_candidates():
    bases = []
    data_dir = getattr(cv2, "data", None)
    if data_dir and getattr(data_dir, "haarcascades", None):
        bases.append(data_dir.haarcascades)
    bases.extend([
        "/usr/share/opencv4/haarcascades/",
        "/usr/local/share/opencv4/haarcascades/",
        "/opt/homebrew/opt/opencv/share/opencv4/haarcascades/",
    ])

    filenames = [
        "haarcascade_frontalface_default.xml",
        "haarcascade_frontalface_alt2.xml",
        "haarcascade_profileface.xml",
    ]

    candidates = []
    for base in bases:
        for name in filenames:
            candidates.append(os.path.join(base, name))
    return candidates


def _load_face_cascades():
    cascades = []
    for candidate in _build_cascade_candidates():
        if not os.path.exists(candidate):
            continue
        cascade = cv2.CascadeClassifier(candidate)
        if cascade is not None and not cascade.empty():
            cascades.append(cascade)
    return cascades


FACE_CASCADES = _load_face_cascades()


def _to_location(x, y, w, h):
    return (int(y), int(x + w), int(y + h), int(x))


def _detect_with_cascade(img_gray):
    if not FACE_CASCADES:
        return None

    found = []
    for cascade in FACE_CASCADES:
        faces = cascade.detectMultiScale(
            img_gray,
            scaleFactor=1.05,
            minNeighbors=3,
            minSize=(28, 28),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )
        if len(faces) == 0:
            continue

        for x, y, w, h in faces:
            found.append((int(x), int(y), int(w), int(h)))

    if not found:
        return []

    # Deduplicate near-identical rectangles and keep larger faces first.
    found.sort(key=lambda r: r[2] * r[3], reverse=True)
    deduped = []
    for rect in found:
        x, y, w, h = rect
        cx = x + (w // 2)
        cy = y + (h // 2)
        keep = True
        for ex, ey, ew, eh in deduped:
            ecx = ex + (ew // 2)
            ecy = ey + (eh // 2)
            if abs(cx - ecx) < 24 and abs(cy - ecy) < 24:
                keep = False
                break
        if keep:
            deduped.append(rect)

    return [_to_location(*r) for r in deduped[:6]]


def detect_face_locations_robust(img_rgb):
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    gray_eq = cv2.equalizeHist(gray)

    trial_images = [
        (gray, 1.0),
        (gray_eq, 1.0),
    ]

    if img_rgb.shape[1] < 1000:
        gray_big = cv2.resize(gray_eq, None, fx=1.4, fy=1.4, interpolation=cv2.INTER_LINEAR)
        trial_images.append((gray_big, 1.4))

    for trial_gray, scale in trial_images:
        locations = _detect_with_cascade(trial_gray)
        if locations is None:
            return None
        if not locations:
            continue

        if scale == 1.0:
            return locations

        inv = 1.0 / scale
        remapped = []
        for top, right, bottom, left in locations:
            remapped.append((
                int(top * inv),
                int(right * inv),
                int(bottom * inv),
                int(left * inv),
            ))
        return remapped

    return []

def decode_base64_image(data_url):
    try:
        if ',' in data_url:
            header, encoded = data_url.split(',', 1)
        else:
            encoded = data_url
        data = base64.b64decode(encoded)
        return Image.open(BytesIO(data)).convert('RGB')
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")

def get_all_training_samples():
    samples = []
    labels = []
    for s in Santri.objects.filter(user__is_active=True).exclude(face_encoding__isnull=True):
        try:
            raw = s.face_encoding
            if isinstance(raw, list) and len(raw) > 0 and isinstance(raw[0], list):
                candidate_vectors = raw
            else:
                candidate_vectors = [raw]

            for vec in candidate_vectors:
                enc = normalize_vector(vec)
                samples.append(enc)
                labels.append(s.id)
        except Exception:
            continue
    return samples, labels

def train_svm_classifier(samples, labels):
    class_ids = sorted(set(labels))
    if len(class_ids) < 2:
        return None, "not_enough_classes"
    X = np.stack(samples)
    y = np.array(labels)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    model = SVC(kernel="rbf", C=10.0, gamma="scale", class_weight="balanced", probability=True)
    model.fit(X_scaled, y)
    return (model, scaler), None


def build_class_profiles(samples, labels):
    profiles = {}
    by_class = {}
    for enc, sid in zip(samples, labels):
        by_class.setdefault(sid, []).append(enc)

    for sid, vectors in by_class.items():
        arr = np.array(vectors, dtype=float)
        centroid = np.mean(arr, axis=0)
        centroid = normalize_vector(centroid)
        dists = np.linalg.norm(arr - centroid, axis=1)
        mean_dist = float(np.mean(dists)) if len(dists) > 0 else 0.0
        std_dist = float(np.std(dists)) if len(dists) > 0 else 0.0
        profiles[sid] = {
            "centroid": centroid,
            "mean_dist": mean_dist,
            "std_dist": std_dist,
        }

    return profiles


def _save_model_to_disk(model, scaler, samples, labels, profiles):
    try:
        artifact_dict = {
            'model': model,
            'scaler': scaler,
            'samples': samples,
            'labels': labels,
            'profiles': profiles,
        }
        joblib.dump(artifact_dict, MODEL_FILE)
    except Exception as e:
        print(f"Warning: Could not save model to disk: {e}")


def _load_model_from_disk():
    if not os.path.exists(MODEL_FILE):
        return None
    try:
        artifact_dict = joblib.load(MODEL_FILE)
        return artifact_dict['model'], artifact_dict['scaler'], artifact_dict['samples'], artifact_dict['labels'], artifact_dict['profiles']
    except Exception as e:
        print(f"Warning: Could not load model from disk: {e}")
        return None


def get_trained_artifacts():

    if _MODEL_CACHE["model"] is not None:
        return _MODEL_CACHE["model"], _MODEL_CACHE["scaler"], _MODEL_CACHE["samples"], _MODEL_CACHE["labels"], _MODEL_CACHE["profiles"], None

    disk_result = _load_model_from_disk()
    if disk_result is not None:
        model, scaler, samples, labels, profiles = disk_result
        _MODEL_CACHE["model"] = model
        _MODEL_CACHE["scaler"] = scaler
        _MODEL_CACHE["samples"] = samples
        _MODEL_CACHE["labels"] = labels
        _MODEL_CACHE["profiles"] = profiles
        return model, scaler, samples, labels, profiles, None

    samples, labels = get_all_training_samples()
    if not samples:
        return None, None, None, None, None, "no_dataset"
    if len(set(labels)) < 2:
        return None, None, None, None, None, "not_enough_classes"

    trained, err = train_svm_classifier(samples, labels)
    if err:
        return None, None, None, None, None, err

    model, scaler = trained
    profiles = build_class_profiles(samples, labels)

    _MODEL_CACHE["model"] = model
    _MODEL_CACHE["scaler"] = scaler
    _MODEL_CACHE["samples"] = samples
    _MODEL_CACHE["labels"] = labels
    _MODEL_CACHE["profiles"] = profiles
    _save_model_to_disk(model, scaler, samples, labels, profiles)

    return model, scaler, samples, labels, profiles, None


def nearest_distance_by_class(samples, labels, query_enc):
    class_best = {}
    for enc, sid in zip(samples, labels):
        dist = float(np.linalg.norm(enc - query_enc))
        prev = class_best.get(sid)
        if prev is None or dist < prev:
            class_best[sid] = dist
    return sorted(class_best.items(), key=lambda item: item[1])


def compute_hybrid_confidence(svm_prob, near_dist, dist_gap):
    dist_score = np.clip((1.05 - float(near_dist)) / 0.50, 0.0, 1.0)
    gap_score = np.clip((float(dist_gap) - 0.005) / 0.14, 0.0, 1.0)
    prob_score = np.clip(float(svm_prob), 0.0, 1.0)
    hybrid = (0.25 * prob_score) + (0.50 * dist_score) + (0.25 * gap_score)
    return float(np.clip(hybrid, 0.0, 1.0))


def calibrate_final_confidence(base_conf, near_dist, dist_gap):
    final_conf = float(base_conf)
    if near_dist <= 0.56 and dist_gap >= 0.06:  
        final_conf = max(final_conf, 0.92)
    elif near_dist <= 0.62 and dist_gap >= 0.05: 
        final_conf = max(final_conf, 0.86)
    elif near_dist <= 0.68 and dist_gap >= 0.03:  
        final_conf = max(final_conf, 0.80)
    elif near_dist <= 0.72 and dist_gap >= 0.02:  
        final_conf = max(final_conf, 0.74)
    elif near_dist <= 0.75 and dist_gap >= 0.015: 
        final_conf = max(final_conf, 0.68)

    stretched = np.clip(final_conf, 0.0, 1.0) ** 0.95
    return float(np.clip(stretched, 0.0, 1.0))


def profile_confidence(predicted_pk, query_enc, profiles):

    if not profiles or predicted_pk not in profiles:
        return 0.0, 0.0

    pred_profile = profiles[predicted_pk]
    pred_dist = float(np.linalg.norm(query_enc - pred_profile["centroid"]))

    # Adaptive tolerance per identity from intra-class spread.
    tolerance = max(0.35, pred_profile["mean_dist"] + (2.5 * pred_profile["std_dist"]))
    closeness = float(np.clip(1.0 - (pred_dist / tolerance), 0.0, 1.0))

    other_dists = []
    for sid, profile in profiles.items():
        if sid == predicted_pk:
            continue
        other_dists.append(float(np.linalg.norm(query_enc - profile["centroid"])))

    if not other_dists:
        return closeness, 1.0

    second = min(other_dists)
    gap_score = float(np.clip((second - pred_dist) / 0.25, 0.0, 1.0))
    return closeness, gap_score

def predict_with_svm(model, scaler, face_enc, min_prob=0.52, min_margin=0.035):
    face_scaled = scaler.transform([face_enc])
    probs = model.predict_proba(face_scaled)[0]
    best_idx = int(np.argmax(probs))
    best_prob = float(probs[best_idx])
    sorted_probs = np.sort(probs)
    second_prob = float(sorted_probs[-2]) if len(sorted_probs) > 1 else 0.0
    margin = best_prob - second_prob
    if best_prob < min_prob or margin < min_margin:
        return None, best_prob, margin
    best_pk = model.classes_[best_idx]
    return int(best_pk), best_prob, margin


def _clip_face_box(location, h, w):
    top, right, bottom, left = location
    top = max(0, min(int(top), h - 1))
    bottom = max(0, min(int(bottom), h))
    left = max(0, min(int(left), w - 1))
    right = max(0, min(int(right), w))
    if bottom <= top or right <= left:
        return None
    return (top, right, bottom, left)


def _expand_face_box(location, h, w, pad_ratio=0.12, min_pad=6):
    top, right, bottom, left = location
    box_h = max(1, bottom - top)
    box_w = max(1, right - left)
    pad_h = max(int(box_h * pad_ratio), min_pad)
    pad_w = max(int(box_w * pad_ratio), min_pad)

    expanded = (
        max(0, top - pad_h),
        min(w, right + pad_w),
        min(h, bottom + pad_h),
        max(0, left - pad_w),
    )
    return _clip_face_box(expanded, h, w)


def _classify_hog_features(hog_features, location, min_prob, claimed_pk=None):
    model, scaler, samples, labels, profiles, err = get_trained_artifacts()
    if err:
        return None, err, None

    ranked_distances = nearest_distance_by_class(samples, labels, hog_features)
    if not ranked_distances:
        return None, "low_confidence", None

    near_id, near_dist = ranked_distances[0]
    by_id_dist = {int(sid): float(dist) for sid, dist in ranked_distances}
    second_dist = ranked_distances[1][1] if len(ranked_distances) > 1 else float("inf")
    dist_gap = second_dist - near_dist
    relative_gap = dist_gap / max(near_dist, 1e-6)

    if near_dist > 0.8:
        return None, "low_confidence", None

    is_ambiguous_pair = np.isfinite(second_dist) and (dist_gap < 0.045 or relative_gap < 0.08)

    if is_ambiguous_pair and claimed_pk is not None:
        claimed_dist = by_id_dist.get(int(claimed_pk))
        if claimed_dist is not None:
            if claimed_dist <= 0.66 and (claimed_dist - near_dist) <= 0.03:
                near_id = int(claimed_pk)
                near_dist = float(claimed_dist)
                other_dists = [float(d) for sid, d in ranked_distances if int(sid) != near_id]
                second_dist = other_dists[0] if other_dists else float("inf")
                dist_gap = second_dist - near_dist
                relative_gap = dist_gap / max(near_dist, 1e-6)
                is_ambiguous_pair = False
            else:
                return None, "ambiguous_face", None

    predicted_pk, prob, margin = predict_with_svm(model, scaler, hog_features, min_prob=min_prob)
    hybrid_conf = compute_hybrid_confidence(prob, near_dist, dist_gap)
    if predicted_pk is None:
        # Relax fallback thresholds to tolerate pose/lighting variation during presensi
        if (not is_ambiguous_pair) and near_dist <= 0.68 and dist_gap >= 0.03:
            predicted_pk = near_id
            prob = max(float(hybrid_conf), 0.68)
        else:
            return None, "low_confidence", float(hybrid_conf)

    if predicted_pk != near_id:
        if near_dist > 0.7 or dist_gap < 0.02:
            return None, "low_confidence", float(hybrid_conf)
        predicted_pk = near_id

    try:
        santri = Santri.objects.get(pk=predicted_pk)
    except Santri.DoesNotExist:
        return None, "not_found", None

    if not santri.user or not santri.user.is_active:
        return None, "not_found", None

    profile_close, profile_gap = profile_confidence(predicted_pk, hog_features, profiles)
    prof_blend = (0.7 * profile_close) + (0.3 * profile_gap)
    base_conf = (0.55 * max(float(prob), hybrid_conf)) + (0.45 * prof_blend)
    final_conf = calibrate_final_confidence(base_conf, near_dist, dist_gap)

    if is_ambiguous_pair and final_conf < 0.65:  
        return None, "ambiguous_face", float(final_conf)
    if final_conf < 0.40:  
        return None, "low_confidence", float(final_conf)

    return {
        "santri": santri,
        "location": location,
        "confidence": final_conf,
    }, "ok", final_conf

def _apply_clahe_and_gamma(face_gray):
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    face_clahe = clahe.apply(face_gray)
    
    gamma = 0.95
    inv_gamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype(np.uint8)
    face_gamma = cv2.LUT(face_clahe, table)
    
    return face_gamma

def extract_hog_features(face_img, resize_dim=(128, 128)):
    face_resized = cv2.resize(face_img, resize_dim)
    if len(face_resized.shape) == 3:
        face_gray = cv2.cvtColor(face_resized, cv2.COLOR_RGB2GRAY)
    else:
        face_gray = face_resized
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    face_gray = clahe.apply(face_gray)
    
    h_r, w_r = face_gray.shape[:2]
    mask = np.zeros((h_r, w_r), dtype=np.uint8)
    center = (w_r // 2, h_r // 2)
    axes = (max(1, int(w_r * 0.40)), max(1, int(h_r * 0.50)))
    cv2.ellipse(mask, center, axes, 0, 0, 360, 255, -1)
    mask = cv2.GaussianBlur(mask, (15, 15), 0)
    face_gray_masked = (face_gray.astype(np.float32) * (mask.astype(np.float32) / 255.0)).astype(np.uint8)

    hog_features = hog(
        face_gray_masked,
        orientations=9,
        pixels_per_cell=(8, 8),
        cells_per_block=(2, 2),
        block_norm='L2-Hys',
        visualize=False,
        feature_vector=True
    )
    return normalize_vector(hog_features)

def encode_face_from_image(pil_image):
    img = np.array(pil_image.convert("RGB"))
    face_locations = detect_face_locations_robust(img)
    if face_locations is None:
        return None, "detector_unavailable"
    if not face_locations:
        return None, None
    top, right, bottom, left = face_locations[0]
    h, w = img.shape[:2]
    clipped = _clip_face_box((top, right, bottom, left), h, w)
    if not clipped:
        return None, None
    expanded = _expand_face_box(clipped, h, w)
    if not expanded:
        return None, None
    top, right, bottom, left = expanded
    face_img = img[top:bottom, left:right]
    hog_features = extract_hog_features(face_img)
    return hog_features.tolist(), (top, right, bottom, left)

def recognize_from_image_pil(pil_image, min_prob=0.58, claimed_pk=None):
    try:
        img = np.array(pil_image.convert("RGB"))
        face_locations = detect_face_locations_robust(img)
        if face_locations is None:
            return None, "detector_unavailable", None, None
        if not face_locations:
            return None, "no_face", None, None
        h, w = img.shape[:2]
        clipped = _clip_face_box(face_locations[0], h, w)
        if not clipped:
            return None, "no_face", None, None
        expanded = _expand_face_box(clipped, h, w)
        if not expanded:
            return None, "no_face", None, None
        top, right, bottom, left = expanded
        face_img = img[top:bottom, left:right]
        hog_features = extract_hog_features(face_img)
        result, info, conf = _classify_hog_features(hog_features, expanded, min_prob=min_prob, claimed_pk=claimed_pk)
        if not result:
            return None, info, expanded, conf
        return result["santri"], "ok", result["location"], result["confidence"]
    except Exception as e:
        import traceback
        traceback.print_exc()
        return None, f"error: {str(e)}", None, None


def recognize_many_from_image_pil(pil_image, min_prob=0.58, max_faces=5, claimed_pk=None):
    try:
        img = np.array(pil_image.convert("RGB"))
        face_locations = detect_face_locations_robust(img)
        if face_locations is None:
            return None, "detector_unavailable", [], []
        if not face_locations:
            return None, "no_face", [], []

        h, w = img.shape[:2]
        recognized = []
        rejected = []
        seen_ids = set()

        for loc in face_locations[:max_faces]:
            clipped = _clip_face_box(loc, h, w)
            if not clipped:
                continue
            expanded = _expand_face_box(clipped, h, w)
            if not expanded:
                continue
            top, right, bottom, left = expanded
            face_img = img[top:bottom, left:right]
            hog_features = extract_hog_features(face_img)
            result, info, conf = _classify_hog_features(hog_features, expanded, min_prob=min_prob, claimed_pk=claimed_pk)
            if result and result["santri"].id not in seen_ids:
                seen_ids.add(result["santri"].id)
                recognized.append(result)
            else:
                rejected.append({
                    "location": expanded,
                    "info": info,
                    "confidence": conf,
                })

        if recognized:
            return recognized, "ok", rejected, face_locations

        first_info = rejected[0]["info"] if rejected else "low_confidence"
        return None, first_info, rejected, face_locations
    except Exception as e:
        import traceback
        traceback.print_exc()
        return None, f"error: {str(e)}", [], []
