<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_online' => 'boolean',
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

    public function isEnded(): bool
    {
        return in_array($this->status, ['ended', 'archived'], true);
    }
}
