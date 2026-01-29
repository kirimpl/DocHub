<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ChatGroup;
use App\Models\Message;
use App\Models\User;
use App\Models\VerificationDocument;
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

        $messages = Message::query()
            ->where(function ($query) use ($user, $support) {
                $query->where('sender_id', $user->id)
                    ->where('recipient_id', $support->id);
            })
            ->orWhere(function ($query) use ($user, $support) {
                $query->where('sender_id', $support->id)
                    ->where('recipient_id', $user->id);
            })
            ->orderBy('created_at')
            ->get(['id', 'sender_id', 'recipient_id', 'body', 'created_at']);

        return response()->json([
            'support' => $support,
            'current_user_id' => $user->id,
            'messages' => $messages,
        ]);
    }

    public function sendSupportMessage(Request $request)
    {
        $data = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $user = $request->user();
        $support = $this->getSupportUser();
        if (!$support) {
            return response()->json(['message' => 'Support not available.'], 404);
        }

        $message = Message::create([
            'sender_id' => $user->id,
            'recipient_id' => $support->id,
            'body' => $data['body'],
        ]);

        return response()->json($message, 201);
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

        $messages = Message::query()
            ->where(function ($query) use ($support) {
                $query->where('sender_id', $support->id)
                    ->orWhere('recipient_id', $support->id);
            })
            ->orderByDesc('created_at')
            ->get(['sender_id', 'recipient_id', 'body', 'created_at']);

        $threads = [];
        foreach ($messages as $message) {
            $otherId = $message->sender_id === $support->id
                ? $message->recipient_id
                : $message->sender_id;

            if (!$otherId || isset($threads[$otherId])) {
                continue;
            }

            $threads[$otherId] = [
                'user_id' => $otherId,
                'last_message' => $message->body,
                'last_message_at' => $message->created_at,
            ];
        }

        if (!$threads) {
            return response()->json([]);
        }

        $users = User::whereIn('id', array_keys($threads))
            ->get(['id', 'name', 'email'])
            ->keyBy('id');

        $payload = [];
        foreach ($threads as $userId => $thread) {
            $user = $users->get($userId);
            $payload[] = [
                'user_id' => $userId,
                'name' => $user?->name,
                'email' => $user?->email,
                'last_message' => $thread['last_message'],
                'last_message_at' => $thread['last_message_at'],
            ];
        }

        return response()->json($payload);
    }

    public function supportThreadMessages(Request $request, $userId)
    {
        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $support = $this->getSupportUser();
        if (!$support) {
            return response()->json(['message' => 'Support not available.'], 404);
        }

        $user = User::findOrFail($userId);

        $messages = Message::query()
            ->where(function ($query) use ($user, $support) {
                $query->where('sender_id', $user->id)
                    ->where('recipient_id', $support->id);
            })
            ->orWhere(function ($query) use ($user, $support) {
                $query->where('sender_id', $support->id)
                    ->where('recipient_id', $user->id);
            })
            ->orderBy('created_at')
            ->get(['id', 'sender_id', 'recipient_id', 'body', 'created_at']);

        return response()->json([
            'user' => $user->only(['id', 'name', 'email']),
            'current_user_id' => $support->id,
            'messages' => $messages,
        ]);
    }

    public function sendSupportReply(Request $request, $userId)
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

        $user = User::findOrFail($userId);

        $message = Message::create([
            'sender_id' => $support->id,
            'recipient_id' => $user->id,
            'body' => $data['body'],
        ]);

        return response()->json($message, 201);
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
