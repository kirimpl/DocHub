<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voice_room_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('voice_room_id')->constrained('voice_rooms')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('invited_by')->constrained('users')->onDelete('cascade');
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->unique(['voice_room_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voice_room_invitations');
    }
};
