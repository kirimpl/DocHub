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
        ]);

        $memberIds = collect($data['member_ids'] ?? [])
            ->push($user->id)
            ->unique()
            ->values()
            ->all();

        $group->members()->sync($memberIds);

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
        if (!$group->members()->where('users.id', $user->id)->exists()) {
            return response()->json(['message' => 'Not a member of this group.'], 403);
        }
        return response()->json($group->load('members:id,name,avatar'));
    }

    public function leave(Request $request, $id)
    {
        $user = $request->user();
        $group = ChatGroup::findOrFail($id);
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
        if ($group->owner_id !== $user->id) {
            return response()->json(['message' => 'Only owner can delete the group.'], 403);
        }

        $group->delete();
        return response()->json(['message' => 'Group deleted.']);
    }

    public function removeMember(Request $request, $id, $memberId)
    {
        $user = $request->user();
        $group = ChatGroup::findOrFail($id);
        if ($group->owner_id !== $user->id) {
            return response()->json(['message' => 'Only owner can remove members.'], 403);
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

        $group->members()->syncWithoutDetaching($inviteIds);

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
