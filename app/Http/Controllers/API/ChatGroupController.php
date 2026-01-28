<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ChatGroup;
use App\Models\ChatGroupMessage;

class ChatGroupController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $groups = $user->chatGroups()
            ->withCount('members')
            ->orderBy('name')
            ->get();

        if ($user->isGlobalAdmin()) {
            $lectureGroups = ChatGroup::where('type', 'lecture')
                ->whereHas('lecture', function ($query) {
                    $query->whereIn('status', ['ended', 'archived']);
                })
                ->withCount('members')
                ->get();
            $groups = $groups->merge($lectureGroups)->unique('id')->values();
        }
        return response()->json($groups);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'member_ids' => 'array',
            'member_ids.*' => 'exists:users,id',
        ]);

        $user = $request->user();
        $group = ChatGroup::create([
            'name' => $data['name'],
            'owner_id' => $user->id,
            'type' => 'custom',
            'organization_name' => $user->work_place,
            'department_name' => $user->speciality,
            'is_system' => false,
        ]);

        $memberIds = collect($data['member_ids'] ?? [])
            ->push($user->id)
            ->unique()
            ->values()
            ->all();

        $memberPayload = [];
        foreach ($memberIds as $memberId) {
            $memberPayload[$memberId] = [
                'role' => $memberId === $user->id ? 'admin' : 'member',
            ];
        }
        $group->members()->sync($memberPayload);

        $memberNames = \App\Models\User::whereIn('id', $memberIds)
            ->pluck('name')
            ->all();
        foreach ($memberNames as $name) {
            ChatGroupMessage::create([
                'chat_group_id' => $group->id,
                'sender_id' => $user->id,
                'body' => $name . ' вступил в группу',
                'is_system' => true,
            ]);
        }

        return response()->json($group->loadCount('members'), 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $group = ChatGroup::withCount('members')->findOrFail($id);
        if ($group->type === 'lecture' && $group->lecture && $group->lecture->isEnded()) {
            if (!$user->isGlobalAdmin()) {
                return response()->json(['message' => 'Lecture chat is closed.'], 403);
            }
            return response()->json($group->load('members:id,name,avatar'));
        }
        if (!$group->members()->where('users.id', $user->id)->exists()) {
            return response()->json(['message' => 'Not a member of this group.'], 403);
        }
        return response()->json($group->load('members:id,name,avatar'));
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $user = $request->user();
        $group = ChatGroup::findOrFail($id);
        if (!$group->isAdmin($user)) {
            return response()->json(['message' => 'Only group admins can edit the group.'], 403);
        }

        $group->update(['name' => $data['name']]);
        return response()->json($group);
    }

    public function leave(Request $request, $id)
    {
        $user = $request->user();
        $group = ChatGroup::findOrFail($id);
        if ($group->is_system) {
            return response()->json(['message' => 'System groups cannot be left.'], 403);
        }
        if (!$group->members()->where('users.id', $user->id)->exists()) {
            return response()->json(['message' => 'Not a member of this group.'], 403);
        }
        if ($group->owner_id === $user->id) {
            return response()->json(['message' => 'Owner cannot leave the group.'], 400);
        }

        ChatGroupMessage::create([
            'chat_group_id' => $group->id,
            'sender_id' => $user->id,
            'body' => $user->name . ' вышел из чата',
            'is_system' => true,
        ]);

        $group->members()->detach($user->id);
        return response()->json(['message' => 'Left group.']);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $group = ChatGroup::findOrFail($id);
        if (!$group->isAdmin($user)) {
            return response()->json(['message' => 'Only group admins can delete the group.'], 403);
        }

        $group->delete();
        return response()->json(['message' => 'Group deleted.']);
    }

    public function removeMember(Request $request, $id, $memberId)
    {
        $user = $request->user();
        $group = ChatGroup::findOrFail($id);
        if (!$group->isAdmin($user)) {
            return response()->json(['message' => 'Only group admins can remove members.'], 403);
        }
        if ($memberId == $user->id) {
            return response()->json(['message' => 'Owner cannot remove themselves.'], 400);
        }

        if (!$group->members()->where('users.id', $memberId)->exists()) {
            return response()->json(['message' => 'User is not a member.'], 404);
        }

        $member = \App\Models\User::find($memberId);
        $group->members()->detach($memberId);

        if ($member) {
            ChatGroupMessage::create([
                'chat_group_id' => $group->id,
                'sender_id' => $user->id,
                'body' => $member->name . ' исключен из группы',
                'is_system' => true,
            ]);
        }

        return response()->json(['message' => 'Member removed.']);
    }

    public function addMembers(Request $request, $id)
    {
        $data = $request->validate([
            'member_ids' => 'required|array',
            'member_ids.*' => 'exists:users,id',
        ]);

        $user = $request->user();
        $group = ChatGroup::findOrFail($id);
        if (!$group->members()->where('users.id', $user->id)->exists()) {
            return response()->json(['message' => 'Not a member of this group.'], 403);
        }

        $friendIds = $user->friends()->pluck('users.id')->toArray();
        $inviteIds = collect($data['member_ids'])
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => in_array($id, $friendIds, true))
            ->values()
            ->all();

        if (!$inviteIds) {
            return response()->json(['message' => 'No valid friends to invite.'], 400);
        }

        $invitePayload = [];
        foreach ($inviteIds as $inviteId) {
            $invitePayload[$inviteId] = ['role' => 'member'];
        }
        $group->members()->syncWithoutDetaching($invitePayload);

        $memberNames = \App\Models\User::whereIn('id', $inviteIds)
            ->pluck('name')
            ->all();
        foreach ($memberNames as $name) {
            ChatGroupMessage::create([
                'chat_group_id' => $group->id,
                'sender_id' => $user->id,
                'body' => $name . ' вступил в группу',
                'is_system' => true,
            ]);
        }

        return response()->json($group->loadCount('members'));
    }
}
