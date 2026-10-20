# ANDATRA: neural instrumentals

This is an actual fal ACE-Step queue integration, separate from the procedural
generator and the old song-loop library. It submits text only with
`instrumental: true`, creates a fresh random seed, polls the job and plays and
downloads the resulting audio. It never sends ANDATRA songs as references.

## Deploy

[Create a separate Netlify generator project](https://app.netlify.com/start/deploy?repository=https://github.com/dimaq56252-gss/andatra-music&create_from_path=beat-api#FAL_KEY=&BEAT_ACCESS_TOKEN=)

This copies only `beat-api` into a new project. The hash parameters request the
secret environment values; no real secrets are included in the link. If the
setup screen does not request them, set them in the new project's environment
settings with Functions scope and redeploy as described below.

Create a **separate** Netlify project from this repository. Set base directory
`beat-api`, publish directory `public`, functions directory `netlify/functions`.
No build command is required. Do not deploy this directory over the main site.

In the new project's Environment variables, create two secret variables with
Functions scope, then redeploy:

- `FAL_KEY`: an API key created at https://fal.ai/dashboard/keys . Never put it
  in source, browser code, a chat message, or a public repository.
- `BEAT_ACCESS_TOKEN`: a long private access code chosen by the owner. Enter
  this access code in the generator UI. It is not the provider API key.

Open the new Netlify URL and generate a 30-second instrumental first. Generation
and hosting may incur charges. The model page lists $0.0002 per audio second:
$0.006 / 30s, $0.012 / 60s, $0.024 / 120s, $0.036 / 180s. Confirm current pricing
and account limits before use. The frontend displays this estimate.

Main ANDATRA continues to work independently until a real generation is tested.
Then its generator link can point to this project. This avoids exposing secrets
on GitHub Pages or requiring a cross-origin credential proxy.

## Checks

`npm test` verifies request validation, instrumental-only input, signed job
receipts, polling on the correct app URL, result validation, authorization,
provider errors and cancellation. Transport is mocked and makes no paid calls.
Passing these tests does not demonstrate model quality or a working account.

Real inference, output listening, deployed functions and CDN downloads still
require configured credentials and an actual test generation. A model's
instrumental switch is not a guarantee against all vocal artifacts or similarity
to other music. Review the audio and provider terms before using a result.

API references:
- https://fal.ai/models/fal-ai/ace-step/prompt-to-audio/api
- https://fal.ai/docs/documentation/model-apis/inference/queue
