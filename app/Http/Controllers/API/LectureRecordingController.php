<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Lecture;
use App\Models\LectureRecording;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LectureRecordingController extends Controller
{
    private function canViewLecture(Request $request, Lecture $lecture): bool
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }

        if ($user->isGlobalAdmin() || (int) $lecture->creator_id === (int) $user->id) {
            return true;
        }

        return $lecture->participants()->where('users.id', $user->id)->exists();
    }

    public function index(Request $request, $lectureId)
    {
        $lecture = Lecture::findOrFail($lectureId);
        if (!$this->canViewLecture($request, $lecture)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $recordings = LectureRecording::where('lecture_id', $lecture->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($recordings);
    }

    public function store(Request $request, $lectureId)
    {
        $lecture = Lecture::findOrFail($lectureId);
        $user = $request->user();
        if ($lecture->creator_id !== $user->id && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Only creator or global admin can upload.'], 403);
        }

        $data = $request->validate([
            'recording' => 'required|file|mimetypes:video/webm,video/mp4,video/quicktime|max:512000',
            'duration_seconds' => 'nullable|integer|min:0',
            'started_at' => 'nullable|date',
            'ended_at' => 'nullable|date',
        ]);

        $file = $data['recording'];
        $ext = $file->getClientOriginalExtension() ?: 'webm';
        $filename = 'lecture-' . $lecture->id . '-' . now()->format('Ymd_His') . '.' . $ext;
        $path = $file->storeAs('lecture-recordings/' . $lecture->id, $filename);

        $recording = LectureRecording::create([
            'lecture_id' => $lecture->id,
            'user_id' => $user->id,
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'duration_seconds' => $data['duration_seconds'] ?? null,
            'started_at' => $data['started_at'] ?? null,
            'ended_at' => $data['ended_at'] ?? null,
        ]);

        return response()->json($recording, 201);
    }

    public function download(Request $request, $lectureId, $recordingId)
    {
        $lecture = Lecture::findOrFail($lectureId);
        if (!$this->canViewLecture($request, $lecture)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $recording = LectureRecording::where('lecture_id', $lecture->id)->findOrFail($recordingId);
        if (!Storage::exists($recording->file_path)) {
            return response()->json(['message' => 'Recording not found.'], 404);
        }

        return Storage::download($recording->file_path);
    }
}
