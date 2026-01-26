<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\VoiceRoom;
use App\Models\VoiceRoomInvitation;
use Illuminate\Http\Request;
use App\Notifications\VoiceRoomNotification;
use App\Models\User;

class VoiceRoomController extends Controller
{
    public function index(Request $request)
    {
        return VoiceRoom::query()
            ->with('creator:id,name,avatar')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function show(Request $request, $id)
    {
        $room = VoiceRoom::with('creator:id,name,avatar')->findOrFail($id);
        return response()->json($room);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'type' => 'sometimes|string|in:lecture,meeting,group_call',
            'status' => 'sometimes|string|in:scheduled,live,ended,archived',
            'access_level' => 'sometimes|string|in:public,organization,department,invite',
            'notify_scope' => 'sometimes|string|in:global,local',
            'is_recorded' => 'sometimes|boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'organization_name' => 'nullable|string|max:255',
            'department_name' => 'nullable|string|max:255',
            'department_tags' => 'nullable|array',
            'department_tags.*' => 'string|max:100',
        ]);

        $user = $request->user();
        $type = $data['type'] ?? 'meeting';

        if (in_array($type, ['lecture', 'meeting'], true) && !$this->canCreateLectureOrMeeting($user)) {
            return response()->json(['message' => 'Insufficient permissions to create lectures or meetings.'], 403);
        }

        $accessLevel = $data['access_level'] ?? 'public';
        if (in_array($type, ['lecture', 'meeting'], true)) {
            $accessLevel = 'public';
        }

        $tags = $data['department_tags'] ?? [];
        if (in_array($type, ['lecture', 'meeting'], true) && empty($tags)) {
            return response()->json(['message' => 'Department tags are required for lectures and meetings.'], 422);
        }

        $notifyScope = $data['notify_scope'] ?? 'local';
        if ($type === 'meeting') {
            $notifyScope = 'local';
        }
        if ($type === 'group_call') {
            $notifyScope = null;
        }

        $room = VoiceRoom::create([
            'title' => $data['title'],
            'type' => $type,
            'status' => $data['status'] ?? 'scheduled',
            'access_level' => $accessLevel,
            'notify_scope' => $notifyScope,
            'is_recorded' => $data['is_recorded'] ?? false,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'organization_name' => $data['organization_name'] ?? $user->work_place,
            'department_name' => $data['department_name'] ?? $user->speciality,
            'department_tags' => $tags ?: null,
            'creator_id' => $user->id,
        ]);

        $room->participants()->syncWithoutDetaching([
            $user->id => ['role' => 'speaker', 'joined_at' => now()],
        ]);

        $this->syncCalendarEvent($room);
        $this->notifyTaggedUsers($room, $user);

