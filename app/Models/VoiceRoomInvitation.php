<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoiceRoomInvitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'voice_room_id',
        'user_id',
        'invited_by',
        'status',
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(VoiceRoom::class, 'voice_room_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
}
