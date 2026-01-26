<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('last_name')->nullable();
            $table->string('sex', 20)->nullable();
            $table->string('email')->unique();
            $table->string('email_visibility', 20)->default('everyone');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->integer('work_experience')->nullable();
            $table->string('work_place')->nullable();
            $table->string('speciality')->nullable();
            $table->string('secondary_work_place')->nullable();
            $table->string('secondary_speciality')->nullable();
            $table->string('category')->nullable();
            $table->string('position')->nullable();
            $table->string('organization_role', 20)->default('staff');
            $table->string('department_role', 20)->default('staff');
            $table->string('global_role', 20)->default('user');
            $table->string('username')->nullable();
            $table->string('phone_number')->unique()->nullable();
            $table->date('birth_date')->nullable();
            $table->string('education')->nullable();
            $table->string('avatar')->nullable();
            $table->string('cover_image')->nullable();
            $table->text('bio')->nullable();
            $table->string('status_text', 140)->nullable();
            $table->boolean('is_private')->default(false);
            $table->string('posts_visibility', 20)->default('everyone');
            $table->string('comments_visibility', 20)->default('everyone');
            $table->string('messages_visibility', 20)->default('everyone');
            $table->boolean('notifications_enabled')->default(true);
            $table->boolean('show_last_seen')->default(true);
            $table->boolean('show_status')->default(true);
            $table->boolean('is_online')->default(false);
            $table->timestamp('last_seen')->nullable();
            $table->string('verification_status')->default('pending');
            $table->timestamp('verified_at')->nullable();

            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