        return response()->json($room, 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:200',
            'type' => 'sometimes|string|in:lecture,meeting,group_call',
            'status' => 'sometimes|string|in:scheduled,live,ended,archived',
            'access_level' => 'sometimes|string|in:public,organization,department,invite',
            'notify_scope' => 'sometimes|string|in:global,local',
            'is_recorded' => 'sometimes|boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'organization_name' => 'nullable|string|max:255',
            'department_name' => 'nullable|string|max:255',
            'department_tags' => 'nullable|array',
            'department_tags.*' => 'string|max:100',
        ]);

        $user = $request->user();
        $room = VoiceRoom::findOrFail($id);
        if (!$this->canManageRoom($user, $room)) {
            return response()->json(['message' => 'Only room creator or global admin can edit.'], 403);
        }

        if (isset($data['type']) && in_array($data['type'], ['lecture', 'meeting'], true) && !$this->canCreateLectureOrMeeting($user)) {
            return response()->json(['message' => 'Insufficient permissions to set lecture/meeting type.'], 403);
        }

        $nextType = $data['type'] ?? $room->type;
        $nextTags = $data['department_tags'] ?? $room->department_tags;
        if (in_array($nextType, ['lecture', 'meeting'], true) && empty($nextTags)) {
            return response()->json(['message' => 'Department tags are required for lectures and meetings.'], 422);
        }

        $room->update($data);

        if (in_array($room->type, ['lecture', 'meeting'], true)) {
            $room->access_level = 'public';
            if ($room->type === 'meeting') {
                $room->notify_scope = 'local';
            }
            $room->save();
        }

        $this->syncCalendarEvent($room);

        return response()->json($room);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $room = VoiceRoom::findOrFail($id);
        if (!$this->canManageRoom($user, $room)) {
            return response()->json(['message' => 'Only room creator or global admin can delete.'], 403);
        }

        if ($room->event_id) {
            Event::where('id', $room->event_id)->delete();
        }

        $room->delete();

        return response()->json(['message' => 'Voice room deleted.']);
    }

    public function join(Request $request, $id)
    {
        $user = $request->user();
        $room = VoiceRoom::findOrFail($id);

        if (!$this->canJoinRoom($user, $room)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $room->participants()->syncWithoutDetaching([
            $user->id => ['role' => 'listener', 'joined_at' => now()],
        ]);

        return response()->json(['message' => 'Joined room.']);
    }

    public function leave(Request $request, $id)
    {
        $user = $request->user();
        $room = VoiceRoom::findOrFail($id);

        if ($room->creator_id === $user->id) {
            return response()->json(['message' => 'Creator cannot leave the room.'], 400);
        }

        $room->participants()->updateExistingPivot($user->id, ['left_at' => now()]);
        $room->participants()->detach($user->id);

        return response()->json(['message' => 'Left room.']);
    }

    public function invite(Request $request, $id)
    {
        $data = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $user = $request->user();
        $room = VoiceRoom::findOrFail($id);
        if (!$this->canManageRoom($user, $room)) {
            return response()->json(['message' => 'Only room creator or global admin can invite.'], 403);
        }

        foreach ($data['user_ids'] as $userId) {
            VoiceRoomInvitation::updateOrCreate(
                ['voice_room_id' => $room->id, 'user_id' => $userId],
                ['invited_by' => $user->id, 'status' => 'pending']
            );
        }

        return response()->json(['message' => 'Invitations sent.']);
    }

    public function myInvites(Request $request)
    {
        $user = $request->user();

        $invites = VoiceRoomInvitation::query()
            ->where('user_id', $user->id)
            ->with('room:id,title,type,status,access_level,starts_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($invites);
    }

    public function acceptInvite(Request $request, $id, $inviteId)
    {
        $user = $request->user();
        $room = VoiceRoom::findOrFail($id);
        $invite = VoiceRoomInvitation::where('voice_room_id', $room->id)
            ->where('id', $inviteId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $invite->update(['status' => 'accepted']);
        $room->participants()->syncWithoutDetaching([
            $user->id => ['role' => 'listener', 'joined_at' => now()],
        ]);

        return response()->json(['message' => 'Invitation accepted.']);
    }

    public function declineInvite(Request $request, $id, $inviteId)
    {
        $user = $request->user();
        $room = VoiceRoom::findOrFail($id);
        $invite = VoiceRoomInvitation::where('voice_room_id', $room->id)
            ->where('id', $inviteId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $invite->update(['status' => 'declined']);

        return response()->json(['message' => 'Invitation declined.']);
    }

    private function canCreateLectureOrMeeting($user): bool
    {
        return $user->isGlobalAdmin()
            || $user->department_role === 'head'
            || in_array($user->organization_role, ['chief', 'deputy'], true);
    }

    private function canManageRoom($user, VoiceRoom $room): bool
    {
        return $room->creator_id === $user->id || $user->isGlobalAdmin();
    }

    private function canJoinRoom($user, VoiceRoom $room): bool
    {
        if ($room->type === 'lecture' || $room->type === 'meeting') {
            return true;
        }

        if ($this->canManageRoom($user, $room)) {
            return true;
        }

        return match ($room->access_level) {
            'public' => true,
            'organization' => $user->work_place && $user->work_place === $room->organization_name,
            'department' => $user->speciality && $user->speciality === $room->department_name,
            'invite' => VoiceRoomInvitation::where('voice_room_id', $room->id)
                ->where('user_id', $user->id)
                ->where('status', 'accepted')
                ->exists(),
            default => false,
        };
    }

    private function syncCalendarEvent(VoiceRoom $room): void
    {
        if ($room->type === 'group_call' || !$room->starts_at) {
            if ($room->event_id) {
                Event::where('id', $room->event_id)->delete();
                $room->event_id = null;
                $room->save();
            }
            return;
        }

        $payload = [
            'title' => $room->title,
            'description' => null,
            'type' => $room->type,
            'status' => $room->status,
            'is_online' => true,
            'starts_at' => $room->starts_at,
            'ends_at' => $room->ends_at,
            'organization_name' => $room->organization_name,
            'department_name' => $room->department_name,
            'creator_id' => $room->creator_id,
        ];

        if ($room->event_id) {
            Event::where('id', $room->event_id)->update($payload);
            return;
        }

        $event = Event::create($payload);
        $room->event_id = $event->id;
        $room->save();
    }

    private function notifyTaggedUsers(VoiceRoom $room, User $creator): void
    {
        if (!in_array($room->type, ['lecture', 'meeting'], true)) {
            return;
        }
        if (empty($room->department_tags)) {
            return;
        }

        $query = User::query()
            ->where('id', '!=', $creator->id)
            ->whereIn('speciality', $room->department_tags)
            ->where(function ($q) {
                $q->whereNull('notifications_enabled')
                    ->orWhere('notifications_enabled', true);
            });

        if ($room->type === 'meeting' || $room->notify_scope === 'local') {
            if ($room->organization_name) {
                $query->where('work_place', $room->organization_name);
            }
        }

        $query->chunkById(200, function ($users) use ($room, $creator) {
            foreach ($users as $user) {
                $user->notify(new VoiceRoomNotification(
                    $room,
                    $creator,
                    $room->department_tags ?? [],
                    $room->notify_scope ?? 'local'
                ));
            }
        });
    }
}
