<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\LectureInvitation;
use App\Models\LectureBan;
use App\Models\LectureRecording;

class Lecture extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'starts_at',
        'ends_at',
        'status',
        'is_online',
        'creator_id',
        'creator_left_at',
        'event_id',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_online' => 'boolean',
        'creator_left_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'lecture_participants')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function chatGroup(): HasOne
    {
        return $this->hasOne(ChatGroup::class);
    }

    public function invitations()
    {
        return $this->hasMany(LectureInvitation::class, 'lecture_id');
    }

    public function bans()
    {
        return $this->hasMany(LectureBan::class, 'lecture_id');
    }

    public function recordings(): HasMany
    {
        return $this->hasMany(LectureRecording::class, 'lecture_id');
    }

    public function isEnded(): bool
    {
        return in_array($this->status, ['ended', 'archived'], true);
    }
}
