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
    'frontal':    {'name': '额叶',   'color': [68, 170, 255, 255], 'sort': 2},
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
        scales = np.random.uniform(0.1, 0.9, (n_surface, 1))
        internal = centroid + (surface - centroid) * scales
        all_pts = np.vstack((surface, internal))
    else:
        all_pts = surface

    np.random.shuffle(all_pts)
    return all_pts


def classify_point(x, y, z, z_min, z_max, y_min, y_max):
    """
    Classify brain region based on coordinate position.
    Z-axis: anterior(+) → posterior(-), maps to frontal → occipital
    Y-axis: superior(high) → inferior(low), maps to dorsal → ventral
    X-axis: left-right
    """
    z_norm = (z - z_min) / (z_max - z_min)  # 0=posterior 1=anterior
    y_norm = (y - y_min) / (y_max - y_min)  # 0=inferior 1=superior
    x_abs = abs(x)

    # Temporal lobe: inferolateral, not at extreme posterior
    if y_norm < 0.35 and x_abs > 0.12 and z_norm > 0.25:
        return 'temporal'

    # Anterior-posterior axis partitioning
    if z_norm > 0.75:
        return 'prefrontal'
    elif z_norm > 0.48:
        return 'frontal'
    elif z_norm > 0.22:
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

    # Get hemisphere Z/Y range for classification (use union of both hemispheres)
    hemi_verts = np.vstack([rh.vertices, lh.vertices])
    z_min, z_max = hemi_verts[:, 2].min(), hemi_verts[:, 2].max()
    y_min, y_max = hemi_verts[:, 1].min(), hemi_verts[:, 1].max()

    region_points = {k: [] for k in REGIONS}

    # Process right hemisphere
    rh_centroid = rh.vertices.mean(axis=0)
    points = sample_points(rh.vertices, 2000, 1000, rh_centroid)
    for pt in points:
        region = classify_point(pt[0], pt[1], pt[2], z_min, z_max, y_min, y_max)
        region_points[region].append(pt.tolist())

    # Process left hemisphere
    lh_centroid = lh.vertices.mean(axis=0)
    points = sample_points(lh.vertices, 2000, 1000, lh_centroid)
    for pt in points:
        region = classify_point(pt[0], pt[1], pt[2], z_min, z_max, y_min, y_max)
        region_points[region].append(pt.tolist())

    # Cerebellum
    if cb:
        cb_centroid = cb.vertices.mean(axis=0)
        cb_pts = sample_points(cb.vertices, 1000, 500, cb_centroid)
        region_points['cerebellum'].extend(cb_pts.tolist())

    # Brainstem
    if bs:
        bs_centroid = bs.vertices.mean(axis=0)
        bs_pts = sample_points(bs.vertices, 300, 200, bs_centroid)
        region_points['cerebellum'].extend(bs_pts.tolist())

    # Output JSON (compatible with backend BrainRegion import format)
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
