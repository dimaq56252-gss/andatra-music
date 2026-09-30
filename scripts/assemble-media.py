import hashlib,json,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
folder=root/'assets/video-source-parts/first-concert'
manifest=json.loads((folder/'manifest.json').read_text())
out=root/'assets/videos/first-concert.mp4'
out.parent.mkdir(parents=True,exist_ok=True)
tmp=out.with_suffix('.tmp')
h=hashlib.sha256()
with tmp.open('wb') as dest:
 for name in manifest['parts']:
  data=(folder/name).read_bytes()
  h.update(data)
  dest.write(data)
assert tmp.stat().st_size==manifest['size'], 'Video size mismatch'
assert h.hexdigest()==manifest['sha256'], 'Video checksum mismatch'
tmp.replace(out)
shutil.rmtree(root/'assets/video-source-parts')
print('Concert assembled and verified:',out.stat().st_size)

