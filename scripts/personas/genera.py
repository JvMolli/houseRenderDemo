"""
Genera una persona de la maqueta con MPFB (MakeHuman para Blender) y la exporta a GLB.
Uso: blender -b --python genera.py -- personas.json <id> salida.glb [--dry]
Ver scripts/personas/construye.sh para el proceso completo.

Cuerpo, piel, ojos, pelo y ropa salen de los paquetes CC0 de MakeHuman con el
esqueleto «game_engine». El cuerpo se decima (UV y pesos se conservan) y las
texturas de ropa y pelo pasan a gris de media lineal 0,5 para teñirlas en la
escena con los colores de cada persona (ver components/casa3d/People.tsx).
"""
import bpy, sys, json, os
import numpy as np
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
from bl_ext.user_default.mpfb.services.exportservice import ExportService

argv = sys.argv[sys.argv.index('--') + 1:]
specs, name, out = json.load(open(argv[0])), argv[1], argv[2]
dry = '--dry' in argv
p = specs[name]

bpy.ops.wm.read_homefile(use_empty=True)

human_info = {
    "name": name,
    "phenotype": {**TargetService.get_default_macro_info_dict(), **p["phenotype"]},
    "rig": "game_engine",
    "eyes": "low-poly.mhclo", "eyebrows": p.get("eyebrows", "eyebrow001.mhclo"), "eyelashes": "eyelashes01.mhclo",
    "teeth": "", "tongue": "", "hair": p.get("hair", ""), "proxy": "",
    "skin_mhmat": p["skin"], "skin_material_type": "GAMEENGINE", "eyes_material_type": "GAMEENGINE",
    "clothes_material_type": "GAMEENGINE", "clothes": [c["asset"] for c in p.get("clothes", [])],
    "targets": [], "expressions": [], "skin_material_settings": {}, "eyes_material_settings": {},
}
settings = HumanService.get_default_deserialization_settings()
settings["subdiv_levels"] = 0
basemesh = HumanService.deserialize_from_dict(human_info, settings)
rig = basemesh.parent
TargetService.bake_targets(basemesh)
ExportService.bake_modifiers_remove_helpers(basemesh, bake_masks=True, bake_subdiv=False, remove_helpers=True)

meshes = [o for o in rig.children if o.type == 'MESH']

# Papel de cada malla: se nombra el material así para teñirlo y ajustarlo en la escena.
roles = {"body": "skin", "low-poly": "eyes", "eyelashes": "eyelashes", "eyebrow": "eyebrows"}
if p.get("hair"):
    roles[p["hair"].replace(".mhclo", "")] = "hair"
for c in p.get("clothes", []):
    roles[c["asset"].replace(".mhclo", "")] = c["role"]
TINT = {"top", "bottom", "hair", "beard", "bikiniTop", "bikiniBottom"}
tex_dir = os.path.join(os.path.dirname(out), name + "_tex")
os.makedirs(tex_dir, exist_ok=True)

def gray_normalized(img):
    """Color -> gris de media lineal 0,5 (se tiñe en la escena con el color de la ropa x2); conserva el alfa."""
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    lin = np.power(np.clip(px[:, :3], 0, 1), 2.2)
    lum = lin @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    mask = px[:, 3] > 0.5
    mean = float(lum[mask].mean()) if mask.any() else float(lum.mean())
    g = np.power(np.clip(lum * (0.5 / max(mean, 1e-4)), 0, 1), 1 / 2.2)
    px[:, 0] = px[:, 1] = px[:, 2] = g
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = os.path.join(tex_dir, img.name.rsplit('.', 1)[0] + '_gray.png')
    img.file_format = 'PNG'
    img.save()

done = set()
for o in meshes:
    key = next((k for k in roles if k in o.name), None)
    role = roles.get(key, "other")
    for m in o.data.materials:
        if not m:
            continue
        m.name = role
        if role in TINT and m.use_nodes:
            for n in m.node_tree.nodes:
                if n.type == 'TEX_IMAGE' and n.image and n.image.name not in done and n.image.colorspace_settings.name == 'sRGB':
                    gray_normalized(n.image)
                    done.add(n.image.name)
    if role == "skin":
        # Cuerpo más ligero: decimado conservando UV y pesos del esqueleto.
        bpy.context.view_layer.objects.active = o
        mod = o.modifiers.new("Decimate", 'DECIMATE')
        mod.ratio = p.get("decimate", 0.45)
        bpy.ops.object.modifier_move_to_index(modifier=mod.name, index=0)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        for poly in o.data.polygons:
            poly.use_smooth = True

for o in meshes:
    tris = sum(len(f.vertices) - 2 for f in o.data.polygons)
    print('MALLA', o.name, 'triángulos', tris, 'materiales', [m.name for m in o.data.materials if m])

if not dry:
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', use_selection=True, export_skins=True, export_animations=False,
        export_morph=False, export_apply=False, export_yup=True, export_image_format='AUTO', export_materials='EXPORT',
        export_lights=False, export_cameras=False,
    )
    print('EXPORTADO', out, os.path.getsize(out))
