Media storage — Local & S3 quick guide

This project includes a simple media upload endpoint: POST /api/media (authenticated)
It stores files to the `public` disk by default and returns a `url` field pointing to the stored file (Storage::disk('public')->url($path)).

Local usage (development):
 - Ensure `FILESYSTEM_DISK=public` in your .env (or use the default)
 - Run `php artisan storage:link` to create the public/storage symlink
 - Use the test-client to upload files ("Upload Media" button) or call the endpoint with a multipart `file` field.

S3 usage (production):
 - Configure AWS credentials and bucket in .env (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION, AWS_BUCKET, AWS_URL)
 - Change `FILESYSTEM_DISK=s3` in .env
 - Consider using a CDN in front of S3 for performance and caching (CloudFront, Cloudflare, etc.)

Security & size limits:
 - The endpoint enforces a max upload size of 10MB (change in `app/Http/Controllers/API/MediaController.php` validation rules).
 - For production, add virus scanning and content-type validation if needed.

Integration tips:
 - When creating posts with images, upload the media first and then attach `image` (URL) to the post creation payload.
 - Implement background image resizing/optimizing (Laravel queues + image libraries) for better UX and bandwidth savings.
