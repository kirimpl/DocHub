<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

use App\Models\Comment;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'content',
        'image',
        'is_public',
        'is_global',
        'organization_name',
        'department_tags',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_global'=> 'boolean',
        'department_tags' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(\App\Models\Like::class);
    }


    public function scopeFeedVisible($query, User $user )
{
        $query->where(function($q)use($user){
            $q->where('is_global',true)
            ->orWhere('user_id',$user->id);

            if($user->work_place){
                $q->orwhere('organization_name',$user->work_place);
            }
        });
    }

    public function scopeFilter($query, array $filters, User $user)
    {
        if (!empty($filters['scope'])) {
            match ($filters['scope']) {
                'global' => $query->where('is_global', true),
                'organization', 'local'  => $query->where('organization_name', $user->work_place),
                'mine'   => $query->where('user_id', $user->id),
                default  => null,
            };
        }
    
        if (!empty($filters['organization'])) {
            $query->where('organization_name', $filters['organization']);
        }

        if (!empty($filters['from'])) {
            $query->whereDate('created_at', '>=', $filters['from']);
        }
    
        if (!empty($filters['to'])) {
            $query->whereDate('created_at', '<=', $filters['to']);
        }
    }
}
