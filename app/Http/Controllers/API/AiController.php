<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\GeminiService;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function improve(Request $request, GeminiService $gemini)
    {
        $data = $request->validate([
            'text' => 'required|string|max:20000',
        ]);

        $result = $gemini->improveText($data['text']);
        return response()->json(['result' => $result]);
    }

    public function lectureSummary(Request $request, GeminiService $gemini)
    {
        $data = $request->validate([
            'transcript' => 'required|string|max:20000',
        ]);

        $result = $gemini->summarizeLectureTranscript($data['transcript']);
        return response()->json(['result' => $result]);
    }

    public function keyPoints(Request $request, GeminiService $gemini)
    {
        $data = $request->validate([
            'text' => 'required|string|max:20000',
            'count' => 'sometimes|integer|min:1|max:10',
        ]);

        $result = $gemini->extractKeyPoints($data['text'], $data['count'] ?? 5);
        return response()->json(['result' => $result]);
    }

    public function lectureOutline(Request $request, GeminiService $gemini)
    {
        $data = $request->validate([
            'text' => 'required|string|max:20000',
        ]);

        $result = $gemini->generateLectureOutline($data['text']);
        return response()->json(['result' => $result]);
    }

    public function quizQuestions(Request $request, GeminiService $gemini)
    {
        $data = $request->validate([
            'text' => 'required|string|max:20000',
            'count' => 'sometimes|integer|min:1|max:10',
        ]);

        $result = $gemini->generateQuizQuestions($data['text'], $data['count'] ?? 5);
        return response()->json(['result' => $result]);
    }
}
