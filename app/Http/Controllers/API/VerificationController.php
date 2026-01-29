<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ChatGroup;
use App\Models\Message;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\VerificationDocument;
use App\Events\MessageSent;
use App\Events\SupportTicketResolved;
use App\Notifications\NewMessageNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VerificationController extends Controller
{
    public function status(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'status' => $user->verification_status,
            'verified_at' => $user->verified_at,
        ]);
    }

    public function support(Request $request)
    {
        $support = $this->getSupportUser();
        return response()->json(['support' => $support]);
    }

    public function supportMessages(Request $request)
    {
        $user = $request->user();
        $support = $this->getSupportUser();
        if (!$support) {
            return response()->json(['message' => 'Support not available.'], 404);
        }

        $ticketId = $request->query('ticket_id');
        $ticketQuery = SupportTicket::where('user_id', $user->id);
        $ticket = $ticketId
            ? $ticketQuery->where('id', $ticketId)->first()
            : $ticketQuery->where('status', 'open')->orderByDesc('created_at')->first();

        if (!$ticket) {
            $ticket = $ticketQuery->orderByDesc('created_at')->first();
        }

        $messages = Message::query()
            ->where(function ($query) use ($user, $support) {
                $query->where(function ($sub) use ($user, $support) {
                    $sub->where('sender_id', $user->id)
                        ->where('recipient_id', $support->id);
                })->orWhere(function ($sub) use ($user, $support) {
                    $sub->where('sender_id', $support->id)
                        ->where('recipient_id', $user->id);
                });
            })
            ->when($ticket, function ($query) use ($ticket) {
                $query->where('support_ticket_id', $ticket->id);
            })
            ->orderBy('created_at')
            ->get(['id', 'sender_id', 'recipient_id', 'body', 'created_at']);

        return response()->json([
            'support' => $support,
            'current_user_id' => $user->id,
            'ticket' => $ticket ? [
                'id' => $ticket->id,
                'status' => $ticket->status,
                'resolved_by' => $ticket->resolved_by,
                'resolved_by_name' => $ticket->resolver?->name,
                'resolved_at' => $ticket->resolved_at,
            ] : null,
            'messages' => $messages,
        ]);
    }

    public function supportTickets(Request $request)
    {
        $user = $request->user();
        $status = $request->query('status');

        $tickets = SupportTicket::where('user_id', $user->id)
            ->when($status, function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->orderByDesc('created_at')
            ->get(['id', 'status', 'last_message_at', 'resolved_at']);

        return response()->json($tickets);
    }

    public function sendSupportMessage(Request $request)
    {
        $data = $request->validate([
            'body' => 'required|string|max:2000',
            'ticket_id' => 'nullable|integer',
        ]);

        $user = $request->user();
        $support = $this->getSupportUser();
        if (!$support) {
            return response()->json(['message' => 'Support not available.'], 404);
        }

        $ticket = null;
        if (!empty($data['ticket_id'])) {
            $ticket = SupportTicket::where('user_id', $user->id)->where('id', $data['ticket_id'])->first();
            if (!$ticket) {
                return response()->json(['message' => 'Ticket not found.'], 404);
            }
            if ($ticket->status !== 'open') {
                return response()->json(['message' => 'Ticket resolved.'], 409);
            }
        } else {
            $ticket = SupportTicket::where('user_id', $user->id)
                ->where('status', 'open')
                ->orderByDesc('created_at')
                ->first();
        }

        if (!$ticket) {
            $ticket = SupportTicket::create([
                'user_id' => $user->id,
                'status' => 'open',
                'last_message_at' => now(),
            ]);
        }

        if ($ticket->status !== 'open') {
            $ticket->status = 'open';
            $ticket->resolved_by = null;
            $ticket->resolved_at = null;
        }
        $ticket->last_message_at = now();
        $ticket->save();

        $message = Message::create([
            'sender_id' => $user->id,
            'recipient_id' => $support->id,
            'support_ticket_id' => $ticket->id,
            'body' => $data['body'],
        ]);

        try {
            event(new MessageSent($message));
            if ($support->notifications_enabled ?? true) {
                $support->notify(new NewMessageNotification($message));
            }
        } catch (\Throwable $e) {
            \Log::warning('Support message broadcast failed', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'ticket_id' => $ticket->id,
            'message' => $message,
        ], 201);
    }

    public function supportThreads(Request $request)
    {
        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $support = $this->getSupportUser();
        if (!$support) {
            return response()->json([]);
        }

        $status = $request->query('status', 'open');
        $tickets = SupportTicket::with(['user:id,name,email', 'resolver:id,name'])
            ->when($status, function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->orderByDesc('last_message_at')
            ->get();

        $payload = $tickets->map(function (SupportTicket $ticket) {
            return [
                'ticket_id' => $ticket->id,
                'user_id' => $ticket->user_id,
                'name' => $ticket->user?->name,
                'email' => $ticket->user?->email,
                'status' => $ticket->status,
                'last_message_at' => $ticket->last_message_at,
                'resolved_by' => $ticket->resolved_by,
                'resolved_by_name' => $ticket->resolver?->name,
                'resolved_at' => $ticket->resolved_at,
            ];
        });

        return response()->json($payload);
    }

    public function supportThreadMessages(Request $request, $ticketId)
    {
        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $support = $this->getSupportUser();
        if (!$support) {
            return response()->json(['message' => 'Support not available.'], 404);
        }

        $ticket = SupportTicket::with('user:id,name,email')->findOrFail($ticketId);
        $user = $ticket->user;

        $messages = Message::query()
            ->where(function ($query) use ($user, $support) {
                $query->where(function ($sub) use ($user, $support) {
                    $sub->where('sender_id', $user->id)
                        ->where('recipient_id', $support->id);
                })->orWhere(function ($sub) use ($user, $support) {
                    $sub->where('sender_id', $support->id)
                        ->where('recipient_id', $user->id);
                });
            })
            ->where('support_ticket_id', $ticket->id)
            ->orderBy('created_at')
            ->get(['id', 'sender_id', 'recipient_id', 'body', 'created_at']);

        $senderIds = $messages->pluck('sender_id')->unique()->values();
        $senders = User::whereIn('id', $senderIds)->get(['id', 'name'])->keyBy('id');
        $messages = $messages->map(function ($message) use ($senders) {
            $message->sender_name = $senders->get($message->sender_id)?->name;
            return $message;
        });

        return response()->json([
            'user' => $user->only(['id', 'name', 'email']),
            'ticket' => $ticket ? [
                'id' => $ticket->id,
                'status' => $ticket->status,
                'resolved_by' => $ticket->resolved_by,
                'resolved_by_name' => $ticket->resolver?->name,
                'resolved_at' => $ticket->resolved_at,
            ] : null,
            'current_user_id' => $support->id,
            'messages' => $messages,
        ]);
    }

    public function sendSupportReply(Request $request, $ticketId)
    {
        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $data = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $support = $this->getSupportUser();
        if (!$support) {
            return response()->json(['message' => 'Support not available.'], 404);
        }

        $ticket = SupportTicket::with('user')->findOrFail($ticketId);
        $user = $ticket->user;
        if ($ticket->status !== 'open') {
            return response()->json(['message' => 'Ticket resolved.'], 409);
        }
        $ticket->last_message_at = now();
        $ticket->save();

        $message = Message::create([
            'sender_id' => $support->id,
            'recipient_id' => $user->id,
            'support_ticket_id' => $ticket->id,
            'body' => $data['body'],
        ]);

        try {
            event(new MessageSent($message));
            if ($user->notifications_enabled ?? true) {
                $user->notify(new NewMessageNotification($message));
            }
        } catch (\Throwable $e) {
            \Log::warning('Support reply broadcast failed', ['error' => $e->getMessage()]);
        }

        return response()->json($message, 201);
    }

    public function resolveSupportTicket(Request $request, $ticketId)
    {
        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $support = $this->getSupportUser();
        if (!$support) {
            return response()->json(['message' => 'Support not available.'], 404);
        }

        $ticket = SupportTicket::with('user')->findOrFail($ticketId);
        $user = $ticket->user;

        $ticket->status = 'resolved';
        $ticket->resolved_by = $admin->id;
        $ticket->resolved_at = now();
        $ticket->last_cleared_at = now();
        $ticket->save();

        try {
            event(new SupportTicketResolved($user, $ticket));
        } catch (\Throwable $e) {
            \Log::warning('Support resolve broadcast failed', ['error' => $e->getMessage()]);
        }

        return response()->json(['message' => 'Ticket resolved.']);
    }

    public function deleteSupportTicket(Request $request, $ticketId)
    {
        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $ticket = SupportTicket::findOrFail($ticketId);
        if ($ticket->status !== 'resolved') {
            return response()->json(['message' => 'Only resolved tickets can be deleted.'], 409);
        }

        Message::where('support_ticket_id', $ticket->id)->delete();
        $ticket->delete();

        return response()->json(['message' => 'Ticket deleted.']);
    }

    public function documents(Request $request)
    {
        $user = $request->user();
        return response()->json($user->verificationDocuments()->latest()->get());
    }

    public function uploadDocument(Request $request)
    {
        $data = $request->validate([
            'document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:8192',
            'notes' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $path = $request->file('document')->store('verification_docs', 'public');

        $doc = VerificationDocument::create([
            'user_id' => $user->id,
            'file_path' => $path,
            'status' => 'pending',
            'notes' => $data['notes'] ?? null,
        ]);

        if ($user->verification_status !== 'pending') {
            $user->verification_status = 'pending';
            $user->save();
        }

        return response()->json($doc, 201);
    }

    public function pending(Request $request)
    {
        $user = $request->user();
        if (!$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $pending = User::where('verification_status', 'pending')
            ->with('verificationDocuments')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($pending);
    }

    public function approved(Request $request)
    {
        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $groups = VerificationDocument::query()
            ->where('status', 'approved')
            ->with(['user:id,name,email', 'reviewer:id,name'])
            ->orderByDesc('reviewed_at')
            ->get()
            ->groupBy('user_id');

        $payload = $groups->map(function ($items) {
            $doc = $items->first();
            return [
                'user_id' => $doc->user_id,
                'name' => $doc->user?->name,
                'email' => $doc->user?->email,
                'reviewed_by' => $doc->reviewed_by,
                'reviewed_by_name' => $doc->reviewer?->name,
                'reviewed_at' => optional($doc->reviewed_at)->toDateTimeString(),
            ];
        })->values();

        return response()->json($payload);
    }

    public function approve(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $user = User::findOrFail($id);
        $user->verification_status = 'verified';
        $user->verified_at = now();
        $user->save();

        $user->verificationDocuments()->update([
            'status' => 'approved',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        $this->syncSystemGroups($user);
        $this->ensureDefaultGroups($user);
        $this->ensureSecondaryGroups($user);

        return response()->json(['message' => 'User verified.']);
    }

    public function reject(Request $request, $id)
    {
        $data = $request->validate([
            'notes' => 'nullable|string|max:255',
        ]);

        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $user = User::findOrFail($id);
        $user->verification_status = 'rejected';
        $user->verified_at = null;
        $user->save();

        $user->verificationDocuments()->update([
            'status' => 'rejected',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json(['message' => 'User rejected.']);
    }

    private function ensureDefaultGroups(User $user): void
    {
        $orgName = $user->work_place;
        $deptName = $user->speciality;

        if ($orgName) {
            $orgGroup = ChatGroup::firstOrCreate(
                [
                    'type' => 'organization',
                    'organization_name' => $orgName,
                    'department_name' => null,
                ],
                [
                    'name' => 'Общая группа: ' . $orgName,
                    'owner_id' => $user->id,
                    'is_system' => true,
                ]
            );

            $orgRole = in_array($user->organization_role, ['chief', 'deputy'], true) ? 'admin' : 'member';
            $orgGroup->members()->syncWithoutDetaching([
                $user->id => ['role' => $orgRole],
            ]);
        }

        if ($orgName && $deptName) {
            $deptGroup = ChatGroup::firstOrCreate(
                [
                    'type' => 'department',
                    'organization_name' => $orgName,
                    'department_name' => $deptName,
                ],
                [
                    'name' => 'Отделение: ' . $deptName,
                    'owner_id' => $user->id,
                    'is_system' => true,
                ]
            );

            $deptRole = $user->department_role === 'head' ? 'admin' : 'member';
            $deptGroup->members()->syncWithoutDetaching([
                $user->id => ['role' => $deptRole],
            ]);
        }
    }

    private function ensureSecondaryGroups(User $user): void
    {
        if (!$user->secondary_work_place) {
            return;
        }

        $tempUser = clone $user;
        $tempUser->work_place = $user->secondary_work_place;
        $tempUser->speciality = $user->secondary_speciality ?: $user->speciality;

        $this->ensureDefaultGroups($tempUser);
    }

    private function syncSystemGroups(User $user): void
    {
        $groups = ChatGroup::where('is_system', true)
            ->whereIn('type', ['organization', 'department'])
            ->get();

        foreach ($groups as $group) {
            $group->members()->detach($user->id);
        }
    }

    private function getSupportUser(): ?User
    {
        return User::where('global_role', 'admin')
            ->select('id', 'name', 'avatar', 'email')
            ->first();
    }
}
