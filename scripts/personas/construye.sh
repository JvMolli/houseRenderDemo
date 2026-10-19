#!/usr/bin/env bash
# Rehace public/personas/*.glb (personas realistas del patio) desde cero.
# Uso: scripts/personas/construye.sh <carpeta de trabajo>
#
# Descarga Blender 4.5 LTS, MPFB 2.0.18 (MakeHuman para Blender) y los paquetes
# CC0 de MakeHuman, genera cada persona de personas.json con genera.py y la
# optimiza con gltf-transform (texturas WebP de 1024 px y geometría meshopt).
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "$here/../.." && pwd)
work=$(mkdir -p "$1" && cd "$1" && pwd)
cd "$work"

blender=blender-4.5.14-linux-x64
[ -d $blender ] || curl -sL https://download.blender.org/release/Blender4.5/$blender.tar.xz | tar xJ
# Blender necesita libSM/libICE; si no están en el sistema se extraen aquí sin instalarlas.
if ldd $blender/blender | grep -q "not found"; then
  mkdir -p debs libs && (cd debs && apt-get download libsm6 libice6) && for f in debs/*.deb; do dpkg -x "$f" libs; done
fi
export LD_LIBRARY_PATH=$work/libs/usr/lib/x86_64-linux-gnu BLENDER_USER_RESOURCES=$work/bconf
B=$work/$blender/blender

if [ ! -d bconf/extensions/user_default/mpfb ]; then
  curl -sL -o mpfb.zip "https://extensions.blender.org/download/sha256:c075b3e9b94b8e5556a5f03f4653602d02ea306de08126e8f55ed6dee28a2dad/add-on-mpfb-v2.0.18.zip"
  $B -b --factory-startup --command extension install-file -r user_default -e mpfb.zip
fi
data=bconf/extensions/.user/user_default/mpfb/data
mkdir -p "$data" packs
for p in makehuman_system_assets skins01 skins02 shirts01 pants01 shoes01 hair01 bodyparts05 underwear01; do
  [ -f packs/$p.zip ] || curl -sL -o packs/$p.zip "https://files.makehumancommunity.org/asset_packs/$p/${p}_cc0.zip"
  unzip -o -q packs/$p.zip -d "$data"
done

[ -x gt/node_modules/.bin/gltf-transform ] || (mkdir -p gt && cd gt && npm init -y >/dev/null && npm i @gltf-transform/cli@4)
mkdir -p out
for id in $(python3 -c "import json,sys; print(' '.join(json.load(open(sys.argv[1]))))" "$here/personas.json"); do
  $B -b --python "$here/genera.py" -- "$here/personas.json" "$id" "out/$id.glb"
  gt/node_modules/.bin/gltf-transform optimize "out/$id.glb" "$repo/public/personas/$id.glb" \
    --compress meshopt --texture-compress webp --texture-size 1024 --flatten false --join false --instance false --simplify false --palette false
done
