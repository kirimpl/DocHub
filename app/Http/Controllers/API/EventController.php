<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventInvitation;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        return Event::query()
            ->with('creator:id,name,avatar')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function show(Request $request, $id)
    {
        $event = Event::with('creator:id,name,avatar')->findOrFail($id);
        return response()->json($event);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'nullable|string',
            'type' => 'sometimes|string|in:lecture,meeting',
            'status' => 'sometimes|string|in:scheduled,live,ended,archived',
            'is_online' => 'sometimes|boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'organization_name' => 'nullable|string|max:255',
            'department_name' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $event = Event::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'] ?? 'meeting',
            'status' => $data['status'] ?? 'scheduled',
            'is_online' => $data['is_online'] ?? true,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'organization_name' => $data['organization_name'] ?? $user->work_place,
            'department_name' => $data['department_name'] ?? $user->speciality,
            'creator_id' => $user->id,
        ]);

        return response()->json($event, 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'type' => 'sometimes|string|in:lecture,meeting',
            'status' => 'sometimes|string|in:scheduled,live,ended,archived',
            'is_online' => 'sometimes|boolean',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date',
            'organization_name' => 'nullable|string|max:255',
            'department_name' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $event = Event::findOrFail($id);
        if ($event->creator_id !== $user->id && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Only event creator or global admin can edit.'], 403);
        }

        $event->update($data);

        return response()->json($event);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $event = Event::findOrFail($id);
        if ($event->creator_id !== $user->id && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Only event creator or global admin can delete.'], 403);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted.']);
    }

    public function calendar(Request $request)
    {
        $data = $request->validate([
            'from' => 'required|date',
            'to' => 'required|date',
        ]);

        $from = $data['from'];
        $to = $data['to'];

        $events = Event::query()
            ->with('creator:id,name,avatar')
            ->whereNotNull('starts_at')
            ->where(function ($query) use ($from, $to) {
                $query->whereBetween('starts_at', [$from, $to])
                    ->orWhere(function ($sub) use ($from) {
                        $sub->whereNotNull('ends_at')
                            ->whereDate('starts_at', '<=', $from)
                            ->whereDate('ends_at', '>=', $from);
                    });
            })
            ->orderBy('starts_at')
            ->get();

        return response()->json($events);
    }

    public function join(Request $request, $id)
    {
        $user = $request->user();
        $event = Event::findOrFail($id);

        $event->participants()->syncWithoutDetaching([
            $user->id => ['role' => 'participant', 'status' => 'joined', 'joined_at' => now()],
        ]);

        return response()->json(['message' => 'Joined event.']);
    }

    public function leave(Request $request, $id)
    {
        $user = $request->user();
        $event = Event::findOrFail($id);

        if ($event->creator_id === $user->id) {
            return response()->json(['message' => 'Creator cannot leave the event.'], 400);
        }

        $event->participants()->detach($user->id);

        return response()->json(['message' => 'Left event.']);
    }

    public function invite(Request $request, $id)
    {
        $data = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $user = $request->user();
        $event = Event::findOrFail($id);
        if ($event->creator_id !== $user->id && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Only event creator or global admin can invite.'], 403);
        }

        foreach ($data['user_ids'] as $userId) {
            EventInvitation::updateOrCreate(
                ['event_id' => $event->id, 'user_id' => $userId],
                ['invited_by' => $user->id, 'status' => 'pending']
            );
        }

        return response()->json(['message' => 'Invitations sent.']);
    }

    public function acceptInvite(Request $request, $id, $inviteId)
    {
        $user = $request->user();
        $event = Event::findOrFail($id);
        $invite = EventInvitation::where('event_id', $event->id)
            ->where('id', $inviteId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $invite->update(['status' => 'accepted']);
        $event->participants()->syncWithoutDetaching([
            $user->id => ['role' => 'participant', 'status' => 'accepted', 'joined_at' => now()],
        ]);

        return response()->json(['message' => 'Invitation accepted.']);
    }

    public function declineInvite(Request $request, $id, $inviteId)
    {
        $user = $request->user();
        $event = Event::findOrFail($id);
        $invite = EventInvitation::where('event_id', $event->id)
            ->where('id', $inviteId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $invite->update(['status' => 'declined']);

        return response()->json(['message' => 'Invitation declined.']);
    }

    public function myInvites(Request $request)
    {
        $user = $request->user();

        $invites = EventInvitation::query()
            ->where('user_id', $user->id)
            ->with('event:id,title,type,status,starts_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($invites);
    }
}
