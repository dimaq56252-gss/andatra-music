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


# Assemble uploaded remix audio and verify the exact encoded file before publication.
remix_root=root/'assets/remix-source-parts'
if remix_root.exists():
 for manifest_path in sorted(remix_root.glob('*/manifest.json')):
  info=json.loads(manifest_path.read_text())
  target=root/info['output']
  assert target.resolve().is_relative_to((root/'assets/remixes').resolve()), 'Invalid remix output'
  target.parent.mkdir(parents=True,exist_ok=True)
  temporary=target.with_suffix('.tmp')
  checksum=hashlib.sha256()
  with temporary.open('wb') as dest:
   for name in info['parts']:
    data=(manifest_path.parent/name).read_bytes()
    checksum.update(data)
    dest.write(data)
  assert temporary.stat().st_size==info['size'], 'Remix size mismatch'
  assert checksum.hexdigest()==info['sha256'], 'Remix checksum mismatch'
  temporary.replace(target)
  print('Remix assembled and verified:',target.name,target.stat().st_size)
 shutil.rmtree(remix_root)
