<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('shared_user_id')->nullable()->constrained('users')->nullOnDelete()->after('shared_post_id');
        });

        Schema::table('chat_group_messages', function (Blueprint $table) {
            $table->foreignId('shared_user_id')->nullable()->constrained('users')->nullOnDelete()->after('shared_post_id');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['shared_user_id']);
            $table->dropColumn('shared_user_id');
        });

        Schema::table('chat_group_messages', function (Blueprint $table) {
            $table->dropForeign(['shared_user_id']);
            $table->dropColumn('shared_user_id');
        });
    }
};
