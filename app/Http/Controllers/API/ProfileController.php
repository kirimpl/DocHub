<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Обновление аватарки пользователя
     */
    public function updateAvatar(Request $request)
    {
        try {
            $request->validate([
                'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // до 5 МБ
            ]);

            $user = $request->user();

            if (!$user) {
                return response()->json(['error' => 'Пользователь не найден'], 401);
            }

            if ($request->hasFile('avatar')) {

                $path = $request->file('avatar')->store('avatars', 'public');


                $user->avatar = '/storage/' . $path;
                $user->save();
            }

            return response()->json([
                'avatar' => $user->avatar,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Ошибка загрузки аватарки: ' . $e->getMessage()
            ], 500);
        }
    }


    public function updateCover(Request $request)
    {
        try {
            $request->validate([
                'cover' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // до 5 МБ
            ]);

            $user = $request->user();

            if (!$user) {
                return response()->json(['error' => 'Пользователь не найден'], 401);
            }

            if ($request->hasFile('cover')) {

                $path = $request->file('cover')->store('covers', 'public');


                $user->cover_image = '/storage/' . $path;
                $user->save();
            }

            return response()->json([
                'cover_image' => $user->cover_image,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Ошибка загрузки обложки: ' . $e->getMessage()
            ], 500);
        }
    }


    public function profile()
    {
        $user = auth()->user();
        return view('profile', compact('user'));
    }
}
