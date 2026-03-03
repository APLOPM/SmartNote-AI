# Stitch asset export bundle

Project: `18053436112492064066`

This folder contains:

- `screen_assets.csv`: the requested screen names + IDs, with columns for hosted image/code URLs.
- `download_stitch_assets.sh`: a `curl -L` based downloader that fetches both assets once URLs are filled in.

## Usage

1. Populate `image_url` and `code_url` in `screen_assets.csv`.
2. Run:

```bash
./stitch_exports/18053436112492064066/download_stitch_assets.sh
```

Optional args:

```bash
./stitch_exports/18053436112492064066/download_stitch_assets.sh \
  stitch_exports/18053436112492064066/screen_assets.csv \
  stitch_exports/18053436112492064066/downloaded
```
