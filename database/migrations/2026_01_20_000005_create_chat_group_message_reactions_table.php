<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_group_message_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_group_message_id')
                ->constrained('chat_group_messages')
                ->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('emoji', 16);
            $table->timestamps();
            $table->unique(['chat_group_message_id', 'user_id', 'emoji']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_group_message_reactions');
    }
};
