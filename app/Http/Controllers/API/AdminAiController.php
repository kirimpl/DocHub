<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AiRequest;
use App\Services\GeminiService;
use Illuminate\Http\Request;

class AdminAiController extends Controller
{
    public function index(Request $request)
    {
        $admin = $request->user();
        if (!$admin || !$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $items = AiRequest::with('user:id,name,last_name,email')
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return response()->json($items);
    }

    public function store(Request $request, GeminiService $gemini)
    {
        $admin = $request->user();
        if (!$admin || !$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'type' => 'required|string|in:improve,lecture_summary,key_points,lecture_outline,lecture_questions',
            'text' => 'required_if:type,improve,key_points,lecture_outline,lecture_questions|nullable|string|max:20000',
            'transcript' => 'required_if:type,lecture_summary|nullable|string|max:20000',
            'count' => 'nullable|integer|min:1|max:10',
        ]);

        $type = $data['type'];
        $input = [
            'text' => $data['text'] ?? null,
            'transcript' => $data['transcript'] ?? null,
            'count' => $data['count'] ?? null,
        ];

        $requestRow = AiRequest::create([
            'user_id' => $admin->id,
            'type' => $type,
            'input' => $input,
            'status' => 'pending',
        ]);

        try {
            $result = match ($type) {
                'improve' => $gemini->improveText($data['text'] ?? ''),
                'lecture_summary' => $gemini->summarizeLectureTranscript($data['transcript'] ?? ''),
                'key_points' => $gemini->extractKeyPoints($data['text'] ?? '', $data['count'] ?? 5),
                'lecture_outline' => $gemini->generateLectureOutline($data['text'] ?? ''),
                'lecture_questions' => $gemini->generateQuizQuestions($data['text'] ?? '', $data['count'] ?? 5),
            };

            $requestRow->update([
                'output' => is_string($result) ? $result : json_encode($result, JSON_UNESCAPED_UNICODE),
                'status' => 'success',
                'error' => null,
            ]);

            return response()->json([
                'request' => $requestRow->fresh('user:id,name,last_name,email'),
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            $requestRow->update([
                'status' => 'failed',
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'AI request failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
