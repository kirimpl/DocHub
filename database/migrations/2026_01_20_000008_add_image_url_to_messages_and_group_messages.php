<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (!Schema::hasColumn('messages', 'image_url')) {
                $table->string('image_url')->nullable()->after('audio_url');
            }
        });

        Schema::table('chat_group_messages', function (Blueprint $table) {
            if (!Schema::hasColumn('chat_group_messages', 'image_url')) {
                $table->string('image_url')->nullable()->after('audio_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (Schema::hasColumn('messages', 'image_url')) {
                $table->dropColumn('image_url');
            }
        });

        Schema::table('chat_group_messages', function (Blueprint $table) {
            if (Schema::hasColumn('chat_group_messages', 'image_url')) {
                $table->dropColumn('image_url');
            }
        });
    }
};
