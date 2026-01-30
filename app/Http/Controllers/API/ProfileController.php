<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function updateCover(Request $request)
    {
        try {
            $request->validate([
                'cover' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // до 5 МБ
            ]);

            $user = $request->user();

            if ($request->hasFile('cover')) {
                // сохраняем в storage/app/public/covers
                $path = $request->file('cover')->store('covers', 'public');
                
                // обновляем поле cover_image
                $user->cover_image = '/storage/' . $path;
                $user->save();
            }

            return response()->json([
                'cover_image' => $user->cover_image,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
