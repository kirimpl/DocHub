<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Lecture;
use App\Models\LectureReport;
use App\Models\User;
use App\Models\UserReport;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function reportLecture(Request $request)
    {
        $data = $request->validate([
            'lecture_id' => 'required|exists:lectures,id',
            'body' => 'nullable|string',
        ]);

        $user = $request->user();
        $lecture = Lecture::findOrFail($data['lecture_id']);

        $isParticipant = $lecture->participants()
            ->where('users.id', $user->id)
            ->exists();

        if (!$isParticipant && !$user->isGlobalAdmin()) {
            return response()->json(['message' => 'You are not in this lecture.'], 403);
        }

        $report = LectureReport::create([
            'lecture_id' => $lecture->id,
            'reporter_id' => $user->id,
            'body' => $data['body'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json($report, 201);
    }

    public function reportUser(Request $request)
    {
        $data = $request->validate([
            'reported_user_id' => 'required|exists:users,id',
            'lecture_id' => 'nullable|exists:lectures,id',
            'body' => 'nullable|string',
        ]);

        $user = $request->user();
        if ((int) $data['reported_user_id'] === (int) $user->id) {
            return response()->json(['message' => 'Cannot report yourself.'], 422);
        }

        if (!empty($data['lecture_id'])) {
            $lecture = Lecture::findOrFail($data['lecture_id']);
            $isParticipant = $lecture->participants()
                ->where('users.id', $user->id)
                ->exists();
            if (!$isParticipant && !$user->isGlobalAdmin()) {
                return response()->json(['message' => 'You are not in this lecture.'], 403);
            }
        }

        $report = UserReport::create([
            'reporter_id' => $user->id,
            'reported_user_id' => $data['reported_user_id'],
            'lecture_id' => $data['lecture_id'] ?? null,
            'body' => $data['body'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json($report, 201);
    }

    public function lectureReports(Request $request)
    {
        $user = $request->user();
        if (!$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $status = $request->query('status', 'pending');

        return LectureReport::query()
            ->with([
                'lecture:id,title,creator_id',
                'reporter:id,name,email',
                'reviewer:id,name',
            ])
            ->when($status, fn($q) => $q->where('status', $status))
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function userReports(Request $request)
    {
        $user = $request->user();
        if (!$user->isGlobalAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $status = $request->query('status', 'pending');

        return UserReport::query()
            ->with([
                'reporter:id,name,email',
                'reportedUser:id,name,email',
                'lecture:id,title',
                'reviewer:id,name',
            ])
            ->when($status, fn($q) => $q->where('status', $status))
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function approveLectureReport(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $report = LectureReport::findOrFail($id);
        $report->update([
            'status' => 'approved',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Report approved.']);
    }

    public function rejectLectureReport(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $report = LectureReport::findOrFail($id);
        $report->update([
            'status' => 'rejected',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Report rejected.']);
    }

    public function approveUserReport(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $report = UserReport::with('reportedUser')->findOrFail($id);
        $report->update([
            'status' => 'approved',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        $this->applyUserRestriction($report->reportedUser);

        return response()->json(['message' => 'Report approved.']);
    }

    public function rejectUserReport(Request $request, $id)
    {
        $admin = $request->user();
        if (!$admin->isGlobalAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $report = UserReport::findOrFail($id);
        $report->update([
            'status' => 'rejected',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'Report rejected.']);
    }

    private function applyUserRestriction(User $user): void
    {
        $warnings = (int) $user->report_warnings;
        $warnings += 1;

        $now = now();
        $restrictedUntil = match (true) {
            $warnings === 1 => $now->copy()->addDay(),
            $warnings === 2 => $now->copy()->addDays(7),
            default => $now->copy()->addDays(30),
        };

        $user->report_warnings = $warnings;
        $user->restricted_until = $restrictedUntil;
        $user->save();
    }
}
