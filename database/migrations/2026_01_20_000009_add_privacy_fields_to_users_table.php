<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('status_text', 140)->nullable()->after('bio');
            $table->boolean('show_last_seen')->default(true)->after('last_seen');
            $table->boolean('show_status')->default(true)->after('show_last_seen');
            $table->boolean('allow_messages_from_non_friends')->default(true)->after('show_status');
            $table->boolean('show_followers')->default(true)->after('allow_messages_from_non_friends');
            $table->boolean('show_following')->default(true)->after('show_followers');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'status_text',
                'show_last_seen',
                'show_status',
                'allow_messages_from_non_friends',
                'show_followers',
                'show_following',
            ]);
        });
    }
};
