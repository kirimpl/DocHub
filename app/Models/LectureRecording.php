<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LectureRecording extends Model
{
    use HasFactory;

    protected $fillable = [
        'lecture_id',
        'user_id',
        'file_path',
        'mime_type',
        'file_size',
        'duration_seconds',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function lecture(): BelongsTo
    {
        return $this->belongsTo(Lecture::class, 'lecture_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
