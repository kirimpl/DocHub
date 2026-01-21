<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('posts_visibility', 20)->default('everyone')->after('show_following');
            $table->string('comments_visibility', 20)->default('everyone')->after('posts_visibility');
            $table->string('messages_visibility', 20)->default('everyone')->after('comments_visibility');
            $table->string('cover_image')->nullable()->after('avatar');
            $table->foreignId('pinned_post_id')->nullable()->constrained('posts')->nullOnDelete()->after('cover_image');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['pinned_post_id']);
            $table->dropColumn([
                'posts_visibility',
                'comments_visibility',
                'messages_visibility',
                'cover_image',
                'pinned_post_id',
            ]);
        });
    }
};
