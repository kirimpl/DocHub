<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeminiService
{
    public function improveText(string $text): string
    {
        $response = Http::withoutVerifying()->post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key='
            . config('services.gemini.key'),
            [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'text' => "Improve this text professionally and clearly:\n\n{$text}"
                            ]
                        ]
                    ]
                ]
            ]
        );

        return $response->json('candidates.0.content.parts.0.text')
            ?? 'No response from Gemini';
    }
}
