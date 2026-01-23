<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VoiceRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'type',
        'status',
        'access_level',
        'is_recorded',
        'starts_at',
        'ends_at',
        'lecture_id',
        'event_id',
        'organization_name',
        'department_name',
        'department_tags',
        'notify_scope',
        'creator_id',
    ];

    protected $casts = [
        'is_recorded' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'department_tags' => 'array',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'voice_room_participants')
            ->withPivot(['role', 'joined_at', 'left_at'])
            ->withTimestamps();
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(VoiceRoomInvitation::class, 'voice_room_id');
    }
}
