<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
  
    public function view(User $user, Message $message)
    {
        return $message->sender_id === $user->id || $message->recipient_id === $user->id;
    }
}
