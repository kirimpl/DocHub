<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\Lecture;

class ChatGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'owner_id',
        'type',
        'organization_name',
        'department_name',
        'lecture_id',
        'is_system',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chat_group_members', 'chat_group_id', 'user_id')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatGroupMessage::class);
    }

    public function lecture(): BelongsTo
    {
        return $this->belongsTo(Lecture::class);
    }

    public function isAdmin(User $user): bool
    {
        if ($user->isGlobalAdmin()) {
            return true;
        }

        if ($this->owner_id === $user->id) {
            return true;
        }

        $member = $this->members()->where('users.id', $user->id)->first();
        if (!$member) {
            return false;
        }

        return ($member->pivot->role ?? 'member') === 'admin';
    }
}
