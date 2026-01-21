<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasTable('posts')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->index('user_id');
            });
        }

        if (Schema::hasTable('messages')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->index(['recipient_id', 'id']);
                $table->index('sender_id');
            });
        }

        if (Schema::hasTable('follows')) {
            Schema::table('follows', function (Blueprint $table) {
                $table->index('follower_id');
                $table->index('followed_id');
            });
        }

        if (Schema::hasTable('follow_requests')) {
            Schema::table('follow_requests', function (Blueprint $table) {
                $table->index('requester_id');
                $table->index('recipient_id');
            });
        }

        if (Schema::hasTable('friend_requests')) {
            Schema::table('friend_requests', function (Blueprint $table) {
                $table->index('requester_id');
                $table->index('recipient_id');
            });
        }

        if (Schema::hasTable('likes')) {
            Schema::table('likes', function (Blueprint $table) {
                $table->index('post_id');
            });
        }

        if (Schema::hasTable('comments')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->index('post_id');
                $table->index('user_id');
            });
        }

        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->index('notifiable_id');
                $table->index('notifiable_type');
                $table->index('read_at');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('posts')) {
            Schema::table('posts', function (Blueprint $table) {
                $table->dropIndex(['user_id']);
            });
        }

        if (Schema::hasTable('messages')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->dropIndex(['recipient_id', 'id']);
                $table->dropIndex(['sender_id']);
            });
        }

        if (Schema::hasTable('follows')) {
            Schema::table('follows', function (Blueprint $table) {
                $table->dropIndex(['follower_id']);
                $table->dropIndex(['followed_id']);
            });
        }

        if (Schema::hasTable('follow_requests')) {
            Schema::table('follow_requests', function (Blueprint $table) {
                $table->dropIndex(['requester_id']);
                $table->dropIndex(['recipient_id']);
            });
        }

        if (Schema::hasTable('friend_requests')) {
            Schema::table('friend_requests', function (Blueprint $table) {
                $table->dropIndex(['requester_id']);
                $table->dropIndex(['recipient_id']);
            });
        }

        if (Schema::hasTable('likes')) {
            Schema::table('likes', function (Blueprint $table) {
                $table->dropIndex(['post_id']);
            });
        }

        if (Schema::hasTable('comments')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->dropIndex(['post_id']);
                $table->dropIndex(['user_id']);
            });
        }

        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropIndex(['notifiable_id']);
                $table->dropIndex(['notifiable_type']);
                $table->dropIndex(['read_at']);
            });
        }
    }
};
