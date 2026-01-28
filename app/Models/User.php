<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Post;
use App\Models\Message;
use App\Models\Interest;
use App\Models\FriendRequest;
use App\Models\ChatGroup;
use App\Models\VoiceRoom;
use App\Models\VoiceRoomInvitation;
use App\Models\Event;
use App\Models\EventInvitation;
use App\Models\VerificationDocument;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

   
    protected $fillable = [
        'name',
        'sex',
        'username',
        'phone_number',
        'birth_date',
        'education',
        'email',
        'work_place',
        'city',
        'secondary_work_place',
        'work_experience',
        'speciality',
        'secondary_speciality',
        'category',
        'position',
        'organization_role',
        'department_role',
        'global_role',
        'password',
        'avatar',
        'cover_image',
        'bio',
        'status_text',
        'is_private',
        'is_online',
        'last_seen',
        'show_last_seen',
        'show_status',
        'email_visibility',
        'last_name',
        'posts_visibility',
        'comments_visibility',
        'messages_visibility',
        'notifications_enabled',
        'pinned_post_id',
        'verification_status',
        'verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_private' => 'boolean',
            'is_online' => 'boolean',
            'last_seen' => 'datetime',
            'show_last_seen' => 'boolean',
            'show_status' => 'boolean',
            'notifications_enabled' => 'boolean',
            'verified_at' => 'datetime',
        ];
    }

 
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

   
   
    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }


    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'recipient_id');
    }

   
    public function interests(): BelongsToMany
    {
        return $this->belongsToMany(Interest::class, 'interest_user')
            ->withTimestamps();
    }

  
    public function friends(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'friends', 'user_id', 'friend_id')
            ->withTimestamps();
    }

    
    public function friendRequestsSent(): HasMany
    {
        return $this->hasMany(FriendRequest::class, 'requester_id');
    }

 
    public function friendRequestsReceived(): HasMany
    {
        return $this->hasMany(FriendRequest::class, 'recipient_id');
    }

    public function chatGroups(): BelongsToMany
    {
        return $this->belongsToMany(ChatGroup::class, 'chat_group_members')
            ->withTimestamps();
    }

    public function voiceRooms(): BelongsToMany
    {
        return $this->belongsToMany(VoiceRoom::class, 'voice_room_participants')
            ->withPivot(['role', 'joined_at', 'left_at'])
            ->withTimestamps();
    }

    public function voiceRoomInvitations(): HasMany
    {
        return $this->hasMany(VoiceRoomInvitation::class, 'user_id');
    }

    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'event_participants')
            ->withPivot(['role', 'status', 'joined_at'])
            ->withTimestamps();
    }

    public function eventInvitations(): HasMany
    {
        return $this->hasMany(EventInvitation::class, 'user_id');
    }

    public function verificationDocuments(): HasMany
    {
        return $this->hasMany(VerificationDocument::class, 'user_id');
    }

    public function blockedUsers(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'user_blocks', 'blocker_id', 'blocked_id')
            ->withTimestamps();
    }

    public function blockedBy(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'user_blocks', 'blocked_id', 'blocker_id')
            ->withTimestamps();
    }

    public function isGlobalAdmin(): bool
    {
        return $this->global_role === 'admin';
    }

    public function isVerified(): bool
    {
        return $this->verification_status === 'verified';
    }
}
