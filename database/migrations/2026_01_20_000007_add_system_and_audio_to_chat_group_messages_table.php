<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_group_messages', function (Blueprint $table) {
            if (!Schema::hasColumn('chat_group_messages', 'is_system')) {
                $table->boolean('is_system')->default(false)->after('body');
            }
            if (!Schema::hasColumn('chat_group_messages', 'audio_url')) {
                $table->string('audio_url')->nullable()->after('is_system');
            }
            if (!Schema::hasColumn('chat_group_messages', 'image_url')) {
                $table->string('image_url')->nullable()->after('audio_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('chat_group_messages', function (Blueprint $table) {
            if (Schema::hasColumn('chat_group_messages', 'audio_url')) {
                $table->dropColumn('audio_url');
            }
            if (Schema::hasColumn('chat_group_messages', 'image_url')) {
                $table->dropColumn('image_url');
            }
            if (Schema::hasColumn('chat_group_messages', 'is_system')) {
                $table->dropColumn('is_system');
            }
        });
    }
};
