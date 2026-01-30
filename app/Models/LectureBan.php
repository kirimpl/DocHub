<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LectureBan extends Model
{
    use HasFactory;

    protected $fillable = [
        'lecture_id',
        'user_id',
        'banned_by',
        'reason',
    ];

    public function lecture(): BelongsTo
    {
        return $this->belongsTo(Lecture::class, 'lecture_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function banner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'banned_by');
    }
}
