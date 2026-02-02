<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\MessageReaction;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'recipient_id',
        'support_ticket_id',
        'message_type',
        'body',
        'audio_url',
        'image_url',
        'shared_post_id',
        'shared_user_id',
        'reply_to_message_id',
        'read_at',
        'deleted_by',
        'is_pinned',
        'pinned_by',
    ];

    protected $dates = ['read_at'];

    protected $casts = [
        'is_pinned' => 'boolean',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_message_id');
    }

    public function sharedPost(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'shared_post_id');
    }

    public function sharedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shared_user_id');
    }

    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }
}
