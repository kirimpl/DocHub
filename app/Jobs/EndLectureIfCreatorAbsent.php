<?php

namespace App\Jobs;

use App\Models\ChatGroup;
use App\Models\ChatGroupMessage;
use App\Models\Lecture;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class EndLectureIfCreatorAbsent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private int $lectureId)
    {
    }

    public function handle(): void
    {
        $lecture = Lecture::find($this->lectureId);
        if (!$lecture || $lecture->status !== 'live') {
            return;
        }

        if (!$lecture->creator_left_at) {
            return;
        }

        if (now()->lt($lecture->creator_left_at->copy()->addMinutes(5))) {
            return;
        }

        $creatorStillInLecture = $lecture->participants()
            ->where('users.id', $lecture->creator_id)
            ->exists();

        if ($creatorStillInLecture) {
            $lecture->creator_left_at = null;
            $lecture->save();
            return;
        }

        $lecture->update([
            'status' => 'ended',
            'ends_at' => $lecture->ends_at ?? now(),
        ]);

        $group = ChatGroup::where('lecture_id', $lecture->id)->first();
        if ($group) {
            $globalAdmins = User::where('global_role', 'admin')->pluck('id')->all();
            $payload = [];
            foreach ($globalAdmins as $adminId) {
                $payload[$adminId] = ['role' => 'admin'];
            }
            if ($payload) {
                $group->members()->sync($payload);
            }
        }

        $memberIds = $lecture->participants()
            ->wherePivot('role', 'member')
            ->pluck('users.id')
            ->all();
        if ($memberIds) {
            $lecture->participants()->detach($memberIds);
        }

        if ($group) {
            ChatGroupMessage::create([
                'chat_group_id' => $group->id,
                'sender_id' => $lecture->creator_id,
                'body' => 'Lecture ended due to creator absence.',
                'is_system' => true,
            ]);
        }
    }
}
