<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ChatGroup;
use App\Models\ChatGroupMessage;
use App\Models\Lecture;
use App\Models\User;
use Illuminate\Http\Request;

class LectureController extends Controller
{
    public function index(Request $request)
    {
        return Lecture::query()
            ->with('creator:id,name,avatar')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function show(Request $request, $id)
    {
        $lecture = Lecture::with('creator:id,name,avatar')->findOrFail($id);
        return response()->json($lecture);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'nullable|string',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'is_online' => 'sometimes|boolean',
            'status' => 'sometimes|string|in:scheduled,live,ended,archived',
        ]);

        $user = $request->user();
        $status = $data['status'] ?? ((($data['is_online'] ?? true) === true) ? 'live' : 'scheduled');

        $lecture = Lecture::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'is_online' => $data['is_online'] ?? true,
            'status' => $status,
            'creator_id' => $user->id,
        ]);

        $lecture->participants()->syncWithoutDetaching([
            $user->id => ['role' => 'admin'],
        ]);

        $group = null;
        if ($lecture->is_online && $lecture->status !== 'archived') {
            $group = $lecture->chatGroup()->create([
                'name' => $lecture->title,
                'owner_id' => $user->id,
                'type' => 'lecture',
                'is_system' => true,
            ]);

            $group->members()->syncWithoutDetaching([
                $user->id => ['role' => 'admin'],
            ]);

            $globalAdmins = User::where('global_role', 'admin')->pluck('id')->all();
            if ($globalAdmins) {
                $payload = [];
                foreach ($globalAdmins as $adminId) {
                    $payload[$adminId] = ['role' => 'admin'];
                }
                $group->members()->syncWithoutDetaching($payload);
                $lecture->participants()->syncWithoutDetaching($payload);
            }
        }

        return response()->json([
            'lecture' => $lecture,
            'chat_group' => $group,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'is_online' => 'sometimes|boolean',
            'status' => 'sometimes|string|in:scheduled,live,ended,archived',
        ]);

        $user = $request->user();
        $lecture = Lecture::findOrFail($id);
        if ($lecture->creator_id !== $user->id && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Only lecture creator or global admin can edit.'], 403);
        }

        $lecture->update($data);

        $group = $this->getLectureGroup($lecture);
        if ($group && isset($data['title'])) {
            $group->update(['name' => $data['title']]);
        }

        return response()->json($lecture);
    }

    public function join(Request $request, $id)
    {
        $user = $request->user();
        $lecture = Lecture::findOrFail($id);
        if ($lecture->isEnded() && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Lecture is closed.'], 403);
        }

        $lecture->participants()->syncWithoutDetaching([
            $user->id => ['role' => 'member'],
        ]);

        $group = $lecture->chatGroup()->first();
        if ($group) {
            $group->members()->syncWithoutDetaching([
                $user->id => ['role' => 'member'],
            ]);
        }

        return response()->json(['message' => 'Joined lecture.']);
    }

    public function leave(Request $request, $id)
    {
        $user = $request->user();
        $lecture = Lecture::findOrFail($id);
        if ($lecture->creator_id === $user->id) {
            return response()->json(['message' => 'Creator cannot leave the lecture.'], 400);
        }

        $lecture->participants()->detach($user->id);
        $group = $this->getLectureGroup($lecture);
        if ($group) {
            $group->members()->detach($user->id);
        }

        return response()->json(['message' => 'Left lecture.']);
    }

    public function end(Request $request, $id)
    {
        $user = $request->user();
        $lecture = Lecture::findOrFail($id);
        if ($lecture->creator_id !== $user->id && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Only lecture creator or global admin can end.'], 403);
        }

        $lecture->update([
            'status' => 'ended',
            'ends_at' => $lecture->ends_at ?? now(),
        ]);

        $group = $this->getLectureGroup($lecture);
        if ($group) {
            $globalAdmins = User::where('global_role', 'admin')->pluck('id')->all();
            $payload = [];
            foreach ($globalAdmins as $adminId) {
                $payload[$adminId] = ['role' => 'admin'];
            }
            $group->members()->sync($payload);
        }

        $memberIds = $lecture->participants()
            ->wherePivot('role', 'member')
            ->pluck('users.id')
            ->all();
        $lecture->participants()->detach($memberIds);

        ChatGroupMessage::create([
            'chat_group_id' => $group?->id,
            'sender_id' => $user->id,
            'body' => 'Lecture ended.',
            'is_system' => true,
        ]);

        return response()->json(['message' => 'Lecture ended.']);
    }

    public function addAdmins(Request $request, $id)
    {
        $data = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $user = $request->user();
        $lecture = Lecture::findOrFail($id);
        if ($lecture->creator_id !== $user->id && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Only lecture creator or global admin can add admins.'], 403);
        }

        $payload = [];
        foreach ($data['user_ids'] as $adminId) {
            $payload[$adminId] = ['role' => 'admin'];
        }
        $lecture->participants()->syncWithoutDetaching($payload);

        $group = $this->getLectureGroup($lecture);
        if ($group) {
            $group->members()->syncWithoutDetaching($payload);
        }

        return response()->json(['message' => 'Admins updated.']);
    }

    private function getLectureGroup(Lecture $lecture): ?ChatGroup
    {
        $group = ChatGroup::where('lecture_id', $lecture->id)->first();
        if ($group) {
            return $group;
        }

        $group = ChatGroup::where('type', 'lecture')
            ->where('owner_id', $lecture->creator_id)
            ->where('name', $lecture->title)
            ->first();

        if ($group) {
            if (!$group->lecture_id) {
                $group->update(['lecture_id' => $lecture->id]);
            }
            return $group;
        }

        if ($lecture->is_online && $lecture->status !== 'archived') {
            return ChatGroup::firstOrCreate(
                [
                    'type' => 'lecture',
                    'lecture_id' => $lecture->id,
                ],
                [
                    'name' => $lecture->title,
                    'owner_id' => $lecture->creator_id,
                    'is_system' => true,
                ]
            );
        }

        return null;
    }
}
