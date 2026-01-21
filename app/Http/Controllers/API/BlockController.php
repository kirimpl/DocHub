<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\UserBlock;

class BlockController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $blocked = $user->blockedUsers()
            ->select('users.id', 'users.name', 'users.email', 'users.avatar', 'users.is_online')
            ->get();

        return response()->json($blocked);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'blocked_id' => 'required|exists:users,id',
        ]);

        $user = $request->user();
        $blockedId = (int) $data['blocked_id'];

        if ($user->id === $blockedId) {
            return response()->json(['message' => 'Cannot block yourself'], 400);
        }

        UserBlock::firstOrCreate([
            'blocker_id' => $user->id,
            'blocked_id' => $blockedId,
        ]);

        $blockedUser = User::find($blockedId);
        if ($blockedUser) {
            $user->following()->detach($blockedId);
            $user->followers()->detach($blockedId);
            $user->friends()->detach($blockedId);
            $blockedUser->friends()->detach($user->id);
        }

        return response()->json(['message' => 'User blocked', 'blocked_id' => $blockedId]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        UserBlock::where('blocker_id', $user->id)->where('blocked_id', $id)->delete();
        return response()->json(['message' => 'User unblocked', 'blocked_id' => (int) $id]);
    }
}
