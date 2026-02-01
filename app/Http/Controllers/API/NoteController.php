<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Note;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return Note::where('user_id', $user->id)
            ->orderByDesc('is_pinned')
            ->orderByDesc('updated_at')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:200',
            'body' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'is_pinned' => 'sometimes|boolean',
        ]);

        $note = Note::create([
            'user_id' => $request->user()->id,
            'title' => $data['title'] ?? null,
            'body' => $data['body'] ?? null,
            'color' => $data['color'] ?? null,
            'is_pinned' => $data['is_pinned'] ?? false,
        ]);

        return response()->json($note, 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:200',
            'body' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'is_pinned' => 'sometimes|boolean',
        ]);

        $note = Note::where('user_id', $request->user()->id)->findOrFail($id);
        $note->update($data);

        return response()->json($note);
    }

    public function destroy(Request $request, $id)
    {
        $note = Note::where('user_id', $request->user()->id)->findOrFail($id);
        $note->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
