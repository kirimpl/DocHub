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

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

   
    protected $fillable = [
        'name',
        'email',
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
        'allow_messages_from_non_friends',
        'show_followers',
        'show_following',
        'email_visibility',
        'last_name',
        'posts_visibility',
        'comments_visibility',
        'messages_visibility',
        'pinned_post_id',
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
            'allow_messages_from_non_friends' => 'boolean',
            'show_followers' => 'boolean',
            'show_following' => 'boolean',
        ];
    }

 
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

   
    public function following(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'follows', 'follower_id', 'followed_id')
            ->withTimestamps();
    }

  
    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'follows', 'followed_id', 'follower_id')
            ->withTimestamps();
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
}
