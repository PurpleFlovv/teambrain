import json
import trimesh
import numpy as np
from pathlib import Path

# Load model
script_dir = Path(__file__).resolve().parent
model_path = script_dir / 'brain.glb'
scene = trimesh.load(str(model_path))

# Brain region definitions
REGIONS = {
    'prefrontal': {'name': '前额叶', 'color': [255, 179, 71, 255], 'sort': 1},
    'frontal':    {'name': '额叶后部',   'color': [68, 170, 255, 255], 'sort': 2},
    'parietal':   {'name': '顶叶',   'color': [170, 68, 255, 255], 'sort': 3},
    'temporal':   {'name': '颞叶',   'color': [68, 255, 170, 255], 'sort': 4},
    'occipital':  {'name': '枕叶',   'color': [255, 136, 68, 255], 'sort': 5},
    'cerebellum': {'name': '小脑/脑干', 'color': [255, 68, 119, 255], 'sort': 6},
}


def sample_points(vertices, n_surface, n_internal, centroid):
    """Sample surface points and internal fill points"""
    if len(vertices) < n_surface:
        n_surface = len(vertices)
    indices = np.random.choice(len(vertices), n_surface, replace=False)
    surface = vertices[indices]

    if n_internal > 0:
        n_int = min(n_internal, n_surface)
        internal_src = surface[:n_int]
        scales = np.random.uniform(0.1, 0.9, (n_int, 1))
        internal = centroid + (internal_src - centroid) * scales
        all_pts = np.vstack((surface, internal))
    else:
        all_pts = surface

    np.random.shuffle(all_pts)
    return all_pts


def classify_point(x, y, z, z_min, z_max, y_min, y_max):
    """
    Classify brain region based on native model coordinates.
    Native coords: X=LR, Y=SI(inferior→superior), Z=AP(posterior→anterior)

    Boundaries tilt with Y-axis to follow real sulcal anatomy:
    - Parieto-occipital sulcus: tilts posterior at the top (more parietal)
    - Central sulcus: tilts anterior at the bottom
    - Prefrontal boundary: slight posterior tilt at the top
    - Sylvian fissure: rises posteriorly
    """
    z_norm = (z - z_min) / (z_max - z_min)  # 0=posterior 1=anterior
    y_norm = (y - y_min) / (y_max - y_min)  # 0=inferior 1=superior
    x_abs  = abs(x)

    # Tilted boundaries (thresholds vary with y_norm)
    z_occipital  = 0.20 - 0.10 * y_norm   # 顶枕沟: top→0.10, bottom→0.20
    z_central    = 0.50 - 0.16 * y_norm   # 中央沟:  top→0.34, bottom→0.50
    z_prefrontal = 0.70 - 0.10 * y_norm   # 前额叶:  top→0.60, bottom→0.70
    y_temporal   = 0.18 + 0.28 * z_norm   # 外侧裂:  anterior→0.43, posterior→0.24

    # Temporal lobe: inferolateral, behind prefrontal (temporal pole ~z_norm 0.60)
    if y_norm < y_temporal and x_abs > 0.08 and z_occipital < z_norm < 0.76:
        return 'temporal'

    # Anterior-posterior gradient for dorsal and medial regions
    if z_norm > z_prefrontal:
        return 'prefrontal'
    elif z_norm > z_central:
        return 'frontal'
    elif z_norm > z_occipital:
        return 'parietal'
    else:
        return 'occipital'


def process_model():
    # Part_04 (right hemisphere) and Part_06 (left hemisphere)
    rh = scene.geometry.get('Brain_Part_04_Colour_Brain_Texture_0')
    lh = scene.geometry.get('Brain_Part_06_Colour_Brain_Texture_0')
    # Part_02 = cerebellum, Part_05 = brainstem
    cb = scene.geometry.get('Brain_Part_02_Colour_Brain_Texture_0')
    bs = scene.geometry.get('Brain_Part_05_Colour_Brain_Texture_0')

    # Compute Z(AP) and Y(SI) ranges from both hemispheres for classification
    hemi_verts = np.vstack([rh.vertices, lh.vertices])
    z_min, z_max = hemi_verts[:, 2].min(), hemi_verts[:, 2].max()  # AP axis
    y_min, y_max = hemi_verts[:, 1].min(), hemi_verts[:, 1].max()  # SI axis

    # Vertical midpoint for centering the brain in view
    y_mid = (y_min + y_max) / 2.0

    region_points = {k: [] for k in REGIONS}

    # Process hemispheres (600 surface + 400 internal = 1000 per hemisphere)
    for hemi in [rh, lh]:
        centroid = hemi.vertices.mean(axis=0)
        points = sample_points(hemi.vertices, 600, 400, centroid)
        for pt in points:
            region = classify_point(pt[0], pt[1], pt[2], z_min, z_max, y_min, y_max)
            # Y/Z swap for frontend + center vertically
            region_points[region].append([pt[0], pt[2], pt[1] - y_mid])

    # Cerebellum (400 surface + 200 internal = 600)
    if cb:
        cb_centroid = cb.vertices.mean(axis=0)
        cb_pts = sample_points(cb.vertices, 400, 200, cb_centroid)
        for pt in cb_pts:
            region_points['cerebellum'].append([pt[0], pt[2], pt[1] - y_mid])

    # Brainstem (200 surface + 100 internal = 300)
    if bs:
        bs_centroid = bs.vertices.mean(axis=0)
        bs_pts = sample_points(bs.vertices, 200, 100, bs_centroid)
        for pt in bs_pts:
            region_points['cerebellum'].append([pt[0], pt[2], pt[1] - y_mid])

    # Output JSON
    output = []
    for region_key, info in REGIONS.items():
        output.append({
            'region_name': info['name'],
            'color': info['color'],
            'sort_order': info['sort'],
            'points': region_points[region_key]
        })

    output_path = script_dir / 'brain_points_labeled.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)

    total = sum(len(r['points']) for r in output)
    print(f"Partitioning complete. Total: {total} points")
    for r in output:
        print(f"  {r['region_name']}: {len(r['points'])} points")
    print(f"Output: {output_path}")


if __name__ == '__main__':
    process_model()
