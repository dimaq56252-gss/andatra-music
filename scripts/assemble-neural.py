"""Assemble pinned browser runtime; model weights stay on Hugging Face."""
import hashlib, io, pathlib, tarfile, urllib.request
URL = "https://registry.npmjs.org/ai-music-js/-/ai-music-js-0.5.0.tgz"
SHA256 = "9c5fd8916c638fe73a5d7f0f21d135a199687d1ffc87d7902c3c48c891f00f67"
payload = urllib.request.urlopen(URL, timeout=120).read()
if hashlib.sha256(payload).hexdigest() != SHA256:
    raise RuntimeError("Browser music runtime checksum mismatch")
target = pathlib.Path("neural/vendor")
with tarfile.open(fileobj=io.BytesIO(payload), mode="r:gz") as archive:
    for member in archive.getmembers():
        if not member.isfile():
            continue
        path = pathlib.PurePosixPath(member.name)
        if member.name.startswith("package/dist/") and path.suffix in (".js", ".mjs", ".wasm", ".json") and "types" not in path.parts:
            relative = pathlib.PurePosixPath(*path.parts[2:])
        elif member.name in ("package/LICENSE", "package/THIRD_PARTY_NOTICES.md") or member.name.startswith("package/licenses/"):
            relative = pathlib.PurePosixPath(*path.parts[1:])
        else:
            continue
        if relative.is_absolute() or ".." in relative.parts:
            raise RuntimeError("Unsafe package path")
        destination = target.joinpath(*relative.parts)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(archive.extractfile(member).read())
print("ACE-Step browser runtime assembled (ai-music-js 0.5.0)")
