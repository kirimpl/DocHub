<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ChatGroup;
use App\Models\ChatGroupMessage;
use App\Models\Event;
use App\Models\Lecture;
use App\Models\LectureBan;
use App\Models\LectureInvitation;
use App\Models\User;
use App\Events\LectureSignal;
use App\Jobs\EndLectureIfCreatorAbsent;
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

    public function archives(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $lectures = Lecture::query()
            ->select(['id', 'title', 'description', 'starts_at', 'ends_at', 'status'])
            ->withCount('recordings')
            ->where('status', 'archived')
            ->orWhereHas('recordings')
            ->orderByDesc('starts_at')
            ->orderByDesc('id')
            ->get();

        return response()->json($lectures);
    }

    public function show(Request $request, $id)
    {
        $lecture = Lecture::with('creator:id,name,avatar', 'chatGroup:id,lecture_id,name')->findOrFail($id);
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

        $this->syncCalendarEvent($lecture, $user);

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
        $this->syncCalendarEvent($lecture, $user);

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
        $isBanned = LectureBan::where('lecture_id', $lecture->id)
            ->where('user_id', $user->id)
            ->exists();
        if ($isBanned) {
            return response()->json(['message' => 'You are banned from this lecture.'], 403);
        }

        if ($lecture->creator_id === $user->id && $lecture->creator_left_at) {
            $lecture->creator_left_at = null;
            $lecture->save();
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
            $lecture->creator_left_at = now();
            $lecture->save();
            EndLectureIfCreatorAbsent::dispatch($lecture->id)->delay(now()->addMinutes(5));
            return response()->json(['message' => 'Creator left the lecture.']);
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
        $this->syncCalendarEvent($lecture, $user);

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

    private function syncCalendarEvent(Lecture $lecture, User $creator): void
    {
        if (!$lecture->starts_at) {
            if ($lecture->event_id) {
                Event::where('id', $lecture->event_id)->delete();
                $lecture->event_id = null;
                $lecture->save();
            }
            return;
        }

        $payload = [
            'title' => $lecture->title,
            'description' => $lecture->description,
            'type' => 'lecture',
            'status' => $lecture->status,
            'is_online' => true,
            'starts_at' => $lecture->starts_at,
            'ends_at' => $lecture->ends_at,
            'organization_name' => $creator->work_place,
            'department_name' => $creator->speciality,
            'creator_id' => $creator->id,
        ];

        if ($lecture->event_id) {
            Event::where('id', $lecture->event_id)->update($payload);
            return;
        }

        $event = Event::create($payload);
        $lecture->event_id = $event->id;
        $lecture->save();
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

    public function participants(Request $request, $id)
    {
        $lecture = Lecture::findOrFail($id);
        $participants = $lecture->participants()
            ->select('users.id', 'users.name', 'users.last_name', 'users.avatar', 'users.global_role')
            ->get()
            ->map(function ($user) use ($lecture) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'last_name' => $user->last_name,
                    'avatar' => $user->avatar,
                    'role' => $user->pivot->role ?? 'member',
                    'global_role' => $user->global_role,
                    'is_creator' => (int) $lecture->creator_id === (int) $user->id,
                ];
            });

        return response()->json($participants);
    }

    public function invite(Request $request, $id)
    {
        $data = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $user = $request->user();
        $lecture = Lecture::findOrFail($id);
        if ($lecture->creator_id !== $user->id && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Only lecture creator or global admin can invite.'], 403);
        }

        foreach ($data['user_ids'] as $userId) {
            LectureInvitation::updateOrCreate(
                ['lecture_id' => $lecture->id, 'user_id' => $userId],
                ['invited_by' => $user->id, 'status' => 'pending']
            );
        }

        return response()->json(['message' => 'Invitations sent.']);
    }

    public function myInvites(Request $request)
    {
        $user = $request->user();
        $invites = LectureInvitation::query()
            ->where('user_id', $user->id)
            ->with('lecture:id,title,status,starts_at,creator_id')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($invites);
    }

    public function acceptInvite(Request $request, $id, $inviteId)
    {
        $user = $request->user();
        $lecture = Lecture::findOrFail($id);
        $invite = LectureInvitation::where('lecture_id', $lecture->id)
            ->where('id', $inviteId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $invite->update(['status' => 'accepted']);
        $lecture->participants()->syncWithoutDetaching([
            $user->id => ['role' => 'member'],
        ]);

        $group = $lecture->chatGroup()->first();
        if ($group) {
            $group->members()->syncWithoutDetaching([
                $user->id => ['role' => 'member'],
            ]);
        }

        return response()->json(['message' => 'Invitation accepted.']);
    }

    public function declineInvite(Request $request, $id, $inviteId)
    {
        $user = $request->user();
        $lecture = Lecture::findOrFail($id);
        $invite = LectureInvitation::where('lecture_id', $lecture->id)
            ->where('id', $inviteId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $invite->update(['status' => 'declined']);
        return response()->json(['message' => 'Invitation declined.']);
    }

    public function kick(Request $request, $id)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = $request->user();
        $lecture = Lecture::findOrFail($id);
        if ($lecture->creator_id !== $user->id && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Only lecture creator or global admin can kick.'], 403);
        }
        if ((int) $data['user_id'] === (int) $lecture->creator_id) {
            return response()->json(['message' => 'Cannot kick lecture creator.'], 422);
        }

        $lecture->participants()->detach($data['user_id']);
        $group = $lecture->chatGroup()->first();
        if ($group) {
            $group->members()->detach($data['user_id']);
        }

        return response()->json(['message' => 'User removed.']);
    }

    public function ban(Request $request, $id)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'reason' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $lecture = Lecture::findOrFail($id);
        if ($lecture->creator_id !== $user->id && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Only lecture creator or global admin can ban.'], 403);
        }
        if ((int) $data['user_id'] === (int) $lecture->creator_id) {
            return response()->json(['message' => 'Cannot ban lecture creator.'], 422);
        }

        LectureBan::updateOrCreate(
            ['lecture_id' => $lecture->id, 'user_id' => $data['user_id']],
            ['banned_by' => $user->id, 'reason' => $data['reason'] ?? null]
        );

        $lecture->participants()->detach($data['user_id']);
        $group = $lecture->chatGroup()->first();
        if ($group) {
            $group->members()->detach($data['user_id']);
        }

        return response()->json(['message' => 'User banned.']);
    }

    public function signal(Request $request, $id)
    {
        $data = $request->validate([
            'type' => 'required|string|max:50',
            'to_user_id' => 'nullable|exists:users,id',
            'payload' => 'nullable|array',
        ]);

        $lecture = Lecture::findOrFail($id);
        $user = $request->user();

        $isParticipant = $lecture->participants()
            ->where('users.id', $user->id)
            ->exists();
        if (!$isParticipant && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Not in lecture.'], 403);
        }

        event(new LectureSignal(
            $lecture->id,
            $user->id,
            $data['to_user_id'] ?? null,
            [
                'type' => $data['type'],
                'payload' => $data['payload'] ?? [],
            ]
        ));

        return response()->json(['ok' => true]);
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
