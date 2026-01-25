<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeminiService
{
    private function request(string $prompt): string
    {
        $response = Http::withoutVerifying()->post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key='
            . config('services.gemini.key'),
            [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'text' => $prompt,
                            ],
                        ],
                    ],
                ],
            ]
        );

        return $response->json('candidates.0.content.parts.0.text')
            ?? 'No response from Gemini';
    }

    public function improveText(string $text): string
    {
        $prompt = "Улучшить этот текст, сделать его профессиональным и понятным:\n\n{$text}";
        return $this->request($prompt);
    }

    public function summarizeLectureTranscript(string $transcript): string
    {
        $prompt = "Сделай краткий пересказ лекции (5-8 предложений) на русском. Текст расшифровки:\n\n{$transcript}";
        return $this->request($prompt);
    }

    public function extractKeyPoints(string $text, int $count = 5): string
    {
        $count = max(1, min($count, 10));
        $prompt = "Выдели {$count} ключевых пунктов из текста в виде списка. Ответ на русском. Текст:\n\n{$text}";
        return $this->request($prompt);
    }

    public function generateLectureOutline(string $text): string
    {
        $prompt = "Сформируй краткий план лекции по этому тексту (разделы/подразделы). Ответ на русском.\n\n{$text}";
        return $this->request($prompt);
    }

    public function generateQuizQuestions(string $text, int $count = 5): string
    {
        $count = max(1, min($count, 10));
        $prompt = "Составь {$count} контрольных вопросов по тексту (без ответов). Ответ на русском.\n\n{$text}";
        return $this->request($prompt);
    }
}