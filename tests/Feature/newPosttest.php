<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Post;
use Illuminate\Support\Facades\Http;

class newPosttest extends TestCase
{
    use RefreshDatabase;

    public function test_create_and_view_post()
    {
        // 1. Создаем пользователя с организацией (как требует контроллер)
        $user = User::factory()->create(['work_place' => 'City Hospital']);

        // 2. Имитируем данные, которые приходят из формы сайта
        $postData = [
            'content' => 'Это тестовый пост со всеми данными: фото, теги и статус.',
            'department_tags' => ['Хирургия', 'Терапия'],
            'is_public' => true,
            'is_global' => true,
            'image_url' => 'https://via.placeholder.com/600x400.png', // Имитируем ссылку на фото
        ];

        // 3. ОТПРАВКА В n8n (копируй этот блок в контроллер позже)
  try {
    // Создаем крошечную картинку в памяти, чтобы не качать её из интернета
    $imageContent = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

    $response = Http::withoutVerifying() // Решает проблему SSL (image_4c487f)
        ->timeout(10)
        ->asMultipart()
        ->attach('image', $imageContent, 'test.png') // Отправляем картинку из памяти
        ->attach('author', 'Test Admin')
        ->attach('content', 'Проверка связи с n8n через Multipart')
        ->attach('organization', 'DocHub Local')
        ->attach('tags', 'Тест, Laravel, n8n')
        ->post('https://dema2000.app.n8n.cloud/webhook/mywork');

    dump("СТАТУС: " . $response->status());
} catch (\Exception $e) {
    dump("ОШИБКА: " . $e->getMessage());
}

        // 4. Проверка самого Laravel (что пост создается в базе)
        $token = $user->createToken('api')->plainTextToken;
        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/posts', $postData);

        $response->assertStatus(201);
    }
}
