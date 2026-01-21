<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatGroupMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_group_id',
        'sender_id',
        'body',
        'reply_to_message_id',
        'is_system',
        'audio_url',
        'image_url',
        'is_pinned',
        'pinned_by',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'is_pinned' => 'boolean',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(ChatGroup::class, 'chat_group_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(ChatGroupMessage::class, 'reply_to_message_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(ChatGroupMessageReaction::class);
    }
}
